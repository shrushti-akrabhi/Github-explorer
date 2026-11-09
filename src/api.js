const BASE = 'https://api.github.com';
// Optional: a token raises the limit from 60 to 5,000 requests per hour.
const TOKEN = import.meta.env.VITE_GITHUB_TOKEN;

export class ApiError extends Error {
  constructor(kind) {
    super(kind);
    this.kind = kind;
  }
}

async function get(path, signal) {
  let res;
  try {
    res = await fetch(BASE + path, {
      signal,
      headers: {
        Accept: 'application/vnd.github+json',
        ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
      },
    });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new ApiError('network');
  }
  if (res.status === 404) throw new ApiError('notfound');
  if (res.status === 403 || res.status === 429) throw new ApiError('ratelimit');
  if (!res.ok) throw new ApiError('http');
  return res.json();
}

export async function fetchUser(name, signal) {
  const q = encodeURIComponent(name);
  const [user, repos] = await Promise.all([
    get(`/users/${q}`, signal),
    get(`/users/${q}/repos?per_page=100&sort=updated`, signal),
  ]);
  return { user, repos };
}
