import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// VITE_ values are public browser configuration, never server credentials.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
const missing = Object.entries(firebaseConfig)
  .filter(([, value]) => typeof value !== 'string' || !value.trim())
  .map(([key]) => key);
if (missing.length) {
  throw new Error(`Firebase web configuration is missing: ${missing.join(', ')}. Set the VITE_FIREBASE_* environment variables and restart or rebuild the app.`);
}

const app = getApps()[0] || initializeApp(firebaseConfig);

export const auth = getAuth(app);
