import RepoList from './RepoList';
import { ErrorMessage } from './States';
import { useSaved } from '../saved/SavedContext';

// The "Saved repositories" page from the account menu.
export default function SavedView() {
  const s = useSaved();
  if (s.status === 'loading') return [0, 1, 2, 3].map((i) => <div key={i} className="sk" style={{ height: 90, marginTop: 16 }} />);
  if (s.status === 'error') return <ErrorMessage kind={s.kind} />;
  return (
    <>
      {s.failed && <div className="banner" role="alert">Couldn’t update your saved repositories. Please try again.</div>}
      <RepoList saved repos={s.items} total={s.items.length} />
    </>
  );
}
