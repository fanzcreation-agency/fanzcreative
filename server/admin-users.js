import { randomUUID } from 'node:crypto';
import { HttpError } from './http.js';

export function publicUser(user) {
  return {
    uid: user.uid, email: user.email || '', displayName: user.displayName || '',
    admin: user.customClaims?.admin === true, disabled: user.disabled === true,
    emailVerified: user.emailVerified === true,
    createdAt: user.metadata?.creationTime || null, lastSignIn: user.metadata?.lastSignInTime || null,
  };
}

export function validateUserInput(data, creating = false) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new HttpError(400, 'Invalid user details.');
  const email = typeof data.email === 'string' ? data.email.trim() : '';
  const displayName = typeof data.displayName === 'string' ? data.displayName.trim() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new HttpError(400, 'Enter a valid email address.');
  if (!displayName || displayName.length > 100) throw new HttpError(400, 'Enter a name of up to 100 characters.');
  if (typeof data.admin !== 'boolean' || typeof data.disabled !== 'boolean') throw new HttpError(400, 'Choose a valid role and account status.');
  const result = { email, displayName, admin: data.admin, disabled: data.disabled };
  if (creating) {
    if (typeof data.password !== 'string' || data.password.length < 12 || data.password.length > 128) throw new HttpError(400, 'Use a password between 12 and 128 characters.');
    result.password = data.password;
  }
  return result;
}

export function userError(error) {
  const messages = {
    'auth/email-already-exists': [409, 'An account with this email already exists.'],
    'auth/user-not-found': [404, 'This user no longer exists. Refresh the list.'],
    'auth/invalid-email': [400, 'Enter a valid email address.'],
    'auth/invalid-password': [400, 'The password does not meet the authentication requirements.'],
  };
  const value = messages[error.code];
  return value ? new HttpError(...value) : error;
}

// Serialize access changes across serverless instances, then recheck the acting admin.
export async function withUserLock(store, operation) {
  const ref = store.collection('_adminOperations').doc('users');
  const owner = randomUUID();
  await store.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (snapshot.exists && snapshot.get('expiresAt') > Date.now()) throw new HttpError(409, 'Another account change is in progress. Try again shortly.');
    transaction.set(ref, { owner, expiresAt: Date.now() + 5 * 60 * 1000 });
  });
  try {
    return await operation();
  } finally {
    await store.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (snapshot.get('owner') === owner) transaction.delete(ref);
    }).catch((error) => console.error('Account lock release failed:', error.code || 'unknown'));
  }
}

export async function changeUser(auth, actorUid, method, body) {
  const actor = await auth.getUser(actorUid);
  if (actor.disabled || actor.customClaims?.admin !== true) throw new HttpError(403, 'Admin access required.');
  if (method === 'POST') {
    const data = validateUserInput(body?.data, true);
    const { admin, ...profile } = data;
    const user = await auth.createUser(profile);
    try { await auth.setCustomUserClaims(user.uid, { admin }); }
    catch (error) { await auth.deleteUser(user.uid); throw error; }
    return { item: publicUser(await auth.getUser(user.uid)) };
  }
  const uid = body?.uid;
  if (typeof uid !== 'string' || !uid || uid.length > 128) throw new HttpError(400, 'Choose a valid user.');
  const target = await auth.getUser(uid);
  if (body?.action === 'reset-password' && method === 'PATCH') {
    if (!target.email || target.disabled) throw new HttpError(400, 'Password reset requires an active account with an email address.');
    const resetUrl = await auth.generatePasswordResetLink(target.email);
    return { resetUrl };
  }
  const data = method === 'PATCH' ? validateUserInput(body?.data) : null;
  const removesAccess = method === 'DELETE' || data?.disabled || data?.admin === false;
  if (uid === actorUid && removesAccess) throw new HttpError(409, 'You cannot delete, disable or remove admin access from your own account.');
  if (target.customClaims?.admin === true && !target.disabled && removesAccess) {
    let activeAdmins = 0;
    let pageToken;
    do {
      const page = await auth.listUsers(1000, pageToken);
      activeAdmins += page.users.filter((user) => user.customClaims?.admin === true && !user.disabled).length;
      pageToken = page.pageToken;
    } while (pageToken);
    if (activeAdmins < 2) throw new HttpError(409, 'The last active admin must retain access.');
  }
  if (method === 'DELETE') { await auth.deleteUser(uid); return { deleted: true }; }
  if (data.email.toLowerCase() !== target.email?.toLowerCase()) {
    const existing = await auth.getUserByEmail(data.email).catch((error) => {
      if (error.code === 'auth/user-not-found') return null;
      throw error;
    });
    if (existing && existing.uid !== uid) throw new HttpError(409, 'An account with this email already exists.');
  }
  const { admin, ...profile } = data;
  // Remove privileges before profile changes; a partial failure must not retain old access.
  if (target.customClaims?.admin === true && !admin) {
    await auth.setCustomUserClaims(uid, { ...target.customClaims, admin: false });
  }
  await auth.updateUser(uid, profile);
  if (admin && target.customClaims?.admin !== true) await auth.setCustomUserClaims(uid, { ...target.customClaims, admin: true });
  if ((target.customClaims?.admin === true) !== admin || target.disabled !== profile.disabled) await auth.revokeRefreshTokens(uid);
  return { item: publicUser(await auth.getUser(uid)) };
}
