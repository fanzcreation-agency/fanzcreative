import { FieldValue } from 'firebase-admin/firestore';
import { getAdminStore } from '../server/firebase-admin.js';
import { HttpError, requireAdmin, sendError } from '../server/http.js';
import { deleteComment, moderateComments, replyToComment } from '../server/comment-store.js';
import { COMMENT_ID, COMMENT_STATUSES, commentCounts, prepareComment, SUBMISSION_ID } from '../shared/comments.js';
import { contentSeconds } from '../shared/content.js';

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) return response.status(405).json({ error: 'Method not allowed.' });
  try {
    const claims = await requireAdmin(request);
    const store = getAdminStore();
    if (request.method === 'GET') {
      if (request.query.summary === '1') {
        const counts = await Promise.all(COMMENT_STATUSES.map(async (status) => [status, (await store.collection('comments').where('status', '==', status).count().get()).data().count]));
        return response.status(200).json({ counts: Object.fromEntries(counts) });
      }
      const snapshot = await store.collection('comments').get();
      const items = snapshot.docs.map((item) => { const data = item.data(); delete data.fingerprint; return { ...data, id: item.id }; });
      items.sort((a, b) => contentSeconds(b.createdAt) - contentSeconds(a.createdAt) || b.id.localeCompare(a.id));
      return response.status(200).json({ items, counts: commentCounts(items) });
    }
    const { id, ids, status, data, message, submissionId } = request.body || {};
    if (request.method === 'PATCH') {
      const targets = ids || [id];
      if (!Array.isArray(targets) || !targets.length || targets.length > 50 || targets.some((value) => typeof value !== 'string' || !COMMENT_ID.test(value)) || new Set(targets).size !== targets.length || !COMMENT_STATUSES.includes(status)) throw new HttpError(400, 'Choose up to 50 comments and a valid status.');
      await moderateComments(store, targets, status, claims.uid);
    } else {
      if (typeof id !== 'string' || !COMMENT_ID.test(id)) throw new HttpError(400, 'Choose a valid comment.');
      if (request.method === 'DELETE') await deleteComment(store, id);
      if (request.method === 'POST') {
        if (typeof submissionId !== 'string' || !SUBMISSION_ID.test(submissionId)) throw new HttpError(400, 'Invalid reply submission.');
        let reply;
        try { reply = prepareComment({ message }, { reply: true }); } catch (error) { throw new HttpError(400, error.message); }
        await replyToComment(store, id, reply.message, claims.uid, submissionId);
      }
      if (request.method === 'PUT') {
        const reference = store.collection('comments').doc(id);
        await store.runTransaction(async (transaction) => {
          const current = await transaction.get(reference);
          if (!current.exists) throw new HttpError(404, 'Comment not found.');
          if (current.get('deleting')) throw new HttpError(409, 'This comment is being deleted. Refresh the list.');
          let prepared;
          try { prepared = prepareComment(data, { reply: current.get('authorType') === 'admin' }); } catch (error) { throw new HttpError(400, error.message); }
          transaction.set(reference, { ...(current.get('authorType') === 'admin' ? { message: prepared.message } : { name: prepared.name, email: prepared.email, message: prepared.message }), updatedBy: claims.uid, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        });
      }
    }
    return response.status(200).json({ success: true });
  } catch (error) { return sendError(response, error, 'Comment moderation is unavailable. Please try again.'); }
}
