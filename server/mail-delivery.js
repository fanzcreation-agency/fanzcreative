import { createHash, randomUUID } from 'node:crypto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { HttpError } from './http.js';

export const mailHash = (value) => createHash('sha256').update(value).digest('hex');

export async function deliverOnce(store, { kind, submissionId, fingerprint, rateKey, maxPerHour, cooldown = 60000, details = {}, now = Date.now() }, deliver) {
  const ref = store.collection('mailDeliveries').doc(mailHash(`${kind}:${rateKey}:${submissionId}`));
  const rateRef = store.collection('mailRateLimits').doc(mailHash(`${kind}:${rateKey}`));
  const owner = randomUUID();
  const shouldSend = await store.runTransaction(async (transaction) => {
    const entry = await transaction.get(ref);
    const rate = await transaction.get(rateRef);
    if (entry.exists) {
      if (entry.get('fingerprint') !== fingerprint) throw new HttpError(409, 'This submission changed. Please submit it again.');
      if (entry.get('status') === 'sent') return false;
      if (entry.get('status') === 'sending' && entry.get('leaseUntil') > now) throw new HttpError(409, 'This email is already being sent. Please wait and retry shortly.');
      if ((entry.get('attempts') || 0) >= 3 && now - entry.get('lastAttemptAt') < 300000) throw new HttpError(429, 'Please wait a few minutes before retrying this email.');
    } else {
      const recent = rate.exists && now - rate.get('windowStartedAt') < 3600000;
      if (rate.exists && (now - rate.get('lastSubmittedAt') < cooldown || (recent && rate.get('count') >= maxPerHour))) throw new HttpError(429, 'Please wait before sending another message.');
      transaction.set(rateRef, { windowStartedAt: recent ? rate.get('windowStartedAt') : now, count: recent ? (rate.get('count') || 0) + 1 : 1, lastSubmittedAt: now, lastDeliveryId: ref.id, expiresAt: Timestamp.fromMillis(now + 86400000) });
    }
    transaction.set(ref, { ...details, kind, fingerprint, status: 'sending', owner, leaseUntil: now + 120000,
      attempts: (entry.get('attempts') || 0) + 1, lastAttemptAt: now, updatedAt: FieldValue.serverTimestamp(), expiresAt: Timestamp.fromMillis(now + 7 * 86400000) });
    return true;
  });
  if (!shouldSend) return { sent: true, duplicate: true };
  let result;
  try { result = await deliver(); }
  catch (error) {
    await store.runTransaction(async (transaction) => {
      const current = await transaction.get(ref);
      if (current.get('owner') === owner) transaction.set(ref, { status: 'failed', leaseUntil: 0, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    });
    throw error;
  }
  try {
    await store.runTransaction(async (transaction) => {
      const current = await transaction.get(ref);
      if (current.get('owner') !== owner) throw new Error('Email lease changed');
      transaction.set(ref, { status: 'sent', leaseUntil: 0, messageId: result.messageId || '', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    });
  } catch {
    // SMTP cannot be rolled back. Do not invite an immediate duplicate send after acceptance.
    throw new HttpError(503, 'The email was accepted, but confirmation could not be saved. Wait two minutes before retrying; it may already have arrived.');
  }
  return { sent: true };
}
