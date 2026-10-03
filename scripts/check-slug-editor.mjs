import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium, expect as baseExpect } from '@playwright/test';
import { getAuth } from 'firebase-admin/auth';
import { deleteApp } from 'firebase-admin/app';
import { getAdminApp } from '../server/firebase-admin.js';
import { prepareContent } from '../shared/content.js';
import { IMAGE_REQUIREMENTS, imageRatioError } from '../src/admin/imageRequirements.js';
import { signInAdminTest } from './admin-test-login.mjs';

process.loadEnvFile('.env.local');
const email = process.argv[2];
if (!email) throw new Error('Usage: node scripts/check-slug-editor.mjs <existing-admin-email> [cover-image.png]');
const coverPath = process.argv[3];
const base = process.env.ADMIN_TEST_URL || 'http://localhost:5173';
const expect = baseExpect.configure({ timeout: 30000 });
const app = getAdminApp();
const auth = getAuth(app);
const user = await auth.getUserByEmail(email);
assert.equal(user.customClaims?.admin, true);
const token = await auth.createCustomToken(user.uid);
const content = {
  posts: [{ slug: 'existing-article-url', title: 'Existing article', excerpt: 'A summary.', body: 'Original text.', status: 'draft' }],
  projects: [{ slug: 'existing-project-url', title: 'Existing project', summary: 'A summary.', details: 'Original details.', status: 'draft' }],
};
let saves = 0;
const errors = [];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
await context.route('**/api/admin-content', async (route) => {
  if (route.request().method() === 'GET') return route.fulfill({ json: { content } });
  const { type, slug, originalSlug, data } = route.request().postDataJSON();
  const item = { ...prepareContent(type, data), slug };
  content[type] = [item, ...content[type].filter((entry) => entry.slug !== originalSlug)];
  saves++;
  await route.fulfill({ json: { item } });
});
const page = await context.newPage();
page.on('pageerror', (error) => errors.push(error.message));
const title = page.getByLabel('Title', { exact: true });
const slug = page.getByLabel('Slug', { exact: true });

try {
  await page.goto(`${base}/admin`);
  await expect(page.getByRole('heading', { name: 'Admin sign in' })).toBeVisible();
  await signInAdminTest(page, { base, email, customToken: token });
  await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible();

  for (const type of ['posts', 'projects']) {
    await page.goto(`${base}/admin/${type}/new`);
    await title.fill('Designing a Website That Builds Trust');
    await expect(slug).toHaveValue('designing-a-website-that-builds-trust');
    await title.fill('A New Website, With Confidence!');
    await expect(slug).toHaveValue('a-new-website-with-confidence');
    await slug.fill(' My Custom URL ');
    await title.fill('Another Title');
    await expect(slug).toHaveValue('my-custom-url');
    await slug.fill('');
    await slug.pressSequentially('my first project');
    await expect(slug).toHaveValue('my-first-project');
    await title.fill('Title Must Not Override a Manual URL');
    await expect(slug).toHaveValue('my-first-project');
    await slug.fill('');
    await title.fill('Fresh Title After Clearing');
    await expect(slug).toHaveValue('fresh-title-after-clearing');
    await slug.fill('My Pasted Title & A Better URL!!!');
    await slug.blur();
    await expect(slug).toHaveValue('my-pasted-title-a-better-url');
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    await expect(page).toHaveURL(`${base}/admin/${type}/my-pasted-title-a-better-url`);
    await title.fill('Changed After First Save');
    await expect(slug).toHaveValue('my-pasted-title-a-better-url');
    console.log(`PASS ${type}: automatic title slug, pasted text, real space typing, manual override, reset and stable URL after save`);
  }

  for (const [type, original] of [['posts', 'existing-article-url'], ['projects', 'existing-project-url']]) {
    await page.goto(`${base}/admin/${type}/${original}`);
    await title.fill('Updated Title With A Completely Different Name');
    await expect(slug).toHaveValue(original);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await slug.fill('A Mobile Project Name');
  await slug.blur();
  await expect(slug).toHaveValue('a-mobile-project-name');
  assert.equal(await page.evaluate(() => globalThis.document.documentElement.scrollWidth > globalThis.innerWidth + 1), false);
  assert.equal(saves, 2);
  assert.deepEqual(errors, []);
  console.log('PASS saved blogs/projects keep their existing slugs when the title changes, and mobile editing has no overflow');

  if (coverPath) {
    const cover = await readFile(coverPath);
    assert.equal(cover.subarray(1, 4).toString(), 'PNG');
    const width = cover.readUInt32BE(16);
    const height = cover.readUInt32BE(20);
    assert.equal(imageRatioError(IMAGE_REQUIREMENTS.coverUrl, width, height), '');
    assert.ok(cover.length < 15 * 1024 * 1024);
    console.log(`PASS supplied cover: ${width} x ${height}, accepted by the cover upload ratio and size checks`);
  }
} finally {
  await browser.close();
  await deleteApp(app);
}
