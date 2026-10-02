import { auth } from '../lib/firebase';
import { requestJson } from '../lib/http';

export async function adminRequest(path, options = {}) {
  if (!auth.currentUser) throw new Error('Sign in again to continue.');
  const token = await auth.currentUser.getIdToken();
  return requestJson(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers, Authorization: `Bearer ${token}` },
  });
}
