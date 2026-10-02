import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium, expect as baseExpect } from '@playwright/test';
import { getAuth } from 'firebase-admin/auth';
import { deleteApp } from 'firebase-admin/app';
import { getAdminApp, getAdminStore } from '../server/firebase-admin.js';
import { DEFAULT_END_QUOTE } from '../shared/content.js';

process.loadEnvFile('.env.local');
const email = process.argv[2];
if (!email) throw new Error('Usage: node scripts/check-blog-options.mjs <existing-admin-email>');
const base = process.env.ADMIN_TEST_URL || 'http://127.0.0.1:5180';
const expect = baseExpect.configure({ timeout: 30000 });
const app = getAdminApp();
const store = getAdminStore();
const auth = getAuth(app);
const user = await auth.getUserByEmail(email);
assert.equal(user.customClaims?.admin, true);
const token = await auth.createCustomToken(user.uid);
const stamp = Date.now();
const slug = `qa-blog-options-${stamp}`;
const title = `QA Blog Options ${stamp}`;
const quote = 'Good design makes complex things feel simple.\n<script>window.__quoteXss = true</script>';
const reference = store.collection('posts').doc(slug);
assert.equal((await reference.get()).exists, false);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
const admin = await context.newPage();
const readerContext = await browser.newContext({ viewport: { width: 1440, height: 960 } });
const reader = await readerContext.newPage();
const errors = [];
for (const page of [admin, reader]) page.on('pageerror', (error) => errors.push(error.message));
const preview = admin.frameLocator('iframe[title="Article website preview"]');
const wrapped = (text) => `\u201c ${text} \u201d`;
const save = async (label) => {
  const response = admin.waitForResponse((response) => response.url().endsWith('/api/admin-content') && ['POST', 'PUT'].includes(response.request().method()));
  await admin.getByRole('button', { name: label, exact: true }).click();
  const result = await response;
  assert.equal(result.ok(), true, await result.text());
  await expect(admin).toHaveURL(`${base}/admin/posts/${slug}`);
  await expect(admin.getByRole('button', { name: /^(Publish|Update)$/ })).toBeEnabled();
  return (await result.json()).item;
};
const openPreview = async () => {
  await admin.getByRole('button', { name: 'Preview article', exact: true }).click();
  await expect(admin.getByRole('dialog', { name: 'Article site preview' })).toBeVisible();
};
const closePreview = async () => admin.getByRole('button', { name: 'Close preview', exact: true }).click();

try {
  await mkdir('scratch', { recursive: true });
  await admin.goto(`${base}/admin`);
  await expect(admin.getByRole('heading', { name: 'Admin sign in' })).toBeVisible();
  await admin.evaluate(async (customToken) => {
    const { auth } = await import('/src/lib/firebase.js');
    const { signInWithCustomToken } = await import('/node_modules/.vite/deps/firebase_auth.js');
    await signInWithCustomToken(auth, customToken);
  }, token);
  await expect(admin.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible();
  await admin.goto(`${base}/admin/posts/new`);
  await admin.getByLabel('Title', { exact: true }).fill(title);
  await admin.getByLabel('Slug', { exact: true }).fill(slug);
  await admin.getByLabel('Excerpt', { exact: true }).fill('Temporary quote and sidebar check.');
  await admin.getByLabel('Paragraph 1', { exact: true }).fill(Array.from({ length: 24 }, (_, i) => `Paragraph ${i + 1}. ${'Thoughtful design makes the information clear and easy to read. '.repeat(10)}`).join('\n\n'));
  await expect(admin.getByLabel('Default quote', { exact: true })).toBeChecked();
  const initial = await save('Save draft');
  assert.equal(initial.endQuoteMode, 'default');
  await admin.getByLabel('Custom quote', { exact: true }).check();
  await expect(admin.getByLabel('Custom end quote', { exact: true })).toHaveValue(DEFAULT_END_QUOTE);
  await admin.getByLabel('Custom end quote', { exact: true }).fill(quote);
  await openPreview();
  await expect(preview.locator('.blockquote-wrap h5')).toHaveText(wrapped(quote));
  await closePreview();
  const draft = await save('Save draft');
  assert.equal(draft.endQuoteMode, 'custom');
  assert.equal(draft.endQuote, quote);
  assert.equal((await reference.get()).get('endQuote'), quote);
  await admin.reload();
  await expect(admin.getByLabel('Custom quote', { exact: true })).toBeChecked();
  await expect(admin.getByLabel('Custom end quote', { exact: true })).toHaveValue(quote);
  console.log('PASS original default, custom prefill, unsaved full-site preview and real draft/reload persistence');

  await admin.getByLabel('Custom end quote', { exact: true }).fill(' ');
  await admin.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(admin.getByRole('alert')).toContainText('Enter a custom end quote');
  await openPreview();
  await expect(admin.locator('.site-preview-status[role="alert"]')).toContainText('Enter a custom end quote');
  await closePreview();
  await admin.getByLabel('Custom end quote', { exact: true }).fill(quote);
  await save('Publish');
  await reader.goto(`${base}/blog/single/${slug}`);
  await expect(reader.locator('.blockquote-wrap h5')).toHaveText(wrapped(quote));
  assert.equal(await reader.locator('.blockquote-wrap script').count(), 0);
  assert.equal(await reader.evaluate(() => globalThis.__quoteXss), undefined);
  console.log('PASS empty quote validation in save/preview, publication and safe plain-text public rendering');

  const sidebar = reader.getByRole('complementary', { name: 'Blog sidebar' });
  await expect(sidebar).toBeVisible();
  const sidebarState = () => sidebar.evaluate((element) => ({
    scrollbar: globalThis.getComputedStyle(element).scrollbarWidth,
    webkitScrollbar: globalThis.getComputedStyle(element, '::-webkit-scrollbar').display,
    position: globalThis.getComputedStyle(element).position,
    transforms: [...element.children].map((child) => globalThis.getComputedStyle(child).transform),
    scroll: element.scrollHeight, height: element.clientHeight,
  }));
  const initialSidebar = await sidebarState();
  assert.equal(initialSidebar.scrollbar, 'none');
  assert.equal(initialSidebar.webkitScrollbar, 'none');
  assert.equal(initialSidebar.position, 'sticky');
  assert.ok(initialSidebar.transforms.every((transform) => transform === 'none'));
  const article = reader.locator('.blog-single-wrap');
  const articleTop = await article.evaluate((element) => element.getBoundingClientRect().top + globalThis.scrollY);
  await reader.evaluate((top) => globalThis.scrollTo(0, top + 400), articleTop);
  await expect.poll(() => sidebar.evaluate((element) => Math.round(element.getBoundingClientRect().top))).toBe(110);
  assert.equal((await sidebarState()).scrollbar, 'none');
  await reader.screenshot({ path: 'scratch/blog-sidebar-no-scrollbar.png', animations: 'disabled' });

  await reader.setViewportSize({ width: 1280, height: 600 });
  assert.ok((await sidebarState()).scroll > (await sidebarState()).height);
  await reader.bringToFront();
  await sidebar.focus();
  await sidebar.press('End');
  await expect.poll(() => sidebar.evaluate((element) => Math.round(element.scrollTop - (element.scrollHeight - element.clientHeight)))).toBe(0);
  await expect(sidebar.getByText('Data readiness', { exact: true })).toBeInViewport();
  await reader.waitForTimeout(300);
  await sidebar.press('Home');
  await expect.poll(() => sidebar.evaluate((element) => element.scrollTop)).toBe(0);
  const box = await sidebar.boundingBox();
  await reader.mouse.move(box.x + box.width / 2, box.y + Math.min(100, box.height / 2));
  await reader.mouse.wheel(0, 500);
  await expect.poll(() => sidebar.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await expect(sidebar.getByText('Data readiness', { exact: true })).toBeInViewport();

  const articleEnd = await article.evaluate((element) => element.getBoundingClientRect().bottom + globalThis.scrollY);
  await reader.evaluate((end) => globalThis.scrollTo(0, end - 180), articleEnd);
  await reader.waitForTimeout(500);
  assert.ok(await sidebar.evaluate((element) => element.getBoundingClientRect().bottom) <= await article.evaluate((element) => element.getBoundingClientRect().bottom) + 3);
  await reader.setViewportSize({ width: 390, height: 844 });
  assert.equal((await sidebarState()).position, 'static');
  assert.equal(await reader.locator('html').evaluate((element) => element.scrollWidth > element.clientWidth + 1), false);
  await sidebar.getByText('Data readiness', { exact: true }).scrollIntoViewIfNeeded();
  await expect(sidebar.getByText('Data readiness', { exact: true })).toBeInViewport();
  await reader.screenshot({ path: 'scratch/blog-sidebar-mobile.png', animations: 'disabled' });
  console.log('PASS consistent hidden scrollbar, no initial widget translation, sticky boundaries, short-screen keyboard/wheel access and mobile flow');

  await admin.getByLabel('Default quote', { exact: true }).check();
  await save('Update');
  await reader.reload();
  await expect(reader.locator('.blockquote-wrap h5')).toHaveText(wrapped(DEFAULT_END_QUOTE));
  assert.equal((await reference.get()).get('endQuoteMode'), 'default');
  assert.equal((await reference.get()).get('endQuote'), quote);
  await admin.reload();
  await expect(admin.getByLabel('Default quote', { exact: true })).toBeChecked();
  await admin.getByLabel('Custom quote', { exact: true }).check();
  await expect(admin.getByLabel('Custom end quote', { exact: true })).toHaveValue(quote);
  await admin.setViewportSize({ width: 390, height: 844 });
  await admin.locator('.admin-end-quote').scrollIntoViewIfNeeded();
  assert.equal(await admin.locator('html').evaluate((element) => element.scrollWidth > element.clientWidth + 1), false);
  await admin.screenshot({ path: 'scratch/admin-end-quote-mobile.png', animations: 'disabled' });
  await admin.goto(`${base}/admin/projects/new`);
  await expect(admin.getByLabel('Title', { exact: true })).toBeVisible();
  await expect(admin.locator('.admin-end-quote')).toHaveCount(0);
  assert.deepEqual(errors, []);
  console.log('PASS default restoration without losing saved custom text, mobile editor and project isolation; no browser errors');
} finally {
  await browser.close();
  try {
    const record = await reference.get();
    if (record.exists) {
      assert.equal(record.get('title'), title, 'Refusing to delete a record not owned by this test');
      await reference.delete();
      console.log('Cleaned up temporary QA article.');
    }
  } finally { await deleteApp(app); }
}
