import { useMemo, useState } from 'react';
import RepoRow from './RepoRow';

const PER_PAGE = 10;
const SORTS = {
  updated: (a, b) => new Date(b.updated_at) - new Date(a.updated_at),
  stars: (a, b) => b.stargazers_count - a.stargazers_count,
  forks: (a, b) => b.forks_count - a.forks_count,
  name: (a, b) => a.name.localeCompare(b.name),
  saved: (a, b) => new Date(b.saved_at) - new Date(a.saved_at),
};

// `saved` switches on the Saved repositories page: its own title, "recently saved" sort, full names and empty text.
export default function RepoList({ repos, total, saved = false }) {
  const [q, setQ] = useState('');
  const [lang, setLang] = useState('');
  const [sort, setSort] = useState(saved ? 'saved' : 'updated');
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
      <div className="tabs"><div>{saved ? 'Saved repositories' : 'Repositories'}<em>{total}</em></div></div>
      <div className="bar">
        <input type="search" placeholder="Find a repository…" aria-label="Find a repository" value={q} onChange={onChange(setQ)} />
        <select aria-label="Language" value={lang} onChange={onChange(setLang)}>
          <option value="">All languages</option>
          {languages.map((l) => <option key={l}>{l}</option>)}
        </select>
        <select aria-label="Sort by" value={sort} onChange={onChange(setSort)}>
          {saved && <option value="saved">Recently saved</option>}
          <option value="updated">Last updated</option>
          <option value="stars">Most stars</option>
          <option value="forks">Most forks</option>
          <option value="name">Name</option>
        </select>
      </div>

      {rows.length === 0 ? (
        <div className="msg" style={{ border: 0 }}>
          <h2>{repos.length ? 'No repositories match' : saved ? 'No saved repositories yet' : 'No public repositories yet'}</h2>
          <p>{repos.length ? 'Clear the search box or pick a different language.' : saved ? 'Press Save on any repository and it will show up here.' : 'This user hasn’t published any repositories.'}</p>
        </div>
      ) : (
        rows.map((r) => <RepoRow key={r.id} r={r} full={saved} />)
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
