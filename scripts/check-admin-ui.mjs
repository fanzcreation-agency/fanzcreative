import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { chromium, expect as baseExpect } from '@playwright/test';
import { getAuth } from 'firebase-admin/auth';
import { deleteApp } from 'firebase-admin/app';
import { getAdminApp } from '../server/firebase-admin.js';
import { prepareContent } from '../shared/content.js';
import { signInAdminTest } from './admin-test-login.mjs';

process.loadEnvFile('.env.local');
const email = process.argv[2];
if (!email) throw new Error('Usage: node scripts/check-admin-ui.mjs <existing-admin-email>');
const base = process.env.ADMIN_TEST_URL || 'http://127.0.0.1:5180';
const expect = baseExpect.configure({ timeout: 30000 });
const app = getAdminApp();
const auth = getAuth(app);
const user = await auth.getUserByEmail(email);
assert.equal(user.customClaims?.admin, true);
const token = await auth.createCustomToken(user.uid);
const media = JSON.parse(await readFile('src/cloudinary-media.json', 'utf8'));
const blogImages = Object.entries(media).filter(([key]) => key.includes('/blog/')).map(([, value]) => value.url);
const projectImages = Object.entries(media).filter(([key]) => key.includes('ecommerce-mockup')).map(([, value]) => value.url);
const titles = ['Designing a Website That Builds Trust', 'The Future of UI/UX in E-Commerce', 'Why AI Automation Is a Game Changer', 'Building a Brand That People Remember', 'A Practical Guide to Web Performance', 'Motion Design That Makes an Impact'];
const content = {
  posts: Array.from({ length: 28 }, (_, index) => ({ ...prepareContent('posts', { title: `${titles[index % titles.length]}${index > 5 ? ` - Part ${index}` : ''}`, category: ['Design', 'UX', 'Automation'][index % 3], excerpt: 'A practical look at thoughtful digital experiences.', body: 'Good design brings clarity, consistency and personality to a brand.', coverUrl: blogImages[index % blogImages.length], status: index % 4 ? 'published' : 'draft' }), slug: `article-${index}`, updatedAt: { seconds: 1790928000 - index * 86400 } })),
  projects: Array.from({ length: 24 }, (_, index) => ({ ...prepareContent('projects', { title: `${index % 2 ? 'Cora Beauty' : 'Marble Fashion'}${index > 1 ? ` - Project ${index}` : ''}`, industry: index % 2 ? 'Beauty' : 'Fashion', summary: 'A thoughtful brand and commerce experience.', details: 'A complete digital storefront with a considered visual identity.', galleryUrls: [projectImages[0], projectImages[1], projectImages[0]], coverUrl: projectImages[index % projectImages.length], featured: index < 4, status: index % 4 ? 'published' : 'draft' }), slug: `project-${index}`, updatedAt: { seconds: 1790928000 - index * 86400 } })),
};
const comments = ['Sarah Ahmed', 'Ali Khan', 'Maya Wilson', 'Omar Malik', 'David Chen', 'Hannah James'].map((name, index) => ({ id: `ui-comment-${index}`, name, email: `reader${index}@example.com`, message: index % 2 ? 'The examples made this really easy to understand. Looking forward to the next article.' : 'A thoughtful article. The balance between usability and visual identity is exactly what our team needed.', status: 'pending', authorType: 'visitor', postTitle: titles[index], postSlug: `article-${index}`, discussionId: `article-${index}`, createdAt: { seconds: 1790928000 - index * 3600 } }));
const counts = () => Object.fromEntries(['pending', 'approved', 'spam', 'trash'].map((status) => [status, comments.filter((comment) => comment.status === status).length]));
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
await context.route('**/api/admin-content', async (route) => {
  if (route.request().method() === 'GET') return route.fulfill({ json: { content } });
  const body = route.request().postDataJSON();
  const item = { ...prepareContent(body.type, body.data), slug: body.slug, updatedAt: { seconds: Math.floor(Date.now() / 1000) } };
  content[body.type] = [item, ...content[body.type].filter((entry) => entry.slug !== body.originalSlug && entry.slug !== item.slug)];
  await route.fulfill({ json: { item } });
});
await context.route('**/api/admin-comments*', async (route) => {
  if (route.request().method() !== 'GET') {
    const body = route.request().postDataJSON();
    const comment = comments.find((entry) => entry.id === body.id);
    if (route.request().method() === 'PATCH') comment.status = body.status;
    if (route.request().method() === 'PUT') Object.assign(comment, body.data);
  }
  await route.fulfill({ json: { items: comments, counts: counts() } });
});
await context.route('**/api/cloudinary-sign', (route) => route.fulfill({ json: { cloudName: 'ui-test', apiKey: 'ui-test', signature: 'ui-test', publicId: 'ui-test', folder: 'ui-test', timestamp: 1 } }));
await context.route('https://api.cloudinary.com/v1_1/ui-test/image/upload', (route) => route.fulfill({ json: { secure_url: blogImages[0] } }));
const people = Array.from({ length: 125 }, (_, index) => ({ uid: index === 0 ? user.uid : `mock-user-${index}`, email: index === 0 ? email : `member${index}@example.com`, displayName: `Member ${index}`, admin: index % 3 === 0, disabled: index % 10 === 9, lastSignIn: null }));
const library = Array.from({ length: 65 }, (_, index) => ({ id: `mock-image-${index}`, publicId: `fanzcreative/blog/mock-image-${index}`, url: blogImages[index % blogImages.length], name: `Library image ${index}`, width: [1600, 1200, 600, 800][index % 4], height: [900, 800, 800, 1000][index % 4], bytes: 10000, format: 'webp', folder: 'fanzcreative/blog', createdAt: '2026-10-01T00:00:00Z' }));
let failMediaLoad = true;
let failUserSave = true;
let failResetEmail = true;
const resetEmails = [];
await context.route('**/api/admin-media*', async (route) => {
  const query = new URL(route.request().url()).searchParams;
  if (query.has('publicId')) return route.fulfill({ json: { item: library[0], usage: [] } });
  if (failMediaLoad) { failMediaLoad = false; return route.fulfill({ status: 503, json: { error: 'Temporary media failure.' } }); }
  const matching = library.filter((item) => !query.get('q') || item.name.toLowerCase().includes(query.get('q').toLowerCase()));
  const offset = Number(query.get('cursor') || 0);
  return route.fulfill({ json: { items: matching.slice(offset, offset + 60), nextCursor: matching.length > offset + 60 ? String(offset + 60) : null } });
});
await context.route('**/api/admin-users*', async (route) => {
  if (route.request().method() === 'POST') return route.fulfill({ status: 409, json: { error: 'An account with this email already exists.' } });
  if (route.request().method() === 'PATCH') {
    const body = route.request().postDataJSON();
    if (body.action === 'send-password-reset') {
      resetEmails.push(body);
      if (failResetEmail) { failResetEmail = false; return route.fulfill({ status: 503, json: { error: 'Temporary email failure.' } }); }
      return route.fulfill({ json: { emailSent: true, email: people.find((entry) => entry.uid === body.uid).email } });
    }
    if (failUserSave) { failUserSave = false; return route.fulfill({ status: 503, json: { error: 'Temporary user save failure.' } }); }
    const item = people.find((entry) => entry.uid === body.uid); Object.assign(item, body.data);
    return route.fulfill({ json: { item } });
  }
  const offset = Number(new URL(route.request().url()).searchParams.get('cursor') || 0);
  return route.fulfill({ json: { items: people.slice(offset, offset + 100), nextCursor: offset + 100 < people.length ? String(offset + 100) : null } });
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
const shot = async (name) => { await page.evaluate(() => globalThis.document.fonts.ready); await page.screenshot({ path: `scratch/admin-redesign-${name}.png`, animations: 'disabled' }); };
const noOverflow = async () => assert.equal(await page.evaluate(() => globalThis.document.documentElement.scrollWidth > globalThis.innerWidth + 1), false);
const nav = async (name) => {
  if (await page.getByRole('button', { name: 'Open navigation', exact: true }).isVisible()) await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await page.locator('.admin-sidebar nav').getByRole('button', { name: new RegExp(`^${name}`) }).click();
};

try {
  await mkdir('scratch', { recursive: true });
  await page.goto(`${base}/admin`);
  await expect(page.getByRole('heading', { name: 'Admin sign in' })).toBeVisible();
  await shot('login');
  await signInAdminTest(page, { base, email, customToken: token });
  await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible();
  await expect(page.locator('.admin-recent > button')).toHaveCount(7);
  await expect(page.locator('.admin-stat.blogs strong')).toHaveText('28');
  await expect(page.locator('.admin-stat.comments strong')).toHaveText('6');
  await expect.poll(() => page.locator('.admin-recent img').first().evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
  await noOverflow();
  await shot('overview');
  await nav('Blogs');
  await expect(page.locator('.admin-table tbody tr')).toHaveCount(20);
  await shot('blogs');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.locator('.admin-table tbody tr')).toHaveCount(8);
  await page.getByLabel('Search blogs').fill('article-27');
  await expect(page.locator('.admin-table tbody tr')).toHaveCount(1);
  await page.getByLabel('Search blogs').fill('');
  await page.locator('.admin-filters').getByRole('button', { name: /^Draft/ }).click();
  await expect(page.locator('.admin-table tbody tr')).toHaveCount(7);
  await page.locator('.admin-filters').getByRole('button', { name: /^All/ }).click();
  await nav('Projects');
  await expect(page.locator('.admin-table tbody tr')).toHaveCount(20);
  await shot('projects');
  await nav('Comments');
  await expect(page.locator('[data-comment-id]')).toHaveCount(6);
  await shot('comments');
  await page.locator('[data-comment-id]').first().getByRole('button', { name: 'Edit', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Edit comment' })).toBeVisible();
  await page.getByLabel('Comment text').fill('Edited in the redesigned moderation workspace.');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.locator('[data-comment-id]').first()).toContainText('Edited in the redesigned');
  await page.locator('[data-comment-id]').first().getByRole('button', { name: 'Approve', exact: true }).click();
  await expect(page.locator('[data-comment-id]')).toHaveCount(5);
  console.log('PASS dashboard, media thumbnails, navigation, search/status filters, 20-row paging, comment edit and approval');

  await page.goto(`${base}/admin/posts/new`);
  await page.getByLabel('Title', { exact: true }).fill('Designing a Website That Builds Trust');
  await page.getByLabel('Excerpt', { exact: true }).fill('How thoughtful design turns a first impression into lasting confidence.');
  await page.getByLabel('Category', { exact: true }).fill('Design');
  await page.getByLabel('Paragraph 1', { exact: true }).fill('Trust begins long before someone gets in touch. It starts with a clear message, considered typography and an experience that feels effortless.');
  await page.getByLabel('Cover URL', { exact: true }).fill(blogImages[0]);
  await expect.poll(() => page.locator('.admin-image-preview').evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
  await page.evaluate(() => globalThis.scrollTo(0, 0));
  await shot('blog-editor');
  await page.locator('.block-inserter').nth(1).locator('summary').click();
  await page.locator('.block-inserter').nth(1).getByRole('button', { name: 'Heading', exact: true }).click();
  await page.getByLabel('Heading 2', { exact: true }).fill('Clarity comes first');
  await page.getByLabel('Custom quote', { exact: true }).check();
  await page.getByLabel('Custom end quote', { exact: true }).fill('Good design makes complex things feel simple.');
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(page).toHaveURL(`${base}/admin/posts/designing-a-website-that-builds-trust`);
  await page.reload();
  await expect(page.getByLabel('Heading 2', { exact: true })).toHaveValue('Clarity comes first');
  await expect(page.getByLabel('Custom end quote', { exact: true })).toHaveValue('Good design makes complex things feel simple.');
  await page.getByRole('button', { name: 'Preview article', exact: true }).click();
  const preview = page.frameLocator('iframe[title="Article website preview"]');
  await expect(preview.locator('.blog-single-wrap > .title')).toHaveText('Designing a Website That Builds Trust');
  await expect(preview.locator('.blockquote-wrap h5')).toContainText('Good design makes complex things feel simple.');
  await expect(preview.getByRole('button', { name: 'Submit Message', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Close preview', exact: true }).click();
  await page.goto(`${base}/admin/projects/project-1`);
  await expect(page.getByRole('img', { name: 'Gallery 3 preview', exact: true })).toBeVisible();
  await page.evaluate(() => globalThis.scrollTo(0, 0));
  await shot('project-editor');
  console.log('PASS block insertion, draft save/reload, quote controls, full-site preview and project gallery');

  await nav('Media Library');
  await expect(page.getByRole('alert')).toContainText('Temporary media failure');
  await page.getByRole('button', { name: 'Refresh media' }).click();
  await expect(page.locator('.admin-media-tile')).toHaveCount(60);
  await page.getByRole('button', { name: 'Load more', exact: true }).click();
  await expect(page.locator('.admin-media-tile')).toHaveCount(65);
  await page.getByLabel('Search media').fill('Library image 64');
  await page.getByLabel('Search media').press('Enter');
  await expect(page.locator('.admin-media-tile')).toHaveCount(1);
  await page.getByLabel('Search media').fill('no such image');
  await page.getByLabel('Search media').press('Enter');
  await expect(page.getByRole('heading', { name: 'No matching images' })).toBeVisible();
  await nav('Users');
  await expect(page.locator('[data-user-id]')).toHaveCount(20);
  await page.getByRole('button', { name: 'Next users page' }).click();
  await expect(page.locator('[data-user-id]')).toHaveCount(20);
  await page.getByRole('button', { name: 'Load more users' }).click();
  await expect(page.locator('.admin-heading-count')).toHaveText('125');
  await page.getByLabel('Search users').fill('member124@');
  await expect(page.locator('[data-user-id]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Add user', exact: true }).click();
  await page.getByLabel('Full name', { exact: true }).fill('Duplicate member');
  await page.getByLabel('Email address', { exact: true }).fill(email);
  await page.getByRole('button', { name: 'Generate password' }).click();
  await page.getByRole('button', { name: 'Create user', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('already exists');
  await expect(page.getByLabel('Full name', { exact: true })).toHaveValue('Duplicate member');
  await page.keyboard.press('Escape');
  await page.getByLabel('Search users').fill('member1@example.com');
  await page.getByRole('button', { name: 'Edit member1@example.com' }).click();
  await page.getByLabel('Full name', { exact: true }).fill('Retained after failure');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Temporary user save failure');
  await expect(page.getByLabel('Full name', { exact: true })).toHaveValue('Retained after failure');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.locator('[data-user-id]')).toContainText('Retained after failure');
  await page.getByRole('button', { name: 'Reset password for member1@example.com', exact: true }).click();
  await page.getByRole('button', { name: 'Send reset email', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Temporary email failure');
  await page.getByRole('button', { name: 'Send reset email', exact: true }).click();
  await expect(page.locator('.admin-notice')).toContainText('Password-reset email sent to member1@example.com');
  assert.equal(resetEmails[0].submissionId, resetEmails[1].submissionId);
  await expect(page.locator('[data-user-id]')).toHaveCount(1);
  console.log('PASS reset email failure/retry retains the request ID and user row');
  console.log('PASS simulated 125-user/65-image pagination, search/empty states, duplicate email, failure/retry without lost edits');

  await page.goto(`${base}/admin/posts/designing-a-website-that-builds-trust`);
  await page.locator('.block-inserter').last().locator('summary').click();
  await page.locator('.block-inserter').last().getByRole('button', { name: 'Image', exact: true }).click();
  await page.locator('[data-block-type="image"]').getByRole('button', { name: 'Choose from library' }).click();
  await page.locator('.admin-media-tile').first().click();
  await expect(page.locator('[data-block-type="image"] .block-image-preview')).toBeVisible();
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(page.locator('.admin-notice')).toContainText('Draft saved');
  await page.reload();
  await expect(page.locator('[data-block-type="image"] .block-image-preview')).toBeVisible();
  await page.goto(`${base}/admin/projects/project-1`);
  for (let index = 0; index < 3; index++) {
    await page.locator('.admin-gallery-slot').nth(index).getByRole('button', { name: 'Choose from library' }).click();
    await page.locator('.admin-media-tile').nth(index + 1).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('img', { name: `Gallery ${index + 1} preview`, exact: true })).toBeVisible();
  }
  console.log('PASS inline article image and all three gallery slots reuse library images');

  for (const width of [1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await nav('Overview');
    await noOverflow();
    if (width === 390) await shot('overview-mobile');
    await nav('Blogs');
    await noOverflow();
    if (width === 390) await shot('blogs-mobile');
    await nav('Comments');
    await noOverflow();
    await nav('Media Library');
    await expect(page.locator('.admin-media-tile').first()).toBeVisible();
    await noOverflow();
    await nav('Users');
    await expect(page.locator('[data-user-id]').first()).toBeVisible();
    await noOverflow();
    await page.goto(`${base}/admin/posts/designing-a-website-that-builds-trust`);
    await expect(page.getByLabel('Title', { exact: true })).toBeVisible();
    await noOverflow();
    await page.getByLabel('Custom end quote', { exact: true }).scrollIntoViewIfNeeded();
    const toolbar = await page.locator('.admin-editor-topbar').boundingBox();
    assert.ok(toolbar.x >= 0 && toolbar.x + toolbar.width <= width + 1);
    await expect(page.getByRole('button', { name: 'Save draft', exact: true })).toBeInViewport();
    if (width === 390) await shot('editor-mobile');
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await expect(page.locator('.admin-main')).toHaveAttribute('inert', '');
  await page.locator('.admin-sidebar').getByRole('button', { name: 'Sign out', exact: true }).focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('.admin-brand')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('.admin-main')).not.toHaveAttribute('inert', '');
  await expect(page.getByRole('button', { name: 'Open navigation', exact: true })).toBeFocused();
  const square = await page.evaluate(() => {
    const canvas = globalThis.document.createElement('canvas'); canvas.width = 800; canvas.height = 800;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#71a6f5'; ctx.fillRect(0, 0, 800, 800);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await page.locator('.admin-editor-side input[type=file]').first().setInputFiles({ name: 'ui-crop.png', mimeType: 'image/png', buffer: Buffer.from(square, 'base64') });
  const crop = page.locator('.admin-crop-dialog');
  await expect(crop).toBeVisible();
  const bounds = await crop.boundingBox();
  assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 391 && bounds.y >= 0 && bounds.y + bounds.height <= 845);
  await shot('crop-mobile');
  await page.getByRole('button', { name: 'Crop & upload', exact: true }).click();
  await expect(crop).toHaveCount(0);
  await expect(page.getByLabel('Cover URL', { exact: true })).toHaveValue(/res\.cloudinary\.com/);
  await nav('Projects');
  await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await page.setViewportSize({ width: 1440, height: 960 });
  await expect(page.locator('.admin-main')).not.toHaveAttribute('inert', '');
  assert.equal(await page.evaluate(() => globalThis.document.body.style.overflow), '');
  await page.locator('.admin-sidebar').getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Admin sign in' })).toBeVisible();
  assert.deepEqual(errors, []);
  console.log('PASS desktop/tablet/320px/mobile layouts, sticky editor actions, drawer focus/Escape/resize, crop/upload and sign-out; zero browser errors or real content/media writes');
} finally {
  await browser.close();
  await deleteApp(app);
}
