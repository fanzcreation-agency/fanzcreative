import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { initializeFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'node:fs';

export function getAdminApp() {
  if (getApps().length) return getApps()[0];
  const path = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || (path ? readFileSync(path, 'utf8') : '');
  if (!raw) {
    throw new Error('Firebase server credentials are not configured.');
  }
  return initializeApp({ credential: cert(JSON.parse(raw)) });
}

export function getAdminStore() {
  return initializeFirestore(getAdminApp(), { preferRest: true });
}
