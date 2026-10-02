import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from './firebase-admin.js';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function requireAdmin(request) {
  const token = request.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new HttpError(401, 'Sign in required.');
  let claims;
  try {
    claims = await getAuth(getAdminApp()).verifyIdToken(token);
  } catch (error) {
    if (error.code?.startsWith('auth/')) throw new HttpError(401, 'Your session has expired. Sign in again.');
    throw error;
  }
  if (claims.admin !== true) throw new HttpError(403, 'Admin access required.');
  return claims;
}

export function sendError(response, error, fallback) {
  const status = error.status || 503;
  if (!error.status) console.error(fallback, error.message);
  return response.status(status).json({ error: error.status ? error.message : fallback });
}
