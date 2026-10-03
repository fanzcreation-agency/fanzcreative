import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { contactEmail, sendEmail, smtpConfig } from '../server/mail.js';

process.loadEnvFile('.env.local');
const config = smtpConfig();
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
try {
  await mkdir('scratch', { recursive: true });
  const image = await page.evaluate(() => {
    const canvas = globalThis.document.createElement('canvas'); canvas.width = 640; canvas.height = 320;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#090909'; ctx.fillRect(0, 0, 640, 320);
    ctx.fillStyle = '#0af9cf'; ctx.fillRect(32, 32, 5, 256);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 38px Arial'; ctx.fillText('FanzCreative', 64, 135);
    ctx.fillStyle = '#adb5bd'; ctx.font = '20px Arial'; ctx.fillText('Project reference - template test', 64, 184);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  const attachments = [{ filename: 'project-reference.png', contentType: 'image/png', content: Buffer.from(image, 'base64') }];
  const message = contactEmail({ name: 'FanzCreative template test', phone: config.to,
    message: 'We are planning a new brand website and would like to discuss design, development and the project timeline.\n\nThe reference file is attached for review.\n\nThis is a preview of the updated enquiry email template. No reply is needed.' }, attachments, config);
  await writeFile('scratch/project-enquiry-preview.html', message.html);
  for (const width of [720, 390, 320]) {
    await page.setViewportSize({ width, height: 1100 });
    await page.setContent(message.html);
    await page.locator('img[alt="FanzCreative"]').waitFor();
    await page.waitForFunction(() => {
      const logo = globalThis.document.querySelector('img'); return logo.complete && logo.naturalWidth > 0;
    });
    assert.equal(await page.evaluate(() => globalThis.document.documentElement.scrollWidth > globalThis.innerWidth), false);
    await page.screenshot({ path: `scratch/project-enquiry-${width}.png`, fullPage: true });
  }
  const long = contactEmail({ name: 'N'.repeat(100), phone: `${'m'.repeat(100)}@example.com`, message: `${'<img src=x onerror=alert(1)>'.repeat(100)}\n${'x'.repeat(2000)}` }, [{ ...attachments[0], filename: `${'a'.repeat(185)}.png` }], config);
  await page.setContent(long.html);
  assert.equal(await page.evaluate(() => globalThis.document.documentElement.scrollWidth > globalThis.innerWidth), false);
  assert.equal(await page.locator('script').count(), 0);
  assert.equal(await page.locator('img').count(), 1);
  console.log('PASS branded logo loads, desktop/390px/320px layouts, long content wrapping and HTML escaping');
  if (process.argv.includes('--send')) {
    const result = await sendEmail({ ...message, subject: '[Template preview] New project enquiry | FanzCreative' }, config);
    assert.ok(result.messageId);
    console.log('PASS preview email with PNG attachment accepted by SMTP for configured owner mailbox');
  }
} finally { await browser.close(); }
