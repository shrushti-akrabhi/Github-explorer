import { useState } from 'react';
import Header from './components/Header';
import ProfileCard from './components/ProfileCard';
import RepoList from './components/RepoList';
import { Message, ErrorMessage, Skeleton } from './components/States';
import useGithubUser from './hooks/useGithubUser';

export default function App() {
  const initial = new URLSearchParams(window.location.search).get('user') || 'octocat';
  const [req, setReq] = useState({ name: initial, id: 0 });
  const state = useGithubUser(req.name, req.id);

  // id changes on every search, so searching the same name again refetches.
  const search = (name) => {
    setReq((r) => ({ name, id: r.id + 1 }));
    window.history.replaceState(null, '', name ? `?user=${encodeURIComponent(name)}` : window.location.pathname);
  };

  return (
    <>
      <Header initial={initial} onSearch={search} />
      <main>
        {state.status === 'idle' && (
          <Message title="Enter a username" text="Type a GitHub username in the search box to see their profile and repositories." />
        )}
        {state.status === 'loading' && <Skeleton />}
        {state.status === 'error' && <ErrorMessage kind={state.kind} name={state.name} />}
        {state.status === 'success' && (
          <>
            <ProfileCard user={state.user} />
            <RepoList key={state.user.login} repos={state.repos} total={state.user.public_repos} />
          </>
        )}
      </main>
    </>
  );
}
