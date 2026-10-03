import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { chromium, expect as baseExpect } from '@playwright/test';
import { getAuth } from 'firebase-admin/auth';
import { deleteApp } from 'firebase-admin/app';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminApp, getAdminStore } from '../server/firebase-admin.js';
import { prepareContent } from '../shared/content.js';
import { signInAdminTest } from './admin-test-login.mjs';

process.loadEnvFile('.env.local');
const email = process.argv[2];
if (!email) throw new Error('Usage: node scripts/check-comments.mjs <existing-admin-email>');
const base = process.env.ADMIN_TEST_URL || 'http://127.0.0.1:5180';
const expect = baseExpect.configure({ timeout: 30000 });
const app = getAdminApp();
const store = getAdminStore();
const auth = getAuth(app);
const user = await auth.getUserByEmail(email);
assert.equal(user.customClaims?.admin, true);
const token = await auth.createCustomToken(user.uid);
const stamp = Date.now();
const slug = `qa-comments-${stamp}`;
const renamed = `${slug}-renamed`;
const title = `QA Sticky Comments ${stamp}`;
const readerName = `QA Reader ${stamp}`;
const readerEmail = `qa-${stamp}@example.com`;
const body = Array.from({ length: 24 }, (_, index) => `Paragraph ${index + 1}. ${'A thoughtful website brings clarity, consistency and useful information together. '.repeat(8)}`).join('\n\n');
const post = prepareContent('posts', { title, excerpt: 'Temporary comment and sticky sidebar test.', body, status: 'published' });
const reference = store.collection('posts').doc(slug);
const rateKey = createHmac('sha256', process.env.COMMENT_RATE_LIMIT_SECRET || process.env.CLOUDINARY_API_SECRET).update('127.0.0.1').digest('hex');
const rateRef = store.collection('commentRateLimits').doc(rateKey);
const initialRate = await rateRef.get();
const deployed = !['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname);
const initialRates = deployed
  ? new Map((await store.collection('commentRateLimits').get()).docs.map((entry) => [entry.id, entry.data()]))
  : new Map();
const ownedIds = new Set();
const fingerprints = new Set();
const errors = [];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
const page = await context.newPage();
const admin = await context.newPage();
for (const tab of [page, admin]) tab.on('pageerror', (error) => errors.push(error.message));
const records = async () => {
  const snapshot = await store.collection('comments').where('discussionId', '==', slug).get();
  snapshot.docs.forEach((entry) => { ownedIds.add(entry.id); if (entry.get('fingerprint')) fingerprints.add(entry.get('fingerprint')); });
  return snapshot.docs.map((entry) => ({ ...entry.data(), id: entry.id }));
};
const publicData = async (currentSlug = slug) => {
  const response = await page.request.get(`${base}/api/comments?slug=${currentSlug}`);
  return { status: response.status(), data: await response.json() };
};
const publishChanges = async () => {
  if (!deployed) return admin.evaluate(async () => (await import('/src/lib/content-events.js')).notifyContentChanged('posts'));
  await admin.evaluate(() => {
    const detail = { type: 'posts', time: Date.now() };
    globalThis.localStorage.setItem('fanz-content-updated:posts', JSON.stringify(detail));
    globalThis.dispatchEvent(new CustomEvent('fanz-content-updated', { detail }));
  });
};
const waitComments = (count) => expect(page.locator('.blog-comment')).toHaveCount(count);
let headers;
let acceptedPayload;

try {
  if (initialRate.exists && Date.now() - initialRate.get('lastSubmittedAt') < 45000) await new Promise((resolve) => setTimeout(resolve, 46000 - (Date.now() - initialRate.get('lastSubmittedAt'))));
  await reference.create({ ...post, discussionId: slug, createdAt: Timestamp.now(), publishedAt: Timestamp.now() });
  await mkdir('scratch', { recursive: true });
  await admin.goto(`${base}/admin`);
  await expect(admin.getByRole('heading', { name: 'Admin sign in' })).toBeVisible();
  const idToken = await signInAdminTest(admin, { base, email, customToken: token });
  await expect(admin.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible();
  headers = { Authorization: `Bearer ${idToken}` };
  assert.equal((await page.request.get(`${base}/api/admin-comments`)).status(), 401);
  assert.equal((await page.request.get(`${base}/api/admin-comments`, { headers: { Authorization: 'Bearer invalid-token' } })).status(), 401);
  assert.equal((await page.request.post(`${base}/api/comments`, { data: {} })).status(), 403);
  assert.equal((await page.request.post(`${base}/api/comments`, { headers: { Origin: 'https://untrusted.example' }, data: {} })).status(), 403);
  assert.equal((await page.request.get(`${base}/api/comments?slug=not-a-real-post-${stamp}`)).status(), 404);
  console.log('PASS admin authentication, invalid tokens, missing/cross-site origin and unknown article checks');

  await page.goto(`${base}/blog/single/${slug}`);
  await expect(page.locator('.blog-single-wrap > .title')).toHaveText(title);
  await expect(page.getByText('No comments yet.', { exact: true })).toBeVisible();
  const articleTop = await page.locator('.blog-single-wrap').evaluate((element) => element.getBoundingClientRect().top + globalThis.scrollY);
  for (const offset of [400, 1000]) {
    await page.evaluate((position) => globalThis.scrollTo(0, position), articleTop + offset);
    await page.waitForTimeout(500);
    const top = await page.locator('.blog-sidebar').evaluate((element) => element.getBoundingClientRect().top);
    assert.ok(Math.abs(top - 110) < 3, `Sidebar should stick at 110px, got ${top}`);
  }
  const articleEnd = await page.locator('.blog-single-wrap').evaluate((element) => element.getBoundingClientRect().bottom + globalThis.scrollY);
  await page.evaluate((position) => globalThis.scrollTo(0, position), articleEnd - 180);
  await page.waitForTimeout(500);
  const bottom = await page.locator('.blog-sidebar').evaluate((element) => element.getBoundingClientRect().bottom);
  const end = await page.locator('.blog-single-wrap').evaluate((element) => element.getBoundingClientRect().bottom);
  assert.ok(bottom <= end + 3, 'Sidebar must stop at the article, before comments');
  await page.screenshot({ path: 'scratch/blog-sticky-sidebar.png', animations: 'disabled' });
  console.log('PASS sticky sidebar at multiple scroll positions and stopping at the article boundary');

  let failOnce = true;
  await page.route('**/api/comments', async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    acceptedPayload = route.request().postDataJSON();
    if (failOnce) { failOnce = false; return route.fulfill({ status: 503, json: { error: 'Temporary QA outage. Please try again.' } }); }
    return route.continue();
  });
  await page.locator('#comment-name').fill(readerName);
  await page.locator('#comment-email').fill(readerEmail);
  const message = 'A helpful article. <script>window.__commentXss = true</script>';
  await page.locator('#comment-message').fill(message);
  await page.getByRole('button', { name: 'Submit comment', exact: true }).click();
  await expect(page.locator('.blog-comment-feedback.error')).toContainText('Temporary QA outage');
  await expect(page.locator('#comment-message')).toHaveValue(message);
  const retryId = acceptedPayload.submissionId;
  await page.getByRole('button', { name: 'Submit comment', exact: true }).click();
  await expect(page.locator('.blog-comment-feedback.success')).toContainText('submitted for approval');
  assert.equal(acceptedPayload.submissionId, retryId);
  await waitComments(0);
  const root = (await records())[0];
  assert.equal(root.status, 'pending');
  assert.equal((await publicData()).data.count, 0);
  const same = await page.request.post(`${base}/api/comments`, { headers: { Origin: base }, data: acceptedPayload });
  assert.equal(same.status(), 201);
  assert.equal((await records()).length, 1);
  const throttled = await page.request.post(`${base}/api/comments`, { headers: { Origin: base, 'X-Forwarded-For': '8.8.8.8' }, data: { ...acceptedPayload, message: 'Another comment immediately.', submissionId: randomUUID() } });
  assert.equal(throttled.status(), 429);
  console.log('PASS submission, pending privacy, failure/retry preservation, idempotency and non-spoofable rate protection');

  await admin.goto(`${base}/admin/comments`);
  await admin.getByLabel('Search comments').fill(String(stamp));
  const rootRow = admin.locator(`[data-comment-id="${root.id}"]`);
  await expect(rootRow).toContainText(readerEmail);
  await rootRow.getByRole('button', { name: 'Approve', exact: true }).click();
  await waitComments(1);
  assert.equal(await page.evaluate(() => globalThis.__commentXss), undefined);
  assert.equal(await page.locator('.blog-comment-content script').count(), 0);
  const visible = await publicData();
  assert.equal(JSON.stringify(visible.data).includes(readerEmail), false);
  await admin.getByRole('button', { name: /^Approved / }).click();
  await rootRow.getByRole('button', { name: 'Reply', exact: true }).click();
  const dialog = admin.getByRole('dialog', { name: 'Reply to comment', exact: true });
  await dialog.getByLabel('Reply', { exact: true }).fill('Thank you for reading. The FanzCreative team appreciates your feedback.');
  await dialog.getByRole('button', { name: 'Publish reply', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await waitComments(2);
  await records();
  await rootRow.getByRole('button', { name: 'Edit', exact: true }).click();
  const edit = admin.getByRole('dialog', { name: 'Edit comment', exact: true });
  await edit.getByLabel('Author name').fill(`QA Updated Reader ${stamp}`);
  await edit.getByLabel('Comment text').fill('Updated, moderated feedback.');
  await edit.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(edit).toHaveCount(0);
  await expect(page.locator('.blog-comment-content').first()).toContainText('Updated, moderated feedback.');
  await page.locator('#comments').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'scratch/blog-comments-desktop.png', animations: 'disabled' });
  await admin.screenshot({ path: 'scratch/admin-comments-desktop.png', animations: 'disabled' });
  console.log('PASS approval refreshes the public page, escaped comment content, email privacy, team replies and editing');

  await rootRow.getByRole('button', { name: 'Spam', exact: true }).click();
  await waitComments(0);
  await admin.getByRole('button', { name: /^Spam / }).click();
  await rootRow.getByRole('button', { name: 'Not spam', exact: true }).click();
  await admin.getByRole('button', { name: /^Pending / }).click();
  await rootRow.getByRole('button', { name: 'Approve', exact: true }).click();
  await waitComments(2);
  await admin.getByRole('button', { name: /^Approved / }).click();
  await rootRow.getByRole('button', { name: 'Trash', exact: true }).click();
  await waitComments(0);
  await admin.getByRole('button', { name: /^Trash / }).click();
  await rootRow.getByRole('button', { name: 'Restore', exact: true }).click();
  await waitComments(0);
  await admin.getByRole('button', { name: /^Pending / }).click();
  await rootRow.getByRole('button', { name: 'Approve', exact: true }).click();
  await waitComments(2);
  console.log('PASS spam/not-spam, trash/restore, and parent moderation hiding and restoring the full thread');

  const cooldown = 46000 - (Date.now() - root.createdAt.toMillis());
  if (cooldown > 0) await page.waitForTimeout(cooldown);
  await page.locator(`#comment-${root.id}`).getByRole('button', { name: 'Reply', exact: true }).click();
  await page.locator('#comment-message').fill('A visitor reply awaiting moderation.');
  await page.getByRole('button', { name: 'Submit comment', exact: true }).click();
  await expect(page.locator('.blog-comment-feedback.success')).toContainText('submitted for approval');
  await waitComments(2);
  const visitorReply = (await records()).find((item) => item.parentId && item.authorType === 'visitor');
  await admin.getByRole('button', { name: 'Refresh comments', exact: true }).click();
  await admin.locator(`[data-comment-id="${visitorReply.id}"]`).getByRole('button', { name: 'Approve', exact: true }).click();
  await waitComments(3);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#comments').scrollIntoViewIfNeeded();
  assert.equal(await page.locator('.blog-sidebar').evaluate((element) => globalThis.getComputedStyle(element).position), 'static');
  assert.equal(await page.evaluate(() => globalThis.document.documentElement.scrollWidth > globalThis.innerWidth + 1), false);
  await page.screenshot({ path: 'scratch/blog-comments-mobile.png', animations: 'disabled' });
  console.log('PASS visitor replies are separately moderated and mobile comments/sidebar have no horizontal overflow');

  const renameResponse = await admin.request.put(`${base}/api/admin-content`, { headers, data: { type: 'posts', slug: renamed, originalSlug: slug, data: post } });
  assert.equal(renameResponse.status(), 200);
  await publishChanges();
  await expect(page).toHaveURL(`${base}/blog/single/${renamed}`);
  await waitComments(3);
  assert.equal((await publicData(renamed)).data.count, 3);
  await admin.request.patch(`${base}/api/admin-content`, { headers, data: { type: 'posts', slug: renamed, status: 'draft' } });
  assert.equal((await publicData(renamed)).status, 404);
  assert.equal((await publicData(slug)).status, 404);
  const blocked = await page.request.post(`${base}/api/comments`, { headers: { Origin: base }, data: { ...acceptedPayload, slug: renamed, submissionId: randomUUID() } });
  assert.equal(blocked.status(), 404);
  await admin.request.patch(`${base}/api/admin-content`, { headers, data: { type: 'posts', slug: renamed, status: 'published' } });
  console.log('PASS comments remain attached after slug changes and drafted article/old aliases cannot serve or receive comments');

  await admin.getByRole('button', { name: /^Approved / }).click();
  await admin.getByLabel('Select visible comments').check();
  await admin.getByLabel('Bulk comment action').selectOption('pending');
  await admin.getByRole('button', { name: 'Apply (3)', exact: true }).click();
  await expect(admin.getByRole('status')).toContainText('3 comments updated.');
  assert.equal((await publicData(renamed)).data.count, 0);
  await admin.getByRole('button', { name: /^Pending / }).click();
  await rootRow.getByRole('button', { name: 'Trash', exact: true }).click();
  await admin.getByRole('button', { name: /^Trash / }).click();
  admin.once('dialog', (dialog) => dialog.accept());
  await rootRow.getByRole('button', { name: 'Delete permanently', exact: true }).click();
  await expect(rootRow).toHaveCount(0);
  assert.equal((await records()).length, 0);
  console.log('PASS bulk moderation and permanent deletion removing all replies');

  const mocked = Array.from({ length: 25 }, (_, index) => ({ id: `mock-${index}`, name: `Reader ${index}`, email: `reader${index}@example.com`, message: 'A sample approved comment.', status: 'approved', authorType: 'visitor', postTitle: title, postSlug: renamed, discussionId: slug, createdAt: { seconds: 1800000000 + index } }));
  await context.route('**/api/admin-comments*', (route) => route.fulfill({ json: { items: mocked, counts: { approved: 25, pending: 0, spam: 0, trash: 0 } } }));
  await admin.reload();
  await admin.getByRole('button', { name: /^Approved / }).click();
  await expect(admin.locator('[data-comment-id]')).toHaveCount(20);
  await admin.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(admin.locator('[data-comment-id]')).toHaveCount(5);
  await admin.getByLabel('Search comments').fill('Reader 24');
  await expect(admin.locator('[data-comment-id]')).toHaveCount(1);
  await admin.getByLabel('Search comments').fill('');
  await admin.getByLabel('Filter comments by article').selectOption(slug);
  await admin.setViewportSize({ width: 390, height: 844 });
  assert.equal(await admin.evaluate(() => globalThis.document.documentElement.scrollWidth > globalThis.innerWidth + 1), false);
  await admin.screenshot({ path: 'scratch/admin-comments-mobile.png', animations: 'disabled' });
  assert.deepEqual(errors, []);
  console.log('PASS admin search, article filter, 20-row pagination and mobile layout without browser errors');
} finally {
  try {
    await records();
    for (const id of ownedIds) await store.collection('comments').doc(id).delete();
    for (const fingerprint of fingerprints) await store.collection('commentDuplicates').doc(fingerprint).delete();
    const rateRecords = deployed
      ? (await store.collection('commentRateLimits').get()).docs.filter((entry) => ownedIds.has(entry.get('lastCommentId')))
      : [initialRate];
    for (const entry of rateRecords) {
      await store.runTransaction(async (transaction) => {
        const current = await transaction.get(entry.ref);
        if (current.exists && ownedIds.has(current.get('lastCommentId'))) {
          const original = deployed ? initialRates.get(entry.id) : initialRate.exists ? initialRate.data() : undefined;
          if (original) transaction.set(entry.ref, original);
          else transaction.delete(entry.ref);
        }
      });
    }
    for (const item of [slug, renamed]) await store.collection('posts').doc(item).delete();
    console.log('Temporary QA article, comments, aliases and owned abuse-protection records cleaned up.');
  } finally { await browser.close(); await deleteApp(app); }
}
