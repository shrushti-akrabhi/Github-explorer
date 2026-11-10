export const LANG_COLORS = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5', HTML: '#e34c26',
  CSS: '#563d7c', Java: '#b07219', 'C++': '#f34b7d', C: '#555555', Go: '#00ADD8',
  Rust: '#dea584', Shell: '#89e051', Ruby: '#701516',
};

export const num = (n) => (n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + 'k' : String(n));

// GitHub style: relative for the last month, a date after that.
export function updatedLabel(iso) {
  const t = new Date(iso);
  const days = (Date.now() - t) / 864e5;
  if (days > 30) {
    const sameYear = t.getFullYear() === new Date().getFullYear();
    return 'Updated on ' + t.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: sameYear ? undefined : 'numeric' });
  }
  if (days >= 1) return `Updated ${Math.floor(days)} day${days >= 2 ? 's' : ''} ago`;
  const h = Math.floor(days * 24);
  return h >= 1 ? `Updated ${h} hour${h > 1 ? 's' : ''} ago` : 'Updated just now';
}

export const qs = (o) => new URLSearchParams(Object.entries(o).filter(([, v]) => v !== '' && v != null)).toString();
