import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase's web config identifies the project; access is enforced by Auth and Firestore rules.
const app = getApps()[0] || initializeApp({
  apiKey: 'AIzaSyAOSD-vVU64wlBiqlduvZALphp5xjl-Cz0',
  authDomain: 'fanzcreative-1bf9e.firebaseapp.com',
  projectId: 'fanzcreative-1bf9e',
  storageBucket: 'fanzcreative-1bf9e.firebasestorage.app',
  messagingSenderId: '683876510767',
  appId: '1:683876510767:web:fa6f68775f1f89d8f26ada',
});

export const auth = getAuth(app);
