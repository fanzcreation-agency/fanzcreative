import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium, expect as baseExpect } from '@playwright/test';
import { getAuth } from 'firebase-admin/auth';
import { deleteApp } from 'firebase-admin/app';
import { getAdminApp, getAdminStore } from '../server/firebase-admin.js';
import { contactRequest } from '../server/contact.js';
import { mailHash } from '../server/mail-delivery.js';
import { signInAdminTest } from './admin-test-login.mjs';

process.loadEnvFile('.env.local');
const base = process.env.ADMIN_TEST_URL || 'http://127.0.0.1:5180';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Mail QA is local-only.');
const live = process.argv.includes('--live');
const adminEmail = process.argv[2];
if (live && (!adminEmail || adminEmail === '--live')) throw new Error('Supply an existing admin email for live checks.');
const expect = baseExpect.configure({ timeout: 60000 });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
const page = await context.newPage();
const errors = []; page.on('pageerror', (error) => errors.push(error.message));
const requests = []; let mode = 'fail'; let app; let store; let createdUser;
const cleanups = [];
const fill = async (form, name = 'FanzCreative SMTP QA') => {
  await form.getByLabel('Your Name', { exact: true }).fill(name);
  await form.getByLabel('Email or Phone', { exact: true }).fill(process.env.CONTACT_TO_EMAIL || 'hello@fanzcreative.design');
  await form.getByLabel('More About The Project', { exact: true }).fill('SMTP integration test from the local website. No reply is needed.');
};
const trackDelivery = async (kind, rateKey, submissionId) => {
  const ref = store.collection('mailDeliveries').doc(mailHash(`${kind}:${rateKey}:${submissionId}`));
  const rate = store.collection('mailRateLimits').doc(mailHash(`${kind}:${rateKey}`));
  const previous = await rate.get(); cleanups.push({ ref, rate, previous }); return ref;
};
await context.route('**/api/contact', async (route) => {
  const body = route.request().postDataJSON(); requests.push(body);
  if (mode === 'live') {
    const entry = contactRequest({ headers: { origin: base, host: new URL(base).host, 'content-type': 'application/json' }, socket: { remoteAddress: '127.0.0.1' }, body });
    await trackDelivery('contact', entry.rateKey, body.submissionId);
    return route.continue();
  }
  if (mode === 'fail') return route.fulfill({ status: 503, json: { error: 'Test email unavailable. Retry shortly.' } });
  return route.fulfill({ json: { sent: true, message: 'Thank you. Your message has been sent.' } });
});
try {
  await mkdir('scratch', { recursive: true });
  await page.goto(`${base}/contact`);
  const form = page.locator('.contact-mail-form');
  await form.scrollIntoViewIfNeeded();
  await form.getByRole('button', { name: 'Submit Message' }).click();
  await expect(form.locator('.contact-field-error')).toHaveCount(3); assert.equal(requests.length, 0);
  await fill(form);
  await form.getByLabel('Email or Phone', { exact: true }).fill('invalid-contact');
  await form.getByRole('button', { name: 'Submit Message' }).click();
  await expect(form.locator('.contact-field-error')).toHaveCount(1); assert.equal(requests.length, 0);
  await fill(form);
  await form.locator('input[type=file]').setInputFiles({ name: 'unsafe.html', mimeType: 'text/html', buffer: Buffer.from('<html>test</html>') });
  await expect(form.getByRole('alert')).toContainText('PDF');
  await form.locator('input[type=file]').setInputFiles({ name: 'qa-brief.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7\nLocal SMTP QA attachment\n%%EOF') });
  await expect(form.locator('.contact-files')).toContainText('qa-brief.pdf');
  await form.getByRole('button', { name: 'Submit Message' }).click();
  await expect(form.getByRole('alert')).toContainText('unavailable');
  await expect(form.getByLabel('Your Name', { exact: true })).toHaveValue('FanzCreative SMTP QA');
  await expect(form.locator('.contact-files')).toContainText('qa-brief.pdf');
  mode = 'success';
  await form.getByRole('button', { name: 'Submit Message' }).click();
  await expect(form.getByRole('status')).toContainText('sent');
  assert.equal(requests[0].submissionId, requests[1].submissionId);
  assert.equal(requests[1].attachments.length, 1);
  await expect(form.getByLabel('Your Name', { exact: true })).toHaveValue('');
  await expect(form.locator('.contact-files li')).toHaveCount(0);
  console.log('PASS contact validation, attachments, failure retains inputs, successful retry reuses ID and clears form');
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 960 }); await fill(form);
    await form.scrollIntoViewIfNeeded();
    const box = await form.boundingBox(); assert.ok(box.x >= -1 && box.x + box.width <= width + 1);
    await page.screenshot({ path: `scratch/contact-mail-${width}.png`, animations: 'disabled' });
  }
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto(`${base}/blog`); await form.scrollIntoViewIfNeeded(); await fill(form, 'Shared contact form QA');
  await form.getByRole('button', { name: 'Submit Message' }).click(); await expect(form.getByRole('status')).toContainText('sent');
  console.log('PASS shared dark form and desktop/390px/320px contact layouts');

  if (live) {
    app = getAdminApp(); store = getAdminStore(); const auth = getAuth(app);
    const admin = await auth.getUserByEmail(adminEmail); assert.equal(admin.customClaims?.admin, true);
    mode = 'live'; await page.goto(`${base}/contact`); await fill(form);
    await form.locator('input[type=file]').setInputFiles({ name: 'smtp-qa.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7\nSMTP QA\n%%EOF') });
    await form.getByRole('button', { name: 'Submit Message' }).click();
    await expect(form.getByRole('status')).toContainText('sent');
    const contact = cleanups[0]; assert.equal((await contact.ref.get()).get('status'), 'sent');
    const duplicate = await page.request.post(`${base}/api/contact`, { headers: { Origin: base }, data: requests.at(-1) });
    assert.equal(duplicate.status(), 200); assert.equal((await contact.ref.get()).get('attempts'), 1);
    console.log('PASS real contact SMTP acceptance, attachment submission and persistent no-resend retry');
    const recipient = process.env.CONTACT_TO_EMAIL || process.env.SMTP_USER;
    let target;
    try { target = await auth.getUserByEmail(recipient); }
    catch (error) { if (error.code !== 'auth/user-not-found') throw error;
      target = await auth.createUser({ email: recipient, displayName: 'SMTP QA temporary account' }); createdUser = target.uid;
    }
    assert.equal(target.disabled, false);
    const resetId = crypto.randomUUID(); const resetRef = await trackDelivery('password-reset', target.uid, resetId);
    await context.route('**/api/admin-users', (route) => {
      const body = route.request().postDataJSON();
      if (body?.action === 'send-password-reset') return route.continue({ postData: JSON.stringify({ ...body, submissionId: resetId }) });
      return route.continue();
    });
    await page.goto(`${base}/admin`);
    await signInAdminTest(page, { base, email: adminEmail, customToken: await auth.createCustomToken(admin.uid) });
    await page.goto(`${base}/admin/users`);
    await page.getByLabel('Search users').fill(recipient);
    await page.getByRole('button', { name: `Reset password for ${recipient}`, exact: true }).click();
    const response = page.waitForResponse((item) => item.url().endsWith('/api/admin-users') && item.request().method() === 'PATCH');
    await page.getByRole('button', { name: 'Send reset email', exact: true }).click();
    assert.equal((await response).status(), 200);
    await expect(page.locator('.admin-notice')).toContainText(`Password-reset email sent to ${recipient}`);
    assert.equal((await resetRef.get()).get('status'), 'sent');
    await expect(page.locator('[data-user-id]')).toHaveCount(1);
    console.log('PASS real admin reset-email SMTP acceptance; existing passwords remain unchanged');
  }
  assert.deepEqual(errors, []);
} finally {
  if (store) for (const { ref, rate, previous } of cleanups) {
    await store.runTransaction(async (tx) => {
      const record = await tx.get(rate);
      if (record.get('lastDeliveryId') === ref.id) { if (previous.exists) tx.set(rate, previous.data()); else tx.delete(rate); }
      tx.delete(ref);
    });
  }
  if (createdUser) await getAuth(app).deleteUser(createdUser);
  await browser.close(); if (app) await deleteApp(app);
  console.log('QA cleanup complete.');
}
