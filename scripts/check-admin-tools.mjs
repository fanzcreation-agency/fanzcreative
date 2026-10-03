import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium, expect as baseExpect } from '@playwright/test';
import { getAuth } from 'firebase-admin/auth';
import { deleteApp } from 'firebase-admin/app';
import { v2 as cloudinary } from 'cloudinary';
import { getAdminApp, getAdminStore } from '../server/firebase-admin.js';
import { signInAdminTest } from './admin-test-login.mjs';

process.loadEnvFile('.env.local');
const email = process.argv[2];
if (!email) throw new Error('Usage: node scripts/check-admin-tools.mjs <existing-admin-email>');
const base = process.env.ADMIN_TEST_URL || 'http://127.0.0.1:5180';
if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname)) throw new Error('Use a local Vite server for the tools QA secondary-account SDK tests.');
const expect = baseExpect.configure({ timeout: 30000 });
const app = getAdminApp();
const auth = getAuth(app);
const store = getAdminStore();
const actor = await auth.getUserByEmail(email);
assert.equal(actor.customClaims?.admin, true);
const stamp = Date.now();
const qaEmail = `qa-tools-${stamp}@example.com`;
const qaSlug = `qa-tools-${stamp}`;
const uploads = new Set();
let qaUid;
let recordCreated = false;
const errors = [];
cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
const page = await context.newPage();
page.on('pageerror', (error) => errors.push(error.message));
page.on('response', async (response) => {
  if (response.url().includes('api.cloudinary.com') && response.request().method() === 'POST' && response.ok()) {
    const result = await response.json().catch(() => null);
    if (result?.public_id) uploads.add(result.public_id);
  }
});
const pass = (message) => console.log(`PASS ${message}`);
const nav = async (name) => {
  if (await page.getByRole('button', { name: 'Open navigation', exact: true }).isVisible()) await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await page.locator('.admin-sidebar nav').getByRole('button', { name: new RegExp(`^${name}`) }).click();
};
let token;
const api = (path, method = 'GET', body, override = token) => page.request.fetch(`${base}${path}`, { method, headers: { Authorization: `Bearer ${override}` }, ...(body ? { data: body } : {}) });
const signInNewUser = async (target, password) => {
  await target.goto(`${base}/admin`);
  await target.getByLabel('Email', { exact: true }).fill(qaEmail);
  await target.getByLabel('Password', { exact: true }).fill(password);
  await target.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(target.locator('.admin-sidebar')).toBeAttached();
  return target.evaluate(async () => (await import('/src/lib/firebase.js')).auth.currentUser.getIdToken());
};

try {
  await mkdir('scratch', { recursive: true });
  await page.goto(`${base}/admin`);
  token = await signInAdminTest(page, { base, email, customToken: await auth.createCustomToken(actor.uid) });
  await expect(page.locator('.admin-sidebar')).toBeAttached();
  for (const path of ['/api/admin-users', '/api/admin-media']) assert.equal((await page.request.get(`${base}${path}`)).status(), 401);
  pass('both new APIs require authentication');

  await nav('Media Library');
  await expect(page.locator('.admin-media-tile').first()).toBeVisible();
  const initial = await page.locator('.admin-media-tile').count();
  if (await page.getByRole('button', { name: 'Load more', exact: true }).count()) {
    await page.getByRole('button', { name: 'Load more', exact: true }).click();
    await expect.poll(() => page.locator('.admin-media-tile').count()).toBeGreaterThan(initial);
  }
  await page.screenshot({ path: 'scratch/media-library-desktop.png', animations: 'disabled' });
  await page.getByLabel('Media folder').selectOption('blog');
  await expect(page.locator('.admin-media-tile').first()).toBeVisible();
  await page.locator('.admin-media-tile').first().click();
  await expect(page.getByRole('dialog', { name: 'Image details' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Delete image', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Copy URL', exact: true }).click();
  await expect(page.locator('.admin-notice')).toContainText('copied');
  const usedUrl = await page.getByLabel('Image URL', { exact: true }).inputValue();
  const usedId = decodeURIComponent(new URL(usedUrl).pathname).split('/fanzcreative/')[1].replace(/\.[^/.]+$/, '');
  assert.equal((await api('/api/admin-media', 'DELETE', { publicId: `fanzcreative/${usedId}` })).status(), 409);
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByLabel('Media folder').selectOption('all');
  await page.getByLabel('Search media').fill('benefits');
  await page.getByRole('button', { name: 'Search images', exact: true }).click();
  await expect.poll(() => page.locator('.admin-media-tile').count()).toBe(4);
  await page.getByLabel('Search media').fill('');
  await page.getByRole('button', { name: 'Search images', exact: true }).click();
  await expect.poll(() => page.locator('.admin-media-tile').count()).toBeGreaterThan(4);
  pass('existing Cloudinary images, folders, global search, pagination, details/copy and used-image protection');

  const imageBuffer = Buffer.from(await page.evaluate(() => {
    const canvas = globalThis.document.createElement('canvas'); canvas.width = 1600; canvas.height = 900;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#eaf1fc'; ctx.fillRect(0, 0, 1600, 900);
    ctx.fillStyle = '#247cf0'; ctx.font = '80px sans-serif'; ctx.fillText('Temporary media test', 120, 460);
    return canvas.toDataURL('image/png').split(',')[1];
  }), 'base64');
  const uploadResponse = page.waitForResponse((response) => response.url().includes('api.cloudinary.com') && response.request().method() === 'POST');
  await page.getByLabel('Upload library images').setInputFiles({ name: `qa-library-${stamp}.png`, mimeType: 'image/png', buffer: imageBuffer });
  const uploaded = await (await uploadResponse).json();
  assert.equal(typeof uploaded.secure_url, 'string');
  uploads.add(uploaded.public_id);
  await expect(page.locator('.admin-notice')).toContainText('1 image uploaded', { timeout: 60000 });
  await page.getByLabel('Media folder').selectOption('assets');
  await expect(page.locator('.admin-media-tile').filter({ hasText: `qa-library-${stamp}.png` })).toBeVisible();
  pass('real upload preserves the filename and appears in the Library');

  await nav('Blogs');
  await page.getByRole('button', { name: 'Add new', exact: true }).click();
  await page.getByLabel('Title', { exact: true }).fill('Temporary library test');
  await page.getByLabel('Slug', { exact: true }).fill(qaSlug);
  await page.getByRole('button', { name: 'Choose from library', exact: true }).first().click();
  await expect(page.getByRole('dialog', { name: 'Choose an image' })).toBeVisible();
  await page.getByLabel('Media folder').selectOption('assets');
  await page.locator('.admin-media-tile').filter({ hasText: `qa-library-${stamp}.png` }).click();
  await expect(page.getByLabel('Cover URL', { exact: true })).toHaveValue(new RegExp(uploaded.public_id));
  await page.getByLabel('Excerpt', { exact: true }).fill('Temporary QA content.');
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/admin/posts/${qaSlug}$`)); recordCreated = true;
  assert.equal((await api('/api/admin-media', 'DELETE', { publicId: uploaded.public_id })).status(), 409);
  await page.getByRole('button', { name: 'Choose from library', exact: true }).first().click();
  await page.getByLabel('Media folder').selectOption('assets');
  await expect(page.locator('.admin-media-tile').filter({ hasText: 'image' }).first()).toBeVisible();
  await page.locator('.admin-media-tile').filter({ has: page.locator('strong', { hasText: /^image$/ }) }).first().click();
  await expect(page.getByRole('dialog').filter({ hasText: 'Crop cover' })).toBeVisible();
  await page.getByRole('button', { name: 'Crop & upload' }).click();
  await expect(page.locator('.admin-notice')).toContainText('Image uploaded', { timeout: 60000 });
  pass('cover selection reuses existing media, mismatched ratios open crop, and drafts protect referenced images');

  await nav('Users');
  await expect(page.locator(`[data-user-id="${actor.uid}"]`)).toBeVisible();
  await expect(page.getByRole('button', { name: `Delete ${email}`, exact: true })).toBeDisabled();
  assert.equal((await api('/api/admin-users', 'DELETE', { uid: actor.uid })).status(), 409);
  const list = await (await api('/api/admin-users')).json();
  assert.ok(list.items.every((item) => !('passwordHash' in item) && !('customClaims' in item)));
  await page.getByRole('button', { name: 'Add user', exact: true }).click();
  await page.getByLabel('Full name', { exact: true }).fill('Temporary QA Admin');
  await page.getByLabel('Email address', { exact: true }).fill(qaEmail);
  await page.getByRole('button', { name: 'Generate password' }).click();
  let password = await page.getByLabel('Initial password', { exact: true }).inputValue();
  assert.equal(password.length, 20);
  await page.getByRole('button', { name: 'Create user', exact: true }).click();
  await expect(page.locator('.admin-notice')).toContainText('User created');
  qaUid = (await auth.getUserByEmail(qaEmail)).uid;
  await page.getByLabel('Search users').fill(qaEmail);
  await expect(page.locator('.admin-users-table tbody tr')).toHaveCount(1);
  const secondContext = await browser.newContext();
  const other = await secondContext.newPage();
  let otherToken = await signInNewUser(other, password);
  assert.equal((await api('/api/admin-users', 'GET', null, otherToken)).status(), 200);
  pass('create admin, generated password, real password login, search and own-account protection');

  await page.getByRole('button', { name: `Reset password for ${qaEmail}` }).click();
  await page.getByRole('button', { name: 'Generate reset link' }).click();
  const resetUrl = await page.getByLabel('Password reset link').inputValue();
  const code = new URL(resetUrl).searchParams.get('oobCode'); assert.ok(code);
  password = `${password}!new`;
  await other.evaluate(async ({ code, password }) => {
    const { auth } = await import('/src/lib/firebase.js');
    const { confirmPasswordReset, signOut } = await import('/node_modules/.vite/deps/firebase_auth.js');
    await confirmPasswordReset(auth, code, password); await signOut(auth);
  }, { code, password });
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  otherToken = await signInNewUser(other, password);
  pass('real reset link can be consumed and the new password works');

  const edit = async ({ admin = true, disabled = false }) => {
    await page.getByRole('button', { name: `Edit ${qaEmail}` }).click();
    await page.getByLabel('Role', { exact: true }).selectOption(admin ? 'admin' : 'user');
    await page.getByLabel('Disable account', { exact: true }).setChecked(disabled);
    await page.getByRole('button', { name: 'Save changes', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('.admin-notice')).toContainText('User updated');
  };
  await edit({ admin: false });
  assert.ok([401, 403].includes((await api('/api/admin-users', 'GET', null, otherToken)).status()));
  assert.equal((await auth.getUser(qaUid)).customClaims.admin, false);
  await edit({ admin: true });
  await other.evaluate(async () => { const { auth } = await import('/src/lib/firebase.js'); const { signOut } = await import('/node_modules/.vite/deps/firebase_auth.js'); await signOut(auth); });
  otherToken = await signInNewUser(other, password);
  await edit({ disabled: true });
  assert.equal((await api('/api/admin-users', 'GET', null, otherToken)).status(), 401);
  assert.equal((await auth.getUser(qaUid)).disabled, true);
  await edit({ disabled: false });
  await secondContext.close();
  pass('remove/re-grant access, disable/re-enable and block already-issued sessions');

  await page.getByLabel('Search users').fill('');
  await page.screenshot({ path: 'scratch/admin-users-desktop.png', animations: 'disabled' });
  await page.setViewportSize({ width: 390, height: 844 });
  await nav('Media Library'); await expect(page.locator('.admin-media-tile').first()).toBeVisible();
  assert.equal(await page.evaluate(() => globalThis.document.documentElement.scrollWidth > globalThis.innerWidth + 1), false);
  await page.screenshot({ path: 'scratch/media-library-mobile.png', animations: 'disabled' });
  await nav('Users'); await page.getByLabel('Search users').fill(qaEmail);
  await page.getByRole('button', { name: `Edit ${qaEmail}` }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  assert.equal(await page.evaluate(() => globalThis.document.documentElement.scrollWidth > globalThis.innerWidth + 1), false);
  await page.screenshot({ path: 'scratch/admin-users-mobile.png', animations: 'disabled' });
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0);
  pass('desktop/mobile layouts, dialogs and Escape behavior');

  await page.getByRole('button', { name: `Delete ${qaEmail}` }).click();
  await page.getByRole('button', { name: 'Delete permanently', exact: true }).click();
  await expect(page.locator('.admin-notice')).toContainText('User deleted');
  await assert.rejects(auth.getUser(qaUid), (error) => error.code === 'auth/user-not-found');
  qaUid = null;
  await store.collection('posts').doc(qaSlug).delete(); recordCreated = false;
  await nav('Media Library'); await page.getByLabel('Media folder').selectOption('assets');
  await page.locator('.admin-media-tile').filter({ hasText: `qa-library-${stamp}.png` }).click();
  await expect(page.getByRole('button', { name: 'Delete image', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Delete image', exact: true }).click();
  await page.getByRole('button', { name: 'Delete permanently', exact: true }).click();
  await expect(page.locator('.admin-notice')).toContainText('Image deleted'); uploads.delete(uploaded.public_id);
  pass('permanent deletion of temporary account and unused image; real content stays untouched');
  assert.deepEqual(errors, []);
  pass('no uncaught browser errors');
} finally {
  if (!qaUid) qaUid = await auth.getUserByEmail(qaEmail).then((user) => user.uid).catch(() => null);
  if (qaUid) await auth.deleteUser(qaUid);
  if (recordCreated || (await store.collection('posts').doc(qaSlug).get()).exists) await store.collection('posts').doc(qaSlug).delete();
  for (const publicId of uploads) await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
  await browser.close(); await deleteApp(app);
  console.log('CLEANUP temporary users, draft and test uploads removed.');
}
