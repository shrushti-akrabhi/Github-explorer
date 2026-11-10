import { useEffect, useState } from 'react';
import { getJSON } from '../api';
import { useAuth } from '../auth/AuthContext';

// GET a URL from our backend. Cancels stale requests; a 401 signs the user out.
// The result is tagged with the URL it belongs to, so a page never receives data meant for another page.
export default function useApi(url) {
  const { logout } = useAuth();
  const [state, setState] = useState({ url, status: 'loading' });

  useEffect(() => {
    const ctrl = new AbortController();
    setState({ url, status: 'loading' });
    getJSON(url, ctrl.signal)
      .then((data) => setState({ url, status: 'success', data }))
      .catch((e) => {
        if (e.name === 'AbortError') return;
        if (e.kind === 'unauthorized') return logout();
        setState({ url, status: 'error', kind: e.kind || 'network' });
      });
    return () => ctrl.abort();
  }, [url, logout]);

  // Right after the URL changes, the old result is still in state for one render: treat it as loading.
  return state.url === url ? state : { status: 'loading' };
}