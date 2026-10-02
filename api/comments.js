import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import { getAdminStore } from '../server/firebase-admin.js';
import { HttpError, sendError } from '../server/http.js';
import { commentPost, submitComment } from '../server/comment-store.js';
import { approvedComments, discussionKey, prepareComment, publicComment, SUBMISSION_ID } from '../shared/comments.js';
import { contentSeconds } from '../shared/content.js';

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST'].includes(request.method)) { response.setHeader('Allow', 'GET, POST'); return response.status(405).json({ error: 'Method not allowed.' }); }
  try {
    const store = getAdminStore();
    if (request.method === 'GET') {
      const post = await commentPost(store, request.query.slug);
      const snapshot = await store.collection('comments').where('discussionId', '==', discussionKey(post)).where('status', '==', 'approved').get();
      const items = approvedComments(snapshot.docs.map((item) => ({ ...item.data(), id: item.id })))
        .sort((a, b) => contentSeconds(a.createdAt) - contentSeconds(b.createdAt) || a.id.localeCompare(b.id)).map(publicComment);
      return response.status(200).json({ items, count: items.length });
    }
    let origin;
    try { origin = new URL(request.headers.origin); } catch { throw new HttpError(403, 'Comment submissions must come from this website.'); }
    if (!['http:', 'https:'].includes(origin.protocol) || origin.host !== request.headers.host || !request.headers['content-type']?.startsWith('application/json')) throw new HttpError(403, 'Comment submissions must come from this website.');
    if (request.body?.website) return response.status(201).json({ status: 'pending', message: 'Thank you. Your comment has been submitted for approval.' });
    if (typeof request.body?.submissionId !== 'string' || !SUBMISSION_ID.test(request.body.submissionId)) throw new HttpError(400, 'Invalid submission. Refresh the page and try again.');
    let data;
    try { data = prepareComment(request.body); } catch (error) { throw new HttpError(400, error.message); }
    const post = await commentPost(store, request.body.slug);
    const secret = process.env.COMMENT_RATE_LIMIT_SECRET || process.env.CLOUDINARY_API_SECRET;
    if (!secret) throw new HttpError(503, 'Comment protection is not configured. Please contact the site administrator.');
    const ip = process.env.VERCEL ? request.headers['x-vercel-forwarded-for'] || request.headers['x-forwarded-for'] : request.socket?.remoteAddress;
    if (typeof ip !== 'string' || !ip) throw new HttpError(503, 'Could not verify this request. Please try again.');
    const clientIp = ip.split(',')[0].trim();
    if (!isIP(clientIp)) throw new HttpError(503, 'Could not verify this request. Please try again.');
    const rateKey = createHmac('sha256', secret).update(clientIp).digest('hex');
    const result = await submitComment(store, { post, data, submissionId: request.body.submissionId, rateKey });
    return response.status(201).json(result);
  } catch (error) { return sendError(response, error, 'Comments are temporarily unavailable. Please try again.'); }
}
