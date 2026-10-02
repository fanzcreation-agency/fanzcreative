import { getAdminStore } from '../server/firebase-admin.js';
import { contentSeconds } from '../shared/content.js';
import { resolvePublishedRecord } from '../server/content-store.js';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const { type, slug } = request.query;
  if (!['posts', 'projects'].includes(type) || (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))) {
    return response.status(400).json({ error: 'Invalid content request' });
  }

  try {
    const store = getAdminStore();
    response.setHeader('Cache-Control', 'no-store');
    if (slug) {
      const { item, managed } = await resolvePublishedRecord(store, type, slug);
      if (!item) {
        return response.status(404).json({ error: 'Not found', managed });
      }
      return response.status(200).json(item);
    }

    const snapshot = await store.collection(type).get();
    const items = snapshot.docs.filter((document) => document.get('status') === 'published' && !document.get('redirectTo'))
      .map((document) => ({ slug: document.id, ...document.data() }));
    items.sort((a, b) => contentSeconds(b.publishedAt) - contentSeconds(a.publishedAt));
    return response.status(200).json({
      items,
      managedSlugs: snapshot.docs.map((document) => document.id),
    });
  } catch (error) {
    console.error('Content request failed:', error.message);
    return response.status(503).json({ error: 'Content is temporarily unavailable' });
  }
}
