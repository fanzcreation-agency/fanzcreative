import { createHash } from 'node:crypto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { resolvePublishedRecord } from './content-store.js';
import { HttpError } from './http.js';
import { discussionKey } from '../shared/comments.js';
import { SLUG_PATTERN } from '../shared/content.js';
import { LEGACY_POSTS } from '../shared/legacy-posts.js';

export async function commentPost(store, slug) {
  if (!SLUG_PATTERN.test(slug || '')) throw new HttpError(400, 'Choose a valid article.');
  const { item, managed } = await resolvePublishedRecord(store, 'posts', slug);
  if (item) return item;
  if (!managed && Object.hasOwn(LEGACY_POSTS, slug)) return { slug, title: LEGACY_POSTS[slug], discussionId: slug, legacy: true };
  throw new HttpError(404, 'This article is not available for comments.');
}

// Recheck the article inside each write transaction to handle concurrent archive/rename.
async function assertPost(transaction, store, post) {
  const current = await transaction.get(store.collection('posts').doc(post.slug));
  if (post.legacy && !current.exists) return;
  if (!current.exists || current.get('status') !== 'published' || current.get('redirectTo')) throw new HttpError(409, 'The article changed. Refresh it before commenting.');
}

export function submissionFingerprint(discussionId, data) {
  return createHash('sha256').update(JSON.stringify([discussionId, data.name, data.email, data.message, data.parentId])).digest('hex');
}

export async function submitComment(store, { post, data, submissionId, rateKey, now = Date.now() }) {
  const key = discussionKey(post);
  const id = createHash('sha256').update(`${key}:${submissionId}`).digest('hex');
  const fingerprint = submissionFingerprint(key, data);
  const reference = store.collection('comments').doc(id);
  const rateReference = store.collection('commentRateLimits').doc(rateKey);
  const duplicateReference = store.collection('commentDuplicates').doc(fingerprint);
  await store.runTransaction(async (transaction) => {
    await assertPost(transaction, store, post);
    const existing = await transaction.get(reference);
    if (existing.exists) {
      if (existing.get('fingerprint') !== fingerprint) throw new HttpError(409, 'This submission changed. Please submit it again.');
      return;
    }
    const duplicate = await transaction.get(duplicateReference);
    if (duplicate.exists && now - duplicate.get('time') < 120000) return;
    const rate = await transaction.get(rateReference);
    const recent = rate.exists && now - (rate.get('windowStartedAt') || 0) < 3600000;
    if (rate.exists && (now - rate.get('lastSubmittedAt') < 45000 || (recent && rate.get('count') >= 10))) {
      throw new HttpError(429, 'Please wait before sending another comment.');
    }
    if (data.parentId) {
      const parent = await transaction.get(store.collection('comments').doc(data.parentId));
      if (!parent.exists || parent.get('discussionId') !== key || parent.get('status') !== 'approved' || parent.get('parentId')) throw new HttpError(400, 'This comment is no longer available for replies.');
    }
    transaction.set(reference, {
      ...data, discussionId: key, postSlug: post.slug, postTitle: post.title,
      status: 'pending', authorType: 'visitor', fingerprint,
      createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.set(rateReference, { windowStartedAt: recent ? rate.get('windowStartedAt') : now, count: recent ? (rate.get('count') || 0) + 1 : 1, lastSubmittedAt: now, lastCommentId: id, expiresAt: Timestamp.fromMillis(now + 86400000) });
    transaction.set(duplicateReference, { time: now, commentId: id, expiresAt: Timestamp.fromMillis(now + 86400000) });
  });
  return { status: 'pending', message: 'Thank you. Your comment has been submitted for approval.' };
}

export async function moderateComments(store, ids, status, uid) {
  await store.runTransaction(async (transaction) => {
    const references = ids.map((id) => store.collection('comments').doc(id));
    const documents = await transaction.getAll(...references);
    if (documents.some((item) => !item.exists)) throw new HttpError(404, 'A comment no longer exists. Refresh the list.');
    if (documents.some((item) => item.get('deleting'))) throw new HttpError(409, 'A comment is being deleted. Refresh the list.');
    for (const reference of references) transaction.set(reference, { status, updatedBy: uid, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  });
}

export async function replyToComment(store, id, message, uid, submissionId) {
  const parentReference = store.collection('comments').doc(id);
  const reference = store.collection('comments').doc(createHash('sha256').update(`admin:${id}:${submissionId}`).digest('hex'));
  const parent = await parentReference.get();
  if (!parent.exists) throw new HttpError(404, 'Comment not found.');
  const post = await commentPost(store, parent.get('postSlug'));
  await store.runTransaction(async (transaction) => {
    await assertPost(transaction, store, post);
    const current = await transaction.get(parentReference);
    const existing = await transaction.get(reference);
    if (existing.exists) return;
    if (!current.exists || current.get('status') !== 'approved' || current.get('parentId')) throw new HttpError(400, 'Approve the original comment before replying.');
    transaction.set(reference, { name: 'FanzCreative', email: '', message, parentId: id, discussionId: current.get('discussionId'), postSlug: post.slug, postTitle: post.title, authorType: 'admin', status: 'approved', createdBy: uid, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  });
}

export async function deleteComment(store, id) {
  const reference = store.collection('comments').doc(id);
  const existing = await reference.get();
  if (!existing.exists) throw new HttpError(404, 'Comment not found.');
  if (existing.get('status') !== 'trash') throw new HttpError(400, 'Move the comment to Trash before deleting it permanently.');
  await store.runTransaction(async (transaction) => {
    const current = await transaction.get(reference);
    if (!current.exists || current.get('status') !== 'trash') throw new HttpError(409, 'This comment changed. Refresh the list.');
    transaction.set(reference, { deleting: true }, { merge: true });
  });
  // Trashed parents cannot receive new replies; delete their existing thread in batches.
  for (;;) {
    const children = await store.collection('comments').where('parentId', '==', id).limit(400).get();
    if (children.empty) break;
    const batch = store.batch();
    children.docs.forEach((item) => batch.delete(item.ref));
    await batch.commit();
  }
  await store.runTransaction(async (transaction) => {
    const current = await transaction.get(reference);
    if (current.exists && current.get('status') !== 'trash') throw new HttpError(409, 'This comment was restored. Refresh the list.');
    transaction.delete(reference);
  });
}
