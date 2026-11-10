export class ApiError extends Error {
  constructor(kind) {
    super(kind);
    this.kind = kind;
  }
}

const KINDS = { 401: 'unauthorized', 404: 'notfound', 422: 'badquery', 429: 'ratelimit' };

export async function getJSON(url, signal) {
  let res;
  try {
    res = await fetch(url, { signal });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new ApiError('network');
  }
  if (!res.ok) throw new ApiError(KINDS[res.status] || 'http');
  return res.json();
}

// POST / DELETE helper for changes (saving a repository).
export async function sendJSON(method, url, body) {
  let res;
  try {
    res = await fetch(url, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError('network');
  }
  if (!res.ok) throw new ApiError(KINDS[res.status] || 'http');
  return res.json();
}

export const logoutRequest = () => fetch('/auth/logout', { method: 'POST' });
