import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium, expect as baseExpect } from '@playwright/test';
import { getAuth } from 'firebase-admin/auth';
import { deleteApp } from 'firebase-admin/app';
import { v2 as cloudinary } from 'cloudinary';
import { getAdminApp, getAdminStore } from '../server/firebase-admin.js';

process.loadEnvFile('.env.local');
const email = process.argv[2];
if (!email) throw new Error('Usage: node scripts/check-block-editor.mjs <existing-admin-email>');
const base = process.env.ADMIN_TEST_URL || 'http://localhost:5173';
const expect = baseExpect.configure({ timeout: 30000 });
const app = getAdminApp();
const store = getAdminStore();
const auth = getAuth(app);
const user = await auth.getUserByEmail(email);
assert.equal(user.customClaims?.admin, true);
const token = await auth.createCustomToken(user.uid);
const stamp = Date.now();
const blogSlug = `qa-block-blog-${stamp}`;
const renamedBlog = `${blogSlug}-renamed`;
const finalBlog = `${blogSlug}-final`;
const projectSlug = `qa-block-project-${stamp}`;
const renamedProject = `${projectSlug}-renamed`;
const uploads = new Set();
const failures = [];
cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
const page = await context.newPage();
const publicPage = await context.newPage();
for (const tab of [page, publicPage]) tab.on('pageerror', (error) => failures.push(error.message));
page.on('response', async (response) => {
  if (response.url().includes('api.cloudinary.com') && response.ok()) {
    const data = await response.json().catch(() => null);
    if (data?.public_id) uploads.add(data.public_id);
  }
});
const field = (name) => page.getByLabel(name, { exact: true });
const insert = async (position, type) => {
  const inserter = page.locator('.block-inserter').nth(position);
  await inserter.locator('summary').click();
  await inserter.getByRole('button', { name: type, exact: true }).click();
};
const save = async (label) => {
  await page.getByRole('button', { name: label, exact: true }).click();
  await expect(page.getByRole('button', { name: 'Saving...', exact: true })).toHaveCount(0);
  await expect(page.locator('.admin-error:visible')).toHaveCount(0);
};
const record = async (type, slug) => {
  const response = await page.request.get(`${base}/api/content?type=${type}&slug=${slug}`);
  return { status: response.status(), data: await response.json() };
};
const screenshot = async (path) => {
  await page.waitForTimeout(500);
  await page.screenshot({ path, animations: 'disabled' });
};

try {
  await mkdir('scratch', { recursive: true });
  await page.goto(`${base}/admin`);
  await expect(page.getByRole('heading', { name: 'Admin sign in' })).toBeVisible();
  await page.evaluate(async (customToken) => {
    const { auth } = await import('/src/lib/firebase.js');
    const { signInWithCustomToken } = await import('/node_modules/.vite/deps/firebase_auth.js');
    await signInWithCustomToken(auth, customToken);
  }, token);
  await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible();
  await page.goto(`${base}/admin/posts/new`);
  await field('Title').fill('QA block article');
  await field('Slug').fill(blogSlug);
  await field('Excerpt').fill('Testing an article with images between paragraphs.');
  await field('Category').fill('QA');
  await field('Paragraph 1').fill('First paragraph before the image.');
  await insert(1, 'Paragraph');
  await field('Paragraph 2').fill('Second paragraph before the image.');
  await insert(2, 'Image');
  await insert(3, 'Paragraph');
  await field('Paragraph 4').fill('Third paragraph after the image.');
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('empty image block');
  await page.getByLabel('Image 3 upload', { exact: true }).setInputFiles(resolve('public/assets/images/section/cora-beauty-1.webp'));
  await expect(page.locator('dialog')).toHaveCount(0);
  await expect(field('Image 3 URL')).toHaveValue(/res\.cloudinary\.com/, { timeout: 60000 });
  await field('Image 3 alt text').fill('Inline portfolio image');
  await field('Image 3 caption').fill('Image inside the article, after two paragraphs.');
  await insert(4, 'Heading');
  await field('Heading 5').fill('A heading inside the article');
  await field('Block 5 heading level').selectOption('3');
  await insert(5, 'List');
  await field('List 6 items').fill('First list item\nSecond list item');
  await field('Block 6 list style').selectOption('ordered');
  await insert(6, 'Quote');
  await field('Quote 7').fill('A useful quote.');
  await field('Quote 7 attribution').fill('QA Author');
  await insert(7, 'Divider');
  await page.getByRole('button', { name: 'Duplicate block 4', exact: true }).click();
  await expect(page.locator('.article-editor-block')).toHaveCount(9);
  await page.getByRole('button', { name: 'Delete block 5', exact: true }).click();
  await page.getByRole('button', { name: 'Move block 3 up', exact: true }).click();
  assert.equal(await page.locator('.article-editor-block').nth(1).getAttribute('data-block-type'), 'image');
  await page.getByRole('button', { name: 'Move block 2 down', exact: true }).click();
  assert.equal(await page.locator('.article-editor-block').nth(2).getAttribute('data-block-type'), 'image');
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  const preview = page.frameLocator('iframe[title="Article website preview"]');
  await expect(preview.locator('.article-blocks figure')).toHaveCount(1);
  await expect(preview.locator('.article-blocks h3')).toHaveText('A heading inside the article');
  await expect(preview.locator('.article-blocks ol li')).toHaveCount(2);
  await expect(preview.locator('.article-blocks blockquote cite')).toHaveText('QA Author');
  await page.getByRole('button', { name: 'Close preview', exact: true }).click();
  await save('Save draft');
  await expect(page).toHaveURL(`${base}/admin/posts/${blogSlug}`);
  assert.equal((await record('posts', blogSlug)).status, 404);
  await page.reload();
  await expect(page.locator('.article-editor-block')).toHaveCount(8);
  await expect(field('Image 3 URL')).toHaveValue(/res\.cloudinary\.com/);
  await screenshot('scratch/block-editor-desktop.png');
  console.log('PASS block insertion, ordering, duplication, removal, arbitrary-ratio upload, preview, draft/reload');

  await save('Publish');
  await expect(page.getByRole('status')).toContainText('Published successfully.');
  const published = (await record('posts', blogSlug)).data;
  assert.equal(published.coverUrl, '');
  assert.equal(published.blocks.length, 8);
  await publicPage.goto(`${base}/blog/single/${blogSlug}`);
  await expect(publicPage.locator('.article-blocks figure img')).toHaveAttribute('alt', 'Inline portfolio image');
  const order = await publicPage.locator('.article-blocks').evaluate((body) => [...body.children].map((element) => element.tagName));
  assert.deepEqual(order, ['P', 'P', 'FIGURE', 'P', 'H3', 'OL', 'BLOCKQUOTE', 'HR']);
  await publicPage.locator('.article-blocks figure').scrollIntoViewIfNeeded();
  await expect(publicPage.locator('.article-blocks figure img')).toBeVisible();
  assert.equal(await publicPage.locator('.article-blocks figure img').evaluate((image) => image.complete && image.naturalWidth > 0), true);
  await publicPage.screenshot({ path: 'scratch/block-article-desktop.png', animations: 'disabled' });
  console.log('PASS public article renders paragraphs, inline image, heading, list, quote and divider in saved order');

  await field('Slug').fill(renamedBlog);
  await save('Update');
  await expect(page).toHaveURL(`${base}/admin/posts/${renamedBlog}`);
  await expect(publicPage).toHaveURL(`${base}/blog/single/${renamedBlog}`);
  assert.equal((await record('posts', blogSlug)).data.slug, renamedBlog);
  await field('Slug').fill(finalBlog);
  await save('Update');
  await expect(page).toHaveURL(`${base}/admin/posts/${finalBlog}`);
  assert.equal((await record('posts', blogSlug)).data.slug, finalBlog);
  assert.equal((await record('posts', renamedBlog)).data.slug, finalBlog);
  await publicPage.goto(`${base}/blog/single/${blogSlug}`);
  await expect(publicPage).toHaveURL(`${base}/blog/single/${finalBlog}`);
  const idToken = await page.evaluate(async () => (await import('/src/lib/firebase.js')).auth.currentUser.getIdToken());
  const listing = await page.request.get(`${base}/api/admin-content`, { headers: { Authorization: `Bearer ${idToken}` } });
  const blogs = (await listing.json()).content.posts.filter((post) => post.slug.startsWith(blogSlug));
  assert.deepEqual(blogs.map((post) => post.slug), [finalBlog]);
  await field('Slug').fill('future-of-ui-ux');
  await page.getByRole('button', { name: 'Update', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('already exists');
  await field('Slug').fill(finalBlog);
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Archive item', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Archived');
  assert.equal((await record('posts', blogSlug)).status, 404);
  assert.equal((await record('posts', renamedBlog)).status, 404);
  await save('Restore draft');
  await save('Publish');
  console.log('PASS repeated slug edits, old-link redirects, collisions, single admin entry, archive/privacy through aliases');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.block-editor').scrollIntoViewIfNeeded();
  assert.equal(await page.evaluate(() => globalThis.document.documentElement.scrollWidth > globalThis.innerWidth + 1), false);
  await screenshot('scratch/block-editor-mobile.png');
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(preview.locator('.blog-single-wrap > .title')).toHaveText('QA block article');
  assert.equal(await page.evaluate(() => globalThis.document.documentElement.scrollWidth > globalThis.innerWidth + 1), false);
  await page.getByRole('button', { name: 'Close preview', exact: true }).click();
  await publicPage.setViewportSize({ width: 390, height: 844 });
  await publicPage.goto(`${base}/blog/single/${finalBlog}`);
  await publicPage.locator('.article-blocks figure').scrollIntoViewIfNeeded();
  assert.equal(await publicPage.evaluate(() => globalThis.document.documentElement.scrollWidth > globalThis.innerWidth + 1), false);
  await publicPage.screenshot({ path: 'scratch/block-article-mobile.png', animations: 'disabled' });
  console.log('PASS mobile editor, preview and public article without horizontal overflow');

  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto(`${base}/admin/projects/new`);
  await field('Title').fill('QA rename project');
  await field('Slug').fill(projectSlug);
  await field('Summary').fill('Project summary.');
  await field('Project details').fill('Project details.');
  await save('Save draft');
  await expect(page).toHaveURL(`${base}/admin/projects/${projectSlug}`);
  const media = JSON.parse(await (await import('node:fs/promises')).readFile('src/cloudinary-media.json', 'utf8'));
  const galleryUrls = [1, 2, 3].map((index) => media[`/assets/images/section/cora-beauty-${index}.webp`].url);
  const project = await store.collection('projects').doc(projectSlug).get();
  const response = await page.request.put(`${base}/api/admin-content`, {
    headers: { Authorization: `Bearer ${idToken}` },
    data: { type: 'projects', slug: projectSlug, data: { ...project.data(), galleryUrls, status: 'published' } },
  });
  assert.equal(response.status(), 200);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Update', exact: true })).toBeVisible();
  await field('Slug').fill(renamedProject);
  await save('Update');
  await expect(page).toHaveURL(`${base}/admin/projects/${renamedProject}`);
  await publicPage.goto(`${base}/project/${projectSlug}`);
  await expect(publicPage).toHaveURL(`${base}/project/${renamedProject}`);
  await expect(publicPage.getByText('Project details.', { exact: true })).toBeVisible();
  console.log('PASS project slug editing and old-project link redirect');
  assert.deepEqual(failures, []);
} catch (error) {
  await page.screenshot({ path: 'scratch/block-editor-failure.png', fullPage: true }).catch(() => {});
  throw error;
} finally {
  await browser.close();
  for (const slug of [blogSlug, renamedBlog, finalBlog]) await store.collection('posts').doc(slug).delete();
  for (const slug of [projectSlug, renamedProject]) await store.collection('projects').doc(slug).delete();
  for (const publicId of uploads) await cloudinary.uploader.destroy(publicId);
  await store.terminate();
  await deleteApp(app);
  console.log('Temporary test articles/projects, old-URL aliases and uploaded test images cleaned up.');
}
