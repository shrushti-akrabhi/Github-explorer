import Logo from './Logo';

const ERRORS = {
  config: 'The server has no GitHub OAuth credentials yet. Add them to server/.env and restart.',
  state: 'The sign-in session expired. Please try again.',
  exchange: 'GitHub didn’t complete the sign-in. Please try again.',
  session: 'Couldn’t start your session. Please try again.',
  database: 'Couldn’t reach the database. Check that MongoDB is running and try again.',
};

export default function Login() {
  const code = new URLSearchParams(window.location.search).get('auth_error');
  return (
    <div className="login">
      <div className="login-card">
        <Logo size={48} />
        <h1>Sign in to GitHub Explorer</h1>
        {code && <div className="login-err" role="alert">{ERRORS[code] || 'Sign-in failed. Please try again.'}</div>}
        <div className="login-box">
          <a className="pri-link" href="/auth/github">Sign in with GitHub</a>
        </div>
      </div>
      <div className="login-help">
        <p>You’ll be sent to GitHub to approve access. This app can only read your public profile.</p>
        <p>Your GitHub token stays on the server and is never sent to your browser.</p>
      </div>
    </div>
  );
}
