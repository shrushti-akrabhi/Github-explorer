import Explorer from './Explorer';
import Login from './components/Login';
import { useAuth } from './auth/AuthContext';

// Only signed-in users reach the explorer.
export default function App() {
  const { status } = useAuth();
  if (status === 'checking') {
    return (
      <div className="login">
        <p className="muted">Checking your session…</p>
      </div>
    );
  }
  return status === 'in' ? <Explorer /> : <Login />;
}
