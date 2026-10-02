export const CONTENT_EVENT = 'fanz-content-updated';
const revisions = new Map();

export function getContentRevision(type) {
  try { return localStorage.getItem(`${CONTENT_EVENT}:${type}`) || revisions.get(type) || ''; }
  catch { return revisions.get(type) || ''; }
}

export function notifyContentChanged(type) {
  const detail = { type, time: Date.now() };
  const version = JSON.stringify(detail);
  revisions.set(type, version);
  try { localStorage.setItem(`${CONTENT_EVENT}:${type}`, version); }
  catch { /* Same-tab updates still work when browser storage is unavailable. */ }
  window.dispatchEvent(new CustomEvent(CONTENT_EVENT, { detail }));
}
