export default function Pager({ page, perPage, total, onPage }) {
  const pages = Math.ceil(total / perPage);
  if (pages < 2) return null;
  const start = Math.max(1, Math.min(page - 3, pages - 6));
  const nums = Array.from({ length: Math.min(7, pages) }, (_, i) => start + i);
  return (
    <nav className="pg" aria-label="Pagination">
      <button disabled={page < 2} onClick={() => onPage(page - 1)}>Previous</button>
      {nums.map((n) => (
        <button key={n} className={n === page ? 'on' : ''} aria-current={n === page ? 'page' : undefined} onClick={() => onPage(n)}>{n}</button>
      ))}
      <button disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button>
    </nav>
  );
}
