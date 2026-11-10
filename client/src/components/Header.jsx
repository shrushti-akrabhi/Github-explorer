import { useState } from 'react';
import Logo from './Logo';
import { useAuth } from '../auth/AuthContext';

export default function Header({ onSearch, onHome, onProfile, onSaved }) {
  const { viewer, logout } = useAuth();
  const [text, setText] = useState('');
  const close = (e) => (e.currentTarget.closest('details').open = false);

  return (
    <header>
      <button className="brand" type="button" onClick={onHome}>
        <Logo />
        GitHub Explorer
      </button>
      <form onSubmit={(e) => { e.preventDefault(); onSearch(text.trim()); }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Search repositories" aria-label="Search repositories" autoComplete="off" />
        <button className="pri" type="submit">Search</button>
      </form>
      <details className="menu">
        <summary aria-label="Account menu">
          <img className="me" src={viewer.avatar_url} alt="" />
        </summary>
        <div className="pop">
          <div>Signed in as <b>{viewer.login}</b></div>
          <button type="button" onClick={(e) => { close(e); onProfile(); }}>Your profile and repositories</button>
          <button type="button" onClick={(e) => { close(e); onSaved(); }}>Saved repositories</button>
          <button type="button" onClick={logout}>Sign out</button>
        </div>
      </details>
    </header>
  );
}
