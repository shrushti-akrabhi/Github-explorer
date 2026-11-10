import { useState } from 'react';
import useApi from '../hooks/useApi';
import RepoRow from './RepoRow';
import Pager from './Pager';
import { ErrorMessage } from './States';
import { num, qs } from '../utils';

const TABS = ['Repositories', 'Trending', 'Developers', 'Topics', 'Collections'];
const LANGS = ['JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C++', 'C#', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'HTML', 'CSS', 'Shell'];
const SORTS = {
  Repositories: [['', 'Best match'], ['stars', 'Most stars'], ['forks', 'Most forks'], ['updated', 'Recently updated']],
  Developers: [['', 'Best match'], ['followers', 'Most followers'], ['repositories', 'Most repositories'], ['joined', 'Recently joined']],
};
const SINCE = [['daily', 'Today'], ['weekly', 'This week'], ['monthly', 'This month']];
const PLACEHOLDER = { Repositories: 'Search repositories…', Developers: 'Search developers…', Topics: 'Search topics…' };
const URLS = {
  Repositories: (f) => `/api/search/repos?${qs({ q: f.q, language: f.lang, sort: f.sort, page: f.page })}`,
  Trending: (f) => `/api/trending/repos?${qs({ since: f.since, language: f.lang, page: f.page })}`,
  Developers: (f) => `/api/search/users?${qs({ q: f.q, language: f.lang, sort: f.sort, page: f.page })}`,
  Topics: (f) => `/api/topics?${qs({ q: f.q, page: f.page })}`,
  Collections: () => '/api/collections',
};

export default function Discover({ initial, onOpenProfile }) {
  const [f, setF] = useState({ tab: 'Repositories', q: '', lang: '', sort: '', since: 'weekly', page: 1, ...initial });
  const [text, setText] = useState(f.q);
  const state = useApi(URLS[f.tab](f));
  const set = (patch) => setF((s) => ({ ...s, page: 1, ...patch }));
  const go = (tab, patch = {}) => { setText(patch.q || ''); set({ tab, q: '', sort: '', ...patch }); };
  const d = state.data;

  return (
    <>
      <div className="nav" role="tablist">
        {TABS.map((t) => <button key={t} role="tab" aria-selected={t === f.tab} className={t === f.tab ? 'on' : ''} onClick={() => go(t)}>{t}</button>)}
      </div>

      {f.tab !== 'Collections' && (
        <form className="bar" onSubmit={(e) => { e.preventDefault(); set({ q: text.trim() }); }}>
          {PLACEHOLDER[f.tab] && <input type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder={PLACEHOLDER[f.tab]} aria-label={PLACEHOLDER[f.tab]} />}
          {f.tab === 'Trending' && (
            <select aria-label="Time range" value={f.since} onChange={(e) => set({ since: e.target.value })}>
              {SINCE.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          )}
          {f.tab !== 'Topics' && f.tab !== 'Collections' && (
            <select aria-label="Language" value={f.lang} onChange={(e) => set({ lang: e.target.value })}>
              <option value="">All languages</option>
              {LANGS.map((l) => <option key={l}>{l}</option>)}
            </select>
          )}
          {SORTS[f.tab] && (
            <select aria-label="Sort by" value={f.sort} onChange={(e) => set({ sort: e.target.value })}>
              {SORTS[f.tab].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          )}
          {PLACEHOLDER[f.tab] && <button className="pri" type="submit">Search</button>}
        </form>
      )}

      {state.status === 'loading' && [0, 1, 2, 3].map((i) => <div key={i} className="sk" style={{ height: 90, marginTop: 16 }} />)}
      {state.status === 'error' && <ErrorMessage kind={state.kind} name={f.q} />}

      {state.status === 'success' && (
        <>
          {f.tab === 'Collections' && (
            <div className="grid">
              {d.map((c) => (
                <button key={c.id} className="card" onClick={() => go('Repositories', { q: c.q, sort: 'stars' })}><b>{c.title}</b><span>{c.text}</span></button>
              ))}
            </div>
          )}
          {f.tab === 'Topics' && (
            <div className="grid">
              {d.items.map((t) => (
                <button key={t.name} className="card" onClick={() => go('Repositories', { q: `topic:${t.name}`, sort: 'stars' })}>
                  <b>{t.display_name || t.name}</b><span>{t.short_description || 'No description yet.'}</span>
                </button>
              ))}
            </div>
          )}
          {f.tab === 'Developers' && (
            <div className="grid">
              {d.items.map((u) => (
                <div key={u.id} className="card dev">
                  <img src={u.avatar_url} alt="" />
                  <div><b>{u.login}</b><button className="sec" onClick={() => onOpenProfile(u.login)}>View profile</button></div>
                </div>
              ))}
            </div>
          )}
          {(f.tab === 'Repositories' || f.tab === 'Trending') && (
            <>
              <div className="count">{d.total >= 1000 ? '1,000+' : num(d.total)} repositories{f.tab === 'Trending' ? ' created in this period, most starred first' : ''}</div>
              {d.items.map((r) => <RepoRow key={r.id} r={r} full />)}
            </>
          )}
          {f.tab !== 'Collections' && d.items.length === 0 && (
            <div className="msg"><h2>No results</h2><p>Try different words or clear a filter.</p></div>
          )}
          {f.tab !== 'Collections' && <Pager page={d.page} perPage={d.perPage} total={d.total} onPage={(page) => setF((s) => ({ ...s, page }))} />}
        </>
      )}
    </>
  );
}
