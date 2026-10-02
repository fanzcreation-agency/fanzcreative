import { getAdminStore } from '../server/firebase-admin.js';
import { HttpError, requireAdmin, sendError } from '../server/http.js';
import { CONTENT_STATUSES, CONTENT_TYPES, prepareContent, SLUG_PATTERN, sortContent } from '../shared/content.js';
import { saveContentRecord } from '../server/content-store.js';

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST', 'PUT', 'PATCH'].includes(request.method)) {
    response.setHeader('Allow', 'GET, POST, PUT, PATCH');
    return response.status(405).json({ error: 'Method not allowed.' });
  }
  try {
    await requireAdmin(request);
    const store = getAdminStore();
    if (request.method === 'GET') {
      const collections = await Promise.all(CONTENT_TYPES.map(async (type) => {
        const snapshot = await store.collection(type).get();
        return [type, sortContent(snapshot.docs.filter((entry) => !entry.get('redirectTo')).map((entry) => ({ ...entry.data(), slug: entry.id })))];
      }));
      return response.status(200).json({ content: Object.fromEntries(collections) });
    }

    const { type, slug, originalSlug, data, status } = request.body || {};
    if (!CONTENT_TYPES.includes(type) || !SLUG_PATTERN.test(slug || '')) {
      throw new HttpError(400, 'Choose a valid content type and lowercase URL slug.');
    }
    let prepared;
    if (request.method !== 'PATCH') {
      try { prepared = prepareContent(type, data); }
      catch (error) { throw new HttpError(400, error.message); }
    } else if (!CONTENT_STATUSES.includes(status)) {
      throw new HttpError(400, 'Invalid content status.');
    }
    const item = await saveContentRecord(store, { method: request.method, type, slug, originalSlug, data: prepared, status });
    return response.status(request.method === 'POST' ? 201 : 200).json({ item });
  } catch (error) {
    return sendError(response, error, 'Content service is unavailable. Please try again.');
  }
}
