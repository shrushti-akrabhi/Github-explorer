import { useEffect, useState } from 'react';
import { fetchUser } from '../api';

// Loads a user and their repos. Re-runs when `name` or `tick` changes,
// and cancels the previous request so old responses never overwrite new ones.
export default function useGithubUser(name, tick) {
  const [state, setState] = useState({ status: 'idle' });

  useEffect(() => {
    if (!name) {
      setState({ status: 'idle' });
      return;
    }
    const ctrl = new AbortController();
    setState({ status: 'loading' });
    fetchUser(name, ctrl.signal)
      .then((data) => setState({ status: 'success', ...data }))
      .catch((e) => {
        if (e.name !== 'AbortError') setState({ status: 'error', kind: e.kind || 'network', name });
      });
    return () => ctrl.abort();
  }, [name, tick]);

  return state;
}
