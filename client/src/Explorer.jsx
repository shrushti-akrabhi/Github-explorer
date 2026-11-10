import { useState } from 'react';
import Header from './components/Header';
import Discover from './components/Discover';
import ProfileView from './components/ProfileView';
import SavedView from './components/SavedView';
import { SavedProvider } from './saved/SavedContext';

// The signed-in app: either the Explore page or a profile (your own or another developer's).
export default function Explorer() {
  const [view, setView] = useState({ type: 'discover', key: 0 });
  const discover = (initial) => setView({ type: 'discover', initial, key: Date.now() });

  return (
    <SavedProvider>
      <Header onSearch={(q) => discover({ q })} onHome={() => discover()} onProfile={() => setView({ type: 'me' })} onSaved={() => setView({ type: 'saved' })} />
      {view.type === 'saved' ? (
        <main className="single">
          <SavedView />
        </main>
      ) : view.type === 'discover' ? (
        <main className="single">
          <Discover key={view.key} initial={view.initial} onOpenProfile={(login) => setView({ type: 'user', login })} />
        </main>
      ) : (
        <main>
          <ProfileView
            key={view.login || 'me'}
            name={view.login}
            path={view.type === 'me' ? '/api/me/profile' : `/api/users/${encodeURIComponent(view.login)}/profile`}
          />
        </main>
      )}
    </SavedProvider>
  );
}
