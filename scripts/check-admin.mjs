import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium, expect as baseExpect } from '@playwright/test';
import { getAuth } from 'firebase-admin/auth';
import { deleteApp } from 'firebase-admin/app';
import { v2 as cloudinary } from 'cloudinary';
import { getAdminApp, getAdminStore } from '../server/firebase-admin.js';

const expect = baseExpect.configure({ timeout: 30000 });

async function checkAdmin() {
process.loadEnvFile('.env.local');
const email = process.argv[2];
if (!email) throw new Error('Usage: node scripts/check-admin.mjs <existing-admin-email>');
const base = process.env.ADMIN_TEST_URL || 'http://localhost:5173';
const app = getAdminApp();
const store = getAdminStore();
const user = await getAuth(app).getUserByEmail(email);
assert.equal(user.customClaims?.admin, true, 'The test account must already be an admin.');
const token = await getAuth(app).createCustomToken(user.uid);
const stamp = Date.now();
const blogSlug = `qa-admin-blog-${stamp}`;
const projectSlug = `qa-admin-project-${stamp}`;
const uploadedAssets = new Set();
const failures = [];
cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
const page = await context.newPage();
const publicPage = await context.newPage();
page.on('pageerror', (error) => failures.push(error.message));
publicPage.on('pageerror', (error) => failures.push(error.message));
page.on('response', async (response) => {
  if (response.url().includes('api.cloudinary.com') && response.ok()) {
    const result = await response.json().catch(() => null);
    if (result?.public_id) uploadedAssets.add(result.public_id);
  }
});
const pass = (message) => console.log(`PASS ${message}`);
const field = (name) => page.getByLabel(name, { exact: true });
const waitForSave = async () => {
  await expect(page.getByRole('button', { name: 'Saving...', exact: true })).toHaveCount(0, { timeout: 30000 });
  await expect(page.locator('.admin-error:visible')).toHaveCount(0);
};
const publicRecord = async (type, slug) => {
  const response = await page.request.get(`${base}/api/content?type=${type}&slug=${slug}`);
  return { status: response.status(), data: await response.json() };
};
const uploadSlot = async (inputIndex, fixture, crop = false) => {
  await page.locator('input[type=file]').nth(inputIndex).setInputFiles(resolve(fixture));
  if (crop) {
    await expect(page.locator('dialog[open]')).toBeVisible();
    await page.getByLabel('Zoom', { exact: true }).focus();
    await page.getByLabel('Zoom', { exact: true }).press('ArrowRight');
    await expect(page.getByRole('button', { name: 'Crop & upload' })).toBeEnabled();
    await page.getByRole('button', { name: 'Crop & upload' }).click();
  }
  await expect(page.locator('.admin-notice')).toContainText('Image uploaded', { timeout: 60000 });
  await expect(page.locator('.admin-error:visible')).toHaveCount(0);
};

try {
  await mkdir('scratch', { recursive: true });
  await page.goto(`${base}/admin`);
  await expect(page.getByRole('heading', { name: 'Admin sign in' })).toBeVisible();
  await field('Email').fill('not-an-admin@example.invalid');
  await field('Password').fill('invalid-test-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Sign-in failed', { timeout: 20000 });
  pass('invalid login shows an error without crashing');
  await page.evaluate(async (customToken) => {
    const { auth } = await import('/src/lib/firebase.js');
    const { signInWithCustomToken } = await import('/node_modules/.vite/deps/firebase_auth.js');
    await signInWithCustomToken(auth, customToken);
  }, token);
  await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible({ timeout: 30000 });
  await expect(page.locator('.admin-recent > button').first()).toBeVisible({ timeout: 30000 });
  await page.screenshot({ path: 'scratch/admin-overview-desktop.png', fullPage: true });
  pass('admin access, dashboard counts and existing content load');
  assert.equal((await page.request.get(`${base}/api/admin-content`)).status(), 401);
  assert.equal((await page.request.post(`${base}/api/cloudinary-sign`, { data: {} })).status(), 401);
  assert.equal((await page.request.get(`${base}/api/admin-content`, { headers: { Authorization: 'Bearer invalid-token' } })).status(), 401);
  const idToken = await page.evaluate(async () => (await import('/src/lib/firebase.js')).auth.currentUser.getIdToken());
  const adminApi = (method, data) => page.request.fetch(`${base}/api/admin-content`, {
    method, headers: { Authorization: `Bearer ${idToken}` }, data,
  });
  assert.equal((await adminApi('DELETE')).status(), 405);
  assert.equal((await adminApi('POST', { type: 'posts', slug: 'new', data: { title: 'Invalid route' } })).status(), 400);
  pass('API requires admin authentication and rejects invalid methods and reserved slugs');
  await page.locator('.admin-sidebar').getByRole('button', { name: /^Blogs/ }).click();
  await expect(page.locator('.admin-table tbody tr')).not.toHaveCount(0);
  await page.getByRole('textbox', { name: 'Search blogs' }).fill('future-of-ui-ux');
  await expect(page.locator('.admin-table tbody tr')).toHaveCount(1);
  await page.getByRole('textbox', { name: 'Search blogs' }).fill('');
  pass('blog list and search');
  await page.getByRole('button', { name: 'Add new', exact: true }).click();
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Slug');
  await field('Title').fill('QA admin article');
  await field('Slug').fill(blogSlug);
  await field('Excerpt').fill('QA excerpt for the admin verification.');
  await field('Category').fill('QA');
  await field('Paragraph 1').fill('QA original article body.');
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(page).toHaveURL(`${base}/admin/posts/${blogSlug}`, { timeout: 30000 });
  await waitForSave();
  assert.equal((await publicRecord('posts', blogSlug)).status, 404);
  await page.reload();
  await expect(field('Paragraph 1')).toHaveValue(/QA original/);
  assert.equal((await adminApi('POST', { type: 'posts', slug: blogSlug, data: { title: 'Duplicate' } })).status(), 409);
  pass('new draft saves without a featured image and survives reload; draft is private');

  await page.locator('input[type=file]').first().setInputFiles(resolve('public/assets/images/section/cora-beauty-1.webp'));
  await expect(page.locator('dialog[open]')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.locator('dialog')).toHaveCount(0);
  await expect(field('Cover URL')).toHaveValue('');
  pass('wrong-ratio image opens crop; cancel leaves the cover unchanged');
  await page.route('**/api/cloudinary-sign', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '' }));
  await page.locator('input[type=file]').first().setInputFiles(resolve('public/assets/images/section/cora-beauty-ecommerce-mockup.webp'));
  await expect(page.getByRole('alert')).toContainText('empty response');
  await page.unroute('**/api/cloudinary-sign');
  pass('empty upload response produces a readable error and allows retry');
  await uploadSlot(0, 'public/assets/images/section/cora-beauty-1.webp', true);
  await expect(field('Cover URL')).toHaveValue(/res\.cloudinary\.com/);
  await page.getByRole('button', { name: 'Remove image', exact: true }).click();
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  await waitForSave();
  assert.equal((await publicRecord('posts', blogSlug)).status, 200);
  await publicPage.goto(`${base}/blog/single/${blogSlug}`);
  await expect(publicPage.getByText('QA original article body.', { exact: true })).toBeVisible({ timeout: 30000 });
  await expect(publicPage.locator('img[src=""]')).toHaveCount(0);
  pass('crop upload works and article publishes without a cover on the public site');
  await field('Paragraph 1').fill('QA updated article body.');
  await page.route('**/api/admin-content', (route) => route.request().method() === 'PUT'
    ? route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"Temporary test outage"}' }) : route.continue());
  await page.getByRole('button', { name: 'Update', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Temporary test outage');
  await expect(field('Paragraph 1')).toHaveValue('QA updated article body.');
  await page.unroute('**/api/admin-content');
  await page.getByRole('button', { name: 'Update', exact: true }).click();
  await waitForSave();
  await expect(publicPage.getByText('QA updated article body.', { exact: true })).toBeVisible({ timeout: 30000 });
  pass('save failure preserves edits; retry updates the already-open public article');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Archive item', exact: true }).click();
  await expect(page.locator('.admin-notice')).toContainText('Archived');
  assert.equal((await publicRecord('posts', blogSlug)).status, 404);
  await expect(publicPage.getByRole('heading', { name: '404 Page Not Found', exact: true })).toBeVisible({ timeout: 30000 });
  await page.getByRole('button', { name: 'Restore draft', exact: true }).click();
  await waitForSave();
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  await waitForSave();
  assert.equal((await publicRecord('posts', blogSlug)).status, 200);
  pass('archive removes public content; restore and republish work');
  await publicPage.goto(`${base}/blog`);
  const articleLink = publicPage.getByRole('link', { name: 'QA admin article', exact: true });
  await expect(articleLink).toBeVisible();
  await articleLink.scrollIntoViewIfNeeded();
  await expect(articleLink.locator('xpath=ancestor::*[contains(@class,"article-blog")]')).toHaveClass(/is-visible/);
  await articleLink.click();
  await expect(publicPage).toHaveURL(`${base}/blog/single/${blogSlug}`);
  await expect(publicPage.getByText('QA updated article body.', { exact: true })).toBeVisible();
  pass('published article appears in the blog grid and its link opens the saved article');

  await page.locator('.admin-sidebar').getByRole('button', { name: /^Projects/ }).click();
  await page.getByRole('button', { name: 'Add new', exact: true }).click();
  await field('Title').fill('QA Project');
  await field('Slug').fill(projectSlug);
  await field('Summary').fill('QA project summary.');
  await field('Industry').fill('QA industry');
  await field('Deliverables').fill('Design, Development');
  await field('Project details').fill('QA project details.');
  await field('More details').fill('QA additional details.');
  await field('Research').fill('QA research.');
  await field('Results').fill('QA results.');
  await field('Featured on home').check();
  await field('Sort order').fill('0');
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(page).toHaveURL(`${base}/admin/projects/${projectSlug}`, { timeout: 30000 });
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('all three gallery');
  await uploadSlot(1, 'public/assets/images/section/cora-beauty-1.webp');
  await uploadSlot(2, 'public/assets/images/section/cora-beauty-2.webp', true);
  await uploadSlot(3, 'public/assets/images/section/cora-beauty-3.webp');
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  await waitForSave();
  const project = await publicRecord('projects', projectSlug);
  assert.equal(project.status, 200);
  assert.equal(project.data.coverUrl, '');
  assert.equal(project.data.galleryUrls.length, 3);
  await publicPage.goto(`${base}/project/${projectSlug}`);
  await expect(publicPage.getByText('QA project details.', { exact: true })).toBeVisible({ timeout: 30000 });
  await expect(publicPage.getByText('QA research.', { exact: true })).toBeVisible();
  await expect(publicPage.getByText('QA results.', { exact: true })).toBeVisible();
  await expect(publicPage.locator('img[src=""]')).toHaveCount(0);
  pass('project saves all fields and three gallery uploads; publishes without cover');
  await page.reload();
  await expect(page.getByRole('img', { name: 'Gallery 2 preview', exact: true })).toHaveAttribute('src', project.data.galleryUrls[1]);
  await page.getByRole('button', { name: 'Remove image 2', exact: true }).click();
  await page.getByRole('button', { name: 'Update', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('all three gallery');
  await uploadSlot(2, 'public/assets/images/section/cora-beauty-2.webp', true);
  await page.getByRole('button', { name: 'Update', exact: true }).click();
  await waitForSave();
  const updated = await publicRecord('projects', projectSlug);
  assert.equal(updated.data.galleryUrls[0], project.data.galleryUrls[0]);
  assert.equal(updated.data.galleryUrls[2], project.data.galleryUrls[2]);
  assert.notEqual(updated.data.galleryUrls[1], project.data.galleryUrls[1]);
  pass('replacing a gallery image preserves the other image positions');

  await publicPage.goto(`${base}/works`);
  const projectLink = publicPage.getByRole('link', { name: 'QA Project', exact: true }).last();
  await expect(projectLink).toBeVisible();
  await projectLink.scrollIntoViewIfNeeded();
  await expect(projectLink.locator('xpath=ancestor::*[contains(@class,"featured-works-item")][1]')).toBeVisible();
  await projectLink.click();
  await expect(publicPage).toHaveURL(`${base}/project/${projectSlug}`);
  await expect(publicPage.getByText('QA project details.', { exact: true })).toBeVisible();
  await publicPage.goto(`${base}/`);
  await expect(publicPage.locator('.recent-works-section').getByRole('link', { name: 'QA Project', exact: true }).last()).toBeVisible();
  await expect(publicPage.locator('.section-featured-works').getByRole('link', { name: 'QA Project', exact: true }).last()).toBeVisible();
  pass('published project appears in Works and both home project sections with working links');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('input[type=file]').first().setInputFiles(resolve('public/assets/images/section/cora-beauty-1.webp'));
  await expect(page.locator('dialog[open]')).toBeVisible();
  const bounds = await page.locator('dialog').boundingBox();
  assert(bounds.x >= 0 && bounds.x + bounds.width <= 391);
  await page.screenshot({ path: 'scratch/admin-crop-mobile.png' });
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await page.locator('.admin-sidebar').getByRole('button', { name: /^Projects/ }).click();
  await page.getByRole('textbox', { name: 'Search projects' }).fill(projectSlug);
  await expect(page.locator('.admin-table tbody tr')).toHaveCount(1);
  await page.locator('.admin-filters').getByRole('button', { name: /^Draft/ }).click();
  await expect(page.locator('.admin-empty')).toContainText('No matching items');
  await page.locator('.admin-filters').getByRole('button', { name: /^Published/ }).click();
  await expect(page.locator('.admin-table tbody tr')).toHaveCount(1);
  await page.getByRole('button', { name: 'Refresh content', exact: true }).click();
  await expect(page.locator('.admin-table tbody tr')).toHaveCount(1);
  await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Admin sign in' })).toBeVisible();
  assert.deepEqual(failures, [], 'There must be no uncaught browser errors.');
  pass('mobile crop layout, project search, refresh and sign-out; no uncaught page errors');
} catch (error) {
  await page.screenshot({ path: 'scratch/admin-check-failure.png', fullPage: true }).catch(() => {});
  console.error('Browser location:', new URL(page.url()).pathname);
  console.error('Visible admin alerts:', await page.getByRole('alert').allTextContents());
  throw error;
} finally {
  await context.close();
  await browser.close();
  for (const [type, slug] of [['posts', blogSlug], ['projects', projectSlug]]) await store.collection(type).doc(slug).delete();
  for (const publicId of uploadedAssets) await cloudinary.uploader.destroy(publicId);
  await deleteApp(app);
  console.log('Temporary test content and uploaded test images cleaned up.');
}
}

checkAdmin().catch((error) => {
  console.error('Admin check failed:', error.message);
  process.exitCode = 1;
});
