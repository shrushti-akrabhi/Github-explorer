import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getJSON, logoutRequest } from '../api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// The server owns the session. On load we just ask it who is signed in.
export function AuthProvider({ children }) {
  const [viewer, setViewer] = useState(null);
  const [status, setStatus] = useState('checking'); // checking | in | out

  useEffect(() => {
    const ctrl = new AbortController();
    getJSON('/api/me', ctrl.signal)
      .then((v) => {
        setViewer(v);
        setStatus('in');
      })
      .catch((e) => e.name !== 'AbortError' && setStatus('out'));
    return () => ctrl.abort();
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      setViewer(null);
      setStatus('out');
    }
  }, []);

  const value = useMemo(() => ({ viewer, status, logout }), [viewer, status, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
