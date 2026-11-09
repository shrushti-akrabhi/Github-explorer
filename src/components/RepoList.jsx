import { useMemo, useState } from 'react';
import Icon from './Icon';
import { LANG_COLORS, num, updatedLabel } from '../utils';

const PER_PAGE = 10;
const SORTS = {
  updated: (a, b) => new Date(b.updated_at) - new Date(a.updated_at),
  stars: (a, b) => b.stargazers_count - a.stargazers_count,
  forks: (a, b) => b.forks_count - a.forks_count,
  name: (a, b) => a.name.localeCompare(b.name),
};

export default function RepoList({ repos, total }) {
  const [q, setQ] = useState('');
  const [lang, setLang] = useState('');
  const [sort, setSort] = useState('updated');
  const [page, setPage] = useState(1);

  const languages = useMemo(() => [...new Set(repos.map((r) => r.language).filter(Boolean))].sort(), [repos]);

  const filtered = useMemo(() => {
    const t = q.toLowerCase();
    return repos
      .filter((r) => (!lang || r.language === lang) && (!t || r.name.toLowerCase().includes(t) || (r.description || '').toLowerCase().includes(t)))
      .sort(SORTS[sort]);
  }, [repos, q, lang, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  // Changing any filter sends the list back to page 1.
  const onChange = (set) => (e) => {
    set(e.target.value);
    setPage(1);
  };

  return (
    <section>
      <div className="tabs"><div>Repositories<em>{total}</em></div></div>
      <div className="bar">
        <input type="search" placeholder="Find a repository…" aria-label="Find a repository" value={q} onChange={onChange(setQ)} />
        <select aria-label="Language" value={lang} onChange={onChange(setLang)}>
          <option value="">All languages</option>
          {languages.map((l) => <option key={l}>{l}</option>)}
        </select>
        <select aria-label="Sort by" value={sort} onChange={onChange(setSort)}>
          <option value="updated">Last updated</option>
          <option value="stars">Most stars</option>
          <option value="forks">Most forks</option>
          <option value="name">Name</option>
        </select>
      </div>

      {rows.length === 0 ? (
        <div className="msg" style={{ border: 0 }}>
          <h2>{repos.length ? 'No repositories match' : 'No public repositories yet'}</h2>
          <p>{repos.length ? 'Clear the search box or pick a different language.' : 'This user hasn’t published any repositories.'}</p>
        </div>
      ) : (
        rows.map((r) => (
          <div className="repo" key={r.id}>
            <h3>
              <a href={r.html_url} target="_blank" rel="noopener noreferrer">{r.name}</a>
              <span className="badge">{r.fork ? 'Fork' : 'Public'}</span>
            </h3>
            {r.description && <p>{r.description}</p>}
            <div className="rm">
              {r.language && (
                <span><i className="dot" style={{ background: LANG_COLORS[r.language] || '#8b949e' }} />{r.language}</span>
              )}
              {r.stargazers_count > 0 && <span><Icon name="star" />{num(r.stargazers_count)}</span>}
              {r.forks_count > 0 && <span><Icon name="fork" />{num(r.forks_count)}</span>}
              <span>{updatedLabel(r.updated_at)}</span>
            </div>
          </div>
        ))
      )}

      {pages > 1 && (
        <nav className="pg" aria-label="Pagination">
          <button disabled={current < 2} onClick={() => setPage(current - 1)}>Previous</button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <button key={n} className={n === current ? 'on' : ''} aria-current={n === current ? 'page' : undefined} onClick={() => setPage(n)}>{n}</button>
          ))}
          <button disabled={current >= pages} onClick={() => setPage(current + 1)}>Next</button>
        </nav>
      )}
    </section>
  );
}
