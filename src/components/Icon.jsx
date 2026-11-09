const PATHS = {
  star: '<path d="M8 1.5l1.9 4.1 4.5.5-3.3 3.1.9 4.4L8 11.3l-4 2.3.9-4.4L1.6 6.1l4.5-.5z"/>',
  fork: '<circle cx="4" cy="3.5" r="1.7"/><circle cx="12" cy="3.5" r="1.7"/><circle cx="8" cy="12.5" r="1.7"/><path d="M4 5.2v1.3c0 1 .8 1.8 1.8 1.8h4.4c1 0 1.8-.8 1.8-1.8V5.2M8 8.3v2.5"/>',
  pin: '<path d="M8 1.5A4.5 4.5 0 0 0 3.5 6c0 3 4.5 8.5 4.5 8.5S12.5 9 12.5 6A4.5 4.5 0 0 0 8 1.5z"/><circle cx="8" cy="6" r="1.5"/>',
  people: '<circle cx="6" cy="5" r="2.3"/><path d="M1.5 13.5c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4M10.5 3a2.3 2.3 0 0 1 0 4.4M12 9.8c1.6.5 2.5 1.7 2.5 3.7"/>',
  org: '<rect x="3" y="2" width="10" height="12" rx="1"/><path d="M6 5h1M9 5h1M6 8h1M9 8h1M7 14v-3h2v3"/>',
  link: '<path d="M6.5 9.5l3-3M5 7.5L3.7 8.8a2.3 2.3 0 0 0 3.2 3.2l1.3-1.3M10.8 8.5l1.5-1.5a2.3 2.3 0 0 0-3.2-3.2L7.8 5.1"/>',
  cal: '<rect x="2" y="3" width="12" height="11" rx="1.5"/><path d="M2 7h12M5 1.5v3M11 1.5v3"/>',
};

export default function Icon({ name }) {
  return (
    <svg
      className="i"
      viewBox="0 0 16 16"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: PATHS[name] }}
    />
  );
}
