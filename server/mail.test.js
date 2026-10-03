import assert from 'node:assert/strict';
import test from 'node:test';
import nodemailer from 'nodemailer';
import { contactErrors, validateContactFiles } from '../shared/contact.js';
import { contactAttachments, contactRequest } from './contact.js';
import { contactEmail, resetEmail, sendEmail, smtpConfig } from './mail.js';
import { deliverOnce, mailHash } from './mail-delivery.js';

const env = { SMTP_HOST: 'localhost', SMTP_PORT: '465', SMTP_SECURE: 'true', SMTP_USER: 'sender@example.com', SMTP_PASSWORD: 'test-only-secret', CONTACT_TO_EMAIL: 'owner@example.com', CLOUDINARY_API_SECRET: 'test-only-rate-key' };
const data = { name: 'Visitor', phone: 'visitor@example.com', message: 'Please help us build a website.' };
const submissionId = '12345678-1234-1234-1234-123456789abc';
const request = (body = data) => ({ headers: { origin: 'https://example.com', host: 'example.com', 'content-type': 'application/json' }, socket: { remoteAddress: '127.0.0.1' }, body: { ...body, submissionId } });

function memoryStore() {
  const records = new Map(); let queue = Promise.resolve();
  return { records, collection: (type) => ({ doc: (id) => ({ id, path: `${type}/${id}` }) }),
    runTransaction: (operation) => {
      const next = queue.then(async () => {
        const writes = [];
        const result = await operation({
          get: async (ref) => { assert.equal(writes.length, 0); return { exists: records.has(ref.path), get: (key) => records.get(ref.path)?.[key] }; },
          set: (ref, value, options) => writes.push(() => records.set(ref.path, { ...(options?.merge ? records.get(ref.path) : {}), ...value })),
        });
        writes.forEach((write) => write()); return result;
      }); queue = next.catch(() => {}); return next;
    } };
}
const args = { kind: 'contact', submissionId, fingerprint: 'test-content', rateKey: 'hashed-ip', maxPerHour: 3, now: 1800000000000 };

test('SMTP validates server credentials and requires TLS with certificate verification', () => {
  const config = smtpConfig(env);
  assert.equal(config.transport.secure, true);
  assert.equal(config.transport.tls.rejectUnauthorized, true);
  assert.equal(config.transport.disableUrlAccess, true);
  assert.equal(config.transport.disableFileAccess, true);
  assert.equal(smtpConfig({ ...env, SMTP_PORT: '587', SMTP_SECURE: 'false' }).transport.requireTLS, true);
  for (const bad of [{ SMTP_HOST: '' }, { SMTP_PASSWORD: '' }, { SMTP_PORT: 'invalid' }, { SMTP_SECURE: 'off' }, { SMTP_SECURE: 'false' }, { SMTP_FROM_EMAIL: 'sender@example.com\r\nBcc:bad@example.com' }]) assert.throws(() => smtpConfig({ ...env, ...bad }));
});
test('contact validation, private IP hashing, recipient lock and HTML/header injection protection', () => {
  assert.deepEqual(contactErrors(data), {});
  for (const bad of [{ name: 'x' }, { name: 'Name\r\nBcc' }, { phone: 'invalid' }, { phone: 'visitor@example.com\nBcc' }, { message: 'x' }, { message: 'x'.repeat(5001) }]) assert.ok(Object.keys(contactErrors({ ...data, ...bad })).length);
  assert.deepEqual(contactErrors({ ...data, phone: '+44 (0) 7378562333' }), {});
  const entry = contactRequest(request({ ...data, to: 'attacker@example.com' }), env);
  assert.equal(entry.data.to, undefined); assert.ok(!entry.rateKey.includes('127.0.0.1'));
  const message = contactEmail({ ...data, name: '<img src=x>', message: '<script>attack</script>' }, [], smtpConfig(env));
  assert.equal(message.to, env.CONTACT_TO_EMAIL); assert.equal(message.replyTo.address, data.phone);
  assert.ok(!message.html.includes('<script>')); assert.ok(message.html.includes('&lt;script&gt;'));
  assert.equal(contactEmail({ ...data, phone: '1234567890' }, [], smtpConfig(env)).replyTo, undefined);
});
test('contact enforces same-origin JSON, UUID and trusted IP; honeypot bypasses delivery', () => {
  for (const headers of [{ origin: 'https://attacker.example' }, { origin: undefined }, { 'content-type': 'text/plain' }]) assert.throws(() => contactRequest({ ...request(), headers: { ...request().headers, ...headers } }, env), /this website/);
  assert.throws(() => contactRequest({ ...request(), body: { ...data, submissionId: 'bad' } }, env), /submission/);
  assert.throws(() => contactRequest({ ...request(), socket: {} }, env), /verify/);
  assert.deepEqual(contactRequest(request({ website: 'bot' }), env), { honeypot: true });
  assert.equal(contactRequest({ ...request(), headers: { ...request().headers, 'x-forwarded-for': '8.8.8.8' } }, env).rateKey, contactRequest(request(), env).rateKey);
});
test('branded enquiry template keeps message line breaks, attachment names and safe reply links', () => {
  const attachment = { filename: 'brief & <draft>.pdf', contentType: 'application/pdf', content: Buffer.from('%PDF-1.7\nTest') };
  const message = contactEmail({ ...data, message: 'First paragraph.\n\nSecond paragraph.\n<script>not markup</script>' }, [attachment], smtpConfig(env));
  assert.ok(message.html.includes('alt="FanzCreative"'));
  assert.ok(message.html.includes('role="presentation"'));
  assert.ok(message.html.includes('First paragraph.<br><br>Second paragraph.'));
  assert.ok(message.html.includes('brief &amp; &lt;draft&gt;.pdf'));
  assert.ok(message.html.includes('Attachments (1)'));
  assert.ok(message.html.includes('mailto:visitor%40example.com?subject='));
  assert.ok(message.html.includes('Reply to sender'));
  assert.ok(!message.html.includes('<script>'));
  assert.equal(message.attachments[0], attachment);
  assert.ok(message.text.includes(attachment.filename));
  const phone = contactEmail({ ...data, phone: '+44 7378 562333' }, [], smtpConfig(env));
  assert.ok(phone.html.includes('tel:+447378562333'));
  assert.ok(phone.html.includes('Phone number'));
  assert.ok(!phone.html.includes('Reply to sender'));
  assert.ok(!phone.html.includes('Attachments ('));
  assert.equal(phone.replyTo, undefined);
});
test('attachments enforce count, size, type, strict base64 and matching file signatures', () => {
  const pdf = { name: '../brief.pdf\r\n', type: 'application/pdf', data: Buffer.from('%PDF-1.7\nTest').toString('base64') };
  const attachments = contactAttachments([pdf]); assert.equal(attachments.length, 1);
  assert.equal(attachments[0].filename.includes('/'), false);
  for (const bad of [[{ ...pdf, data: 'not-base64' }], [{ ...pdf, type: 'image/png' }], [{ ...pdf, path: '/private/file', data: undefined }], [pdf, pdf, pdf]]) assert.throws(() => contactAttachments(bad));
  assert.throws(() => validateContactFiles([{ type: 'application/pdf', size: 2097153 }]), /2 MB/);
  assert.throws(() => validateContactFiles([{ type: 'text/html', size: 10 }]), /Attachments/);
});
test('reset email uses HTTPS action link, escaped user data and correct recipient', () => {
  const message = resetEmail({ email: 'member@example.com', displayName: '<script>' }, 'https://example.com/reset?oobCode=test&mode=resetPassword');
  assert.equal(message.to, 'member@example.com'); assert.ok(message.html.includes('oobCode=test&amp;mode=')); assert.ok(!message.html.includes('<script>'));
  assert.throws(() => resetEmail({ email: 'member@example.com' }, 'http://example.com/reset'));
});
test('SMTP overrides sender, verifies recipient acceptance and closes on success/failure', async (context) => {
  let closed = 0; let sent;
  const mock = context.mock.method(nodemailer, 'createTransport', () => ({ sendMail: async (message) => { sent = message; return { accepted: ['owner@example.com'], messageId: 'test-id' }; }, close: () => closed++ }));
  const config = smtpConfig(env);
  assert.deepEqual(await sendEmail({ to: config.to, from: 'attacker@example.com', text: 'test' }, config), { messageId: 'test-id' });
  assert.equal(sent.from.address, env.SMTP_USER); assert.equal(sent.disableUrlAccess, true); assert.equal(closed, 1);
  context.mock.method(console, 'error', () => {});
  mock.mock.mockImplementation(() => ({ sendMail: async () => ({ accepted: [], rejected: ['owner@example.com'] }), close: () => closed++ }));
  await assert.rejects(sendEmail({ to: config.to }, config), /could not be sent/); assert.equal(closed, 2);
});
test('delivery confirms once; identical retry never sends twice and changed payload is rejected', async () => {
  const store = memoryStore(); let sends = 0;
  const send = () => { sends++; return { messageId: 'message-id' }; };
  assert.deepEqual(await deliverOnce(store, args, send), { sent: true });
  assert.deepEqual(await deliverOnce(store, args, send), { sent: true, duplicate: true }); assert.equal(sends, 1);
  await assert.rejects(deliverOnce(store, { ...args, fingerprint: 'changed' }, send), /changed/);
});
test('failed send retries with same ID without consuming another hourly slot', async () => {
  const store = memoryStore();
  await assert.rejects(deliverOnce(store, args, () => { throw new Error('SMTP unavailable'); }), /SMTP unavailable/);
  assert.equal([...store.records.values()].find((record) => record.status)?.status, 'failed');
  await deliverOnce(store, args, () => ({ messageId: 'retry' })); assert.equal([...store.records.values()].find((record) => record.count)?.count, 1);
});
test('persistent cooldown, hourly limit, active-send lock and retry limit', async () => {
  const store = memoryStore(); const send = () => ({ messageId: 'id' });
  await deliverOnce(store, args, send);
  await assert.rejects(deliverOnce(store, { ...args, submissionId: 'second', now: args.now + 1000 }, send), /wait/);
  await deliverOnce(store, { ...args, submissionId: 'second', now: args.now + 60001 }, send);
  await deliverOnce(store, { ...args, submissionId: 'third', now: args.now + 120002 }, send);
  await assert.rejects(deliverOnce(store, { ...args, submissionId: 'fourth', now: args.now + 180003 }, send), /wait/);
  await deliverOnce(store, { ...args, submissionId: 'after-hour', now: args.now + 3600001 }, send);
  const ref = `mailDeliveries/${mailHash(`${args.kind}:${args.rateKey}:${args.submissionId}`)}`;
  store.records.set(ref, { fingerprint: args.fingerprint, status: 'sending', leaseUntil: args.now + 120000 });
  await assert.rejects(deliverOnce(store, args, send), /already being sent/);
  store.records.set(ref, { fingerprint: args.fingerprint, status: 'failed', lastAttemptAt: args.now, attempts: 3 });
  await assert.rejects(deliverOnce(store, args, send), /few minutes/);
});
test('post-SMTP confirmation failure reports uncertainty and retains the active-send lease', async () => {
  const store = memoryStore(); const transaction = store.runTransaction; let calls = 0;
  store.runTransaction = (...input) => ++calls === 2 ? Promise.reject(new Error('database unavailable')) : transaction(...input);
  await assert.rejects(deliverOnce(store, args, () => ({ messageId: 'accepted' })), /may already have arrived/);
});
