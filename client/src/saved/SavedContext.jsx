import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getJSON, sendJSON } from '../api';
import { useAuth } from '../auth/AuthContext';

const SavedContext = createContext(null);
export const useSaved = () => useContext(SavedContext);

// The signed-in user's saved repositories, kept in MongoDB by the server.
// Loaded once, so every repo row can show Save or Saved without its own request.
export function SavedProvider({ children }) {
  const { logout } = useAuth();
  const [state, setState] = useState({ status: 'loading', items: [] }); // loading | ready | error
  const [busy, setBusy] = useState(() => new Set());
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    getJSON('/api/saved', ctrl.signal)
      .then((items) => setState({ status: 'ready', items }))
      .catch((e) => {
        if (e.name === 'AbortError') return;
        if (e.kind === 'unauthorized') return logout();
        setState({ status: 'error', items: [], kind: e.kind || 'network' });
      });
    return () => ctrl.abort();
  }, [logout]);

  const ids = useMemo(() => new Set(state.items.map((r) => r.id)), [state.items]);

  const toggle = useCallback(async (repo) => {
    setFailed(false);
    setBusy((b) => new Set(b).add(repo.id));
    try {
      if (ids.has(repo.id)) {
        await sendJSON('DELETE', `/api/saved/${repo.id}`);
        setState((s) => ({ ...s, items: s.items.filter((r) => r.id !== repo.id) }));
      } else {
        const saved = await sendJSON('POST', '/api/saved', { fullName: repo.full_name });
        setState((s) => ({ ...s, items: [saved, ...s.items.filter((r) => r.id !== saved.id)] }));
      }
    } catch (e) {
      if (e.kind === 'unauthorized') return logout();
      setFailed(true);
    } finally {
      setBusy((b) => {
        const n = new Set(b);
        n.delete(repo.id);
        return n;
      });
    }
  }, [ids, logout]);

  const value = useMemo(
    () => ({ ...state, failed, isSaved: (id) => ids.has(id), isBusy: (id) => busy.has(id), toggle }),
    [state, failed, ids, busy, toggle]
  );
  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}
