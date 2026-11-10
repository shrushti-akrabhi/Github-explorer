import 'dotenv/config';
import crypto from 'node:crypto';
import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { connectDb, User, SavedRepo } from './db.js';

const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, SESSION_SECRET, MONGODB_URI, CLIENT_URL = 'http://localhost:5173', PORT = 4000 } = process.env;
const API = 'https://api.github.com';

// Fail early with a clear message instead of running with a weak or missing secret.
if (!SESSION_SECRET || SESSION_SECRET.length < 16) {
  console.error('SESSION_SECRET is missing or too short (use at least 16 random characters). See README.');
  process.exit(1);
}
if (!MONGODB_URI) {
  console.error('MONGODB_URI is missing. Add your MongoDB connection string to server/.env. See README.');
  process.exit(1);
}

// The GitHub token is encrypted (AES-256-GCM) before it goes into the session, so it is not readable in the database.
const KEY = crypto.createHash('sha256').update(SESSION_SECRET).digest();
function seal(text) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const enc = Buffer.concat([c.update(text, 'utf8'), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString('base64')).join('.');
}
function unseal(value) {
  try {
    const [iv, tag, enc] = value.split('.').map((x) => Buffer.from(x, 'base64'));
    const d = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(enc), d.final()]).toString('utf8');
  } catch {
    return null;
  }
}

const app = express();
app.use(express.json());
// Sessions live in MongoDB, so logins survive a server restart. The browser only holds an httpOnly cookie.
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: MONGODB_URI, collectionName: 'sessions', ttl: 7 * 24 * 60 * 60 }),
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 7 * 864e5 },
}));

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// One place that talks to GitHub: adds the user's token and turns failures into clean errors.
async function gh(path, token, params = {}) {
  const url = new URL(API + path);
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') url.searchParams.set(k, v);
  let res;
  try {
    res = await fetch(url, { headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'User-Agent': 'github-explorer' } });
  } catch {
    throw new HttpError(502, 'network');
  }
  if (res.status === 401) throw new HttpError(401, 'unauthorized');
  if (res.status === 404) throw new HttpError(404, 'notfound');
  if (res.status === 403 || res.status === 429) throw new HttpError(429, 'ratelimit');
  if (res.status === 422) throw new HttpError(422, 'badquery');
  if (!res.ok) throw new HttpError(502, 'http');
  return { data: await res.json(), hasNext: /rel="next"/.test(res.headers.get('link') || '') };
}

// ---------- sign in with GitHub (OAuth) ----------
app.get('/auth/github', (req, res) => {
  if (!GITHUB_CLIENT_ID) return res.redirect(`${CLIENT_URL}/?auth_error=config`);
  req.session.state = crypto.randomBytes(16).toString('hex');
  const p = new URLSearchParams({ client_id: GITHUB_CLIENT_ID, redirect_uri: `${CLIENT_URL}/auth/github/callback`, scope: 'read:user', state: req.session.state });
  res.redirect(`https://github.com/login/oauth/authorize?${p}`);
});

app.get('/auth/github/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state || state !== req.session.state) return res.redirect(`${CLIENT_URL}/?auth_error=state`);
  try {
    const r = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: GITHUB_CLIENT_ID, client_secret: GITHUB_CLIENT_SECRET, code }),
    });
    const { access_token } = await r.json();
    if (!access_token) throw new Error('no token');
    const { data: u } = await gh('/user', access_token);
    // Create the user on first sign-in, update their details and lastLoginAt on every later one.
    const dbUser = await User.findOneAndUpdate(
      { githubId: u.id },
      { $set: { login: u.login, name: u.name, avatarUrl: u.avatar_url, htmlUrl: u.html_url, lastLoginAt: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    req.session.regenerate((err) => {
      if (err) return res.redirect(`${CLIENT_URL}/?auth_error=session`);
      req.session.token = seal(access_token);
      req.session.userId = dbUser.id;
      req.session.user = { login: u.login, name: u.name, avatar_url: u.avatar_url, html_url: u.html_url };
      res.redirect(CLIENT_URL);
    });
  } catch (e) {
    console.error('Sign-in failed:', e.message);
    res.redirect(`${CLIENT_URL}/?auth_error=${e.name?.startsWith('Mongo') ? 'database' : 'exchange'}`);
  }
});

app.post('/auth/logout', (req, res) => req.session.destroy(() => res.json({ ok: true })));

// ---------- API (signed-in users only) ----------
const auth = (req, res, next) => {
  const token = req.session.token && req.session.userId ? unseal(req.session.token) : null;
  if (!token) return res.status(401).json({ error: 'unauthorized' });
  req.token = token; // the plain GitHub token, only ever used on the server
  next();
};
const wrap = (fn) => (req, res, next) => fn(req).then((d) => res.json(d)).catch(next);
const paging = (q) => ({ page: Math.max(1, parseInt(q.page) || 1), per_page: 20 });
const oneOf = (v, list) => (list.includes(v) ? v : undefined);
const shape = (data, p) => ({ items: data.items, total: Math.min(data.total_count, 1000), page: p.page, perPage: p.per_page }); // GitHub only serves the first 1,000 search results

app.get('/api/me', auth, (req, res) => res.json(req.session.user));

// Profile + every repo (up to 300) for pages that filter and sort in the browser.
async function profile(token, userPath, reposPath, extra = {}) {
  const repos = [];
  const first = gh(userPath, token);
  for (let page = 1; page <= 3; page++) {
    const { data, hasNext } = await gh(reposPath, token, { per_page: 100, sort: 'updated', page, ...extra });
    repos.push(...data);
    if (!hasNext) break;
  }
  return { user: (await first).data, repos };
}
app.get('/api/me/profile', auth, wrap((req) => profile(req.token, '/user', '/user/repos', { affiliation: 'owner' })));
app.get('/api/users/:login/profile', auth, wrap((req) => {
  const l = encodeURIComponent(req.params.login);
  return profile(req.token, `/users/${l}`, `/users/${l}/repos`);
}));

app.get('/api/search/repos', auth, wrap(async (req) => {
  const { q, language, sort } = req.query;
  const p = paging(req.query);
  const query = [q || 'stars:>1', language && `language:${language}`].filter(Boolean).join(' ');
  const { data } = await gh('/search/repositories', req.token, { q: query, sort: oneOf(sort, ['stars', 'forks', 'updated']), order: 'desc', ...p });
  return shape(data, p);
}));

// GitHub has no official "trending" API, so this approximates it: the most-starred repos created in the period.
app.get('/api/trending/repos', auth, wrap(async (req) => {
  const days = { daily: 1, weekly: 7, monthly: 30 }[req.query.since] || 7;
  const since = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
  const p = paging(req.query);
  const query = [`created:>${since}`, req.query.language && `language:${req.query.language}`].filter(Boolean).join(' ');
  const { data } = await gh('/search/repositories', req.token, { q: query, sort: 'stars', order: 'desc', ...p });
  return shape(data, p);
}));

app.get('/api/search/users', auth, wrap(async (req) => {
  const { q, language, sort } = req.query;
  const p = paging(req.query);
  const query = [q || 'followers:>1000', 'type:user', language && `language:${language}`].filter(Boolean).join(' ');
  const { data } = await gh('/search/users', req.token, { q: query, sort: oneOf(sort, ['followers', 'repositories', 'joined']), order: 'desc', ...p });
  return shape(data, p);
}));

app.get('/api/topics', auth, wrap(async (req) => {
  const p = { page: Math.max(1, parseInt(req.query.page) || 1), per_page: 24 };
  const { data } = await gh('/search/topics', req.token, { q: req.query.q || 'is:featured', ...p });
  return shape(data, p);
}));

// Curated by this app (GitHub's own collections have no API). Each one is a repository search.
const COLLECTIONS = [
  { id: 'learn', title: 'Learn to code', text: 'Beginner-friendly projects to study and contribute to.', q: 'topic:beginner-friendly' },
  { id: 'games', title: 'Game engines', text: 'Open-source engines for building games.', q: 'topic:game-engine' },
  { id: 'frontend', title: 'Front-end tools', text: 'Frameworks and libraries for the browser.', q: 'topic:frontend' },
  { id: 'ml', title: 'Machine learning', text: 'Models, frameworks and learning resources.', q: 'topic:machine-learning' },
  { id: 'devops', title: 'DevOps tools', text: 'Automation, CI/CD and infrastructure.', q: 'topic:devops' },
  { id: 'design', title: 'Design systems', text: 'Component libraries and UI kits.', q: 'topic:design-system' },
  { id: 'cli', title: 'Command-line tools', text: 'Terminal apps that make work faster.', q: 'topic:cli' },
  { id: 'data', title: 'Open data', text: 'Public datasets and the tools around them.', q: 'topic:open-data' },
];
app.get('/api/collections', auth, (req, res) => res.json(COLLECTIONS));

// ---------- saved repositories (stored in MongoDB, per user) ----------
// Shape a saved repo like a GitHub repo, so the same RepoRow component can show it.
const savedOut = (d) => ({
  id: d.repoId, name: d.name, full_name: d.fullName, description: d.description, html_url: d.htmlUrl,
  language: d.language, topics: d.topics, stargazers_count: d.stars, forks_count: d.forks, fork: d.isFork,
  updated_at: d.repoUpdatedAt, saved_at: d.savedAt,
});

app.get('/api/saved', auth, wrap(async (req) => {
  const docs = await SavedRepo.find({ userId: req.session.userId }).sort({ savedAt: -1 }).lean();
  return docs.map(savedOut);
}));

// The client sends only the repo's full name. We fetch it from GitHub ourselves, so the saved data is genuine.
app.post('/api/saved', auth, wrap(async (req) => {
  const fullName = String(req.body?.fullName || '');
  if (!/^[\w.-]+\/[\w.-]+$/.test(fullName) || fullName.split('/').some((x) => /^\.+$/.test(x))) throw new HttpError(422, 'badquery');
  const { data: r } = await gh(`/repos/${fullName}`, req.token);
  const doc = await SavedRepo.findOneAndUpdate(
    { userId: req.session.userId, repoId: r.id },
    {
      $set: {
        fullName: r.full_name, name: r.name, description: r.description, htmlUrl: r.html_url, language: r.language,
        topics: r.topics || [], stars: r.stargazers_count, forks: r.forks_count, isFork: r.fork, repoUpdatedAt: r.updated_at,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
  return savedOut(doc);
}));

app.delete('/api/saved/:repoId', auth, wrap(async (req) => {
  const repoId = parseInt(req.params.repoId);
  if (!repoId) throw new HttpError(422, 'badquery');
  await SavedRepo.deleteOne({ userId: req.session.userId, repoId });
  return { ok: true };
}));

app.use((err, req, res, next) => res.status(err.status || 500).json({ error: err.message }));

try {
  await connectDb(MONGODB_URI);
  console.log('Connected to MongoDB');
} catch (e) {
  console.error('Could not connect to MongoDB:', e.message);
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`API on http://localhost:${PORT}`);
  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) console.warn('Missing GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET: sign-in will not work. See README.');
});
