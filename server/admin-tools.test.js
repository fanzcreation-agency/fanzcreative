import assert from 'node:assert/strict';
import test from 'node:test';
import { changeUser, publicUser, userError, validateUserInput, withUserLock } from './admin-users.js';
import { containsMedia, mediaPublicId, mediaQuery, mediaSearch, mediaUsage, publicMedia } from './admin-media.js';

const profile = { email: 'new@example.com', displayName: 'New Admin', password: 'test-only-long-password', admin: true, disabled: false };
function fakeAuth() {
  const records = new Map([
    ['actor', { uid: 'actor', email: 'owner@example.com', disabled: false, customClaims: { admin: true } }],
    ['target', { uid: 'target', email: 'other@example.com', displayName: 'Other', disabled: false, customClaims: { admin: true, editor: true } }],
  ]);
  const calls = [];
  return {
    records, calls,
    getUser: async (uid) => { if (!records.has(uid)) throw Object.assign(new Error('missing'), { code: 'auth/user-not-found' }); return structuredClone(records.get(uid)); },
    getUserByEmail: async (email) => { const user = [...records.values()].find((entry) => entry.email === email); if (!user) throw Object.assign(new Error('missing'), { code: 'auth/user-not-found' }); return structuredClone(user); },
    createUser: async (data) => { calls.push('create'); records.set('created', { ...data, uid: 'created' }); return { uid: 'created' }; },
    updateUser: async (uid, data) => { calls.push('update'); Object.assign(records.get(uid), data); },
    setCustomUserClaims: async (uid, claims) => { calls.push('claims'); records.get(uid).customClaims = claims; },
    deleteUser: async (uid) => { calls.push('delete'); records.delete(uid); },
    revokeRefreshTokens: async () => { calls.push('revoke'); },
    listUsers: async () => ({ users: [...records.values()] }),
    generatePasswordResetLink: async (email) => `https://example.com/reset?email=${encodeURIComponent(email)}`,
  };
}

test('account responses contain no password, hash, tokens or unrelated custom claims', () => {
  const user = publicUser({ uid: 'one', email: 'one@example.com', password: 'secret', passwordHash: 'hash', customClaims: { admin: true, private: 'secret' }, metadata: { creationTime: 'date' } });
  assert.equal(user.admin, true);
  assert.equal(user.createdAt, 'date');
  assert.deepEqual(Object.keys(user).sort(), ['admin', 'createdAt', 'disabled', 'displayName', 'email', 'emailVerified', 'lastSignIn', 'uid'].sort());
});

test('user details validate passwords, booleans, email and bounded names; unknown privileges are stripped', () => {
  assert.deepEqual(validateUserInput({ ...profile, email: ' new@example.com ', superuser: true }, true), profile);
  for (const changes of [{ password: 'short' }, { password: 'x'.repeat(129) }, { admin: 'true' }, { disabled: 1 }, { email: 'bad' }, { displayName: '' }]) assert.throws(() => validateUserInput({ ...profile, ...changes }, true));
  assert.equal(validateUserInput(profile).password, undefined);
});

test('new admins receive the role and failed claim assignment rolls back only the new account', async () => {
  const auth = fakeAuth();
  const result = await changeUser(auth, 'actor', 'POST', { data: profile });
  assert.equal(result.item.admin, true);
  assert.equal(result.item.password, undefined);
  const broken = fakeAuth(); broken.setCustomUserClaims = async () => { throw new Error('claims failed'); };
  await assert.rejects(changeUser(broken, 'actor', 'POST', { data: profile }), /claims failed/);
  assert.equal(broken.records.has('created'), false);
  assert.equal(broken.records.has('actor'), true);
});

test('own account cannot be deleted, disabled or demoted, and inactive actors cannot manage users', async () => {
  const auth = fakeAuth();
  await assert.rejects(changeUser(auth, 'actor', 'DELETE', { uid: 'actor' }), /own account/);
  for (const data of [{ ...profile, admin: false }, { ...profile, disabled: true }]) await assert.rejects(changeUser(auth, 'actor', 'PATCH', { uid: 'actor', data }), /own account/);
  assert.deepEqual(auth.calls, []);
  auth.records.get('actor').disabled = true;
  await assert.rejects(changeUser(auth, 'actor', 'POST', { data: profile }), /Admin access/);
  auth.records.get('actor').disabled = false; auth.records.get('actor').customClaims.admin = false;
  await assert.rejects(changeUser(auth, 'actor', 'DELETE', { uid: 'target' }), /Admin access/);
});

test('role removal is fail-closed, preserves other claims and revokes old sessions; re-granting revokes too', async () => {
  const auth = fakeAuth();
  const data = { ...profile, email: 'other@example.com', admin: false };
  await changeUser(auth, 'actor', 'PATCH', { uid: 'target', data });
  assert.deepEqual(auth.calls, ['claims', 'update', 'revoke']);
  assert.deepEqual(auth.records.get('target').customClaims, { admin: false, editor: true });
  auth.calls.length = 0;
  await changeUser(auth, 'actor', 'PATCH', { uid: 'target', data: { ...data, admin: true } });
  assert.deepEqual(auth.calls, ['update', 'claims', 'revoke']);
  assert.equal(auth.records.get('target').customClaims.editor, true);
  auth.calls.length = 0;
  await changeUser(auth, 'actor', 'PATCH', { uid: 'target', data: { ...data, admin: true, disabled: true } });
  assert.deepEqual(auth.calls, ['update', 'revoke']);
});

test('last active admin guard aborts before any change and reset links require active accounts', async () => {
  const auth = fakeAuth();
  auth.listUsers = async () => ({ users: [auth.records.get('target')] });
  await assert.rejects(changeUser(auth, 'actor', 'DELETE', { uid: 'target' }), /last active admin/);
  assert.deepEqual(auth.calls, []);
  const result = await changeUser(auth, 'actor', 'PATCH', { uid: 'target', action: 'reset-password' });
  assert.ok(result.resetUrl.startsWith('https://'));
  auth.records.get('target').disabled = true;
  await assert.rejects(changeUser(auth, 'actor', 'PATCH', { uid: 'target', action: 'reset-password' }), /active account/);
  assert.equal(userError({ code: 'auth/email-already-exists' }).status, 409);
});

test('duplicate email edits cannot partially remove the target admin role', async () => {
  const auth = fakeAuth();
  await assert.rejects(changeUser(auth, 'actor', 'PATCH', { uid: 'target', data: { ...profile, email: 'owner@example.com', admin: false } }), /already exists/);
  assert.equal(auth.records.get('target').customClaims.admin, true);
  assert.deepEqual(auth.calls, []);
});

function lockStore() {
  let record;
  let queue = Promise.resolve();
  const store = {
    collection: () => ({ doc: () => ({}) }),
    runTransaction: (callback) => {
      const run = queue.then(async () => {
        const transaction = { get: async () => ({ exists: Boolean(record), get: (key) => record?.[key] }), set: (_, value) => { record = value; }, delete: () => { record = undefined; } };
        return callback(transaction);
      });
      queue = run.catch(() => {}); return run;
    },
  };
  return store;
}

test('account changes serialize, block concurrent mutations, and release locks on errors', async () => {
  const store = lockStore();
  let release; let entered;
  const ready = new Promise((resolve) => { entered = resolve; });
  const first = withUserLock(store, async () => { entered(); await new Promise((resolve) => { release = resolve; }); });
  await ready;
  await assert.rejects(withUserLock(store, async () => assert.fail('must not enter')), /in progress/);
  release(); await first;
  await assert.rejects(withUserLock(store, async () => { throw new Error('failed'); }), /failed/);
  assert.equal(await withUserLock(store, async () => 'released'), 'released');
});

test('media queries and IDs are scoped to the site and search expressions escape operators', () => {
  assert.equal(mediaQuery({ folder: 'blog' }).prefix, 'fanzcreative/blog/');
  assert.equal(mediaQuery().max_results, 60);
  for (const folder of ['__proto__', 'other', 'projects/..']) assert.throws(() => mediaQuery({ folder }));
  assert.throws(() => mediaQuery({ cursor: [] }));
  assert.throws(() => mediaSearch({ q: 'x'.repeat(101) }));
  assert.ok(mediaSearch({ q: '" OR resource_type:video *' }).includes('display_name:"\\" OR resource_type:video \\*"'));
  for (const id of ['other/image', 'fanzcreative/../image', 'fanzcreative//image', 'fanzcreative/one\\two', 'fanzcreative/image\n']) assert.throws(() => mediaPublicId(id));
  assert.equal(mediaPublicId('fanzcreative/blog/valid'), 'fanzcreative/blog/valid');
});

test('media references recognize optimized URLs and nested gallery/blocks but not other clouds or similar IDs', () => {
  const id = 'fanzcreative/blog/one';
  const url = `https://res.cloudinary.com/site/image/upload/f_auto/q_auto/v100/${id}.webp`;
  assert.equal(containsMedia({ galleryUrls: [url], blocks: [{ url }] }, id, 'site'), true);
  assert.equal(containsMedia(url.replace('/one.webp', '/one-more.webp'), id, 'site'), false);
  assert.equal(containsMedia(url, id, 'other'), false);
  assert.equal(containsMedia(null, id, 'site'), false);
  const media = publicMedia({ asset_id: 'id', public_id: id, secure_url: url, width: 1200, height: 800, api_secret: 'private' });
  assert.equal(media.name, 'one');
  assert.equal(media.api_secret, undefined);
});

test('media usage includes drafts and archived records as well as built-in assets', async () => {
  const id = 'fanzcreative/blog/qa';
  const url = `https://res.cloudinary.com/cavd6vos/image/upload/v1/${id}.jpg`;
  const data = { title: 'Draft', status: 'draft', blocks: [{ url }] };
  const store = { collection: () => ({ get: async () => ({ docs: [{ id: 'draft', data: () => data, get: (key) => data[key] }] }) }) };
  const usage = await mediaUsage(store, id, 'cavd6vos');
  assert.deepEqual(usage.map((entry) => entry.type), ['posts', 'projects']);
  const staticUsage = await mediaUsage({ collection: () => ({ get: async () => ({ docs: [] }) }) }, 'fanzcreative/blog/blog_ai_automation', 'cavd6vos');
  assert.equal(staticUsage[0].type, 'website');
});
