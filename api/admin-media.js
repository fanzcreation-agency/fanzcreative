import { v2 as cloudinary } from 'cloudinary';
import { getAdminStore } from '../server/firebase-admin.js';
import { HttpError, requireAdmin, sendError } from '../server/http.js';
import { mediaConfig, mediaPublicId, mediaQuery, mediaSearch, mediaUsage, publicMedia } from '../server/admin-media.js';

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'DELETE'].includes(request.method)) {
    response.setHeader('Allow', 'GET, DELETE');
    return response.status(405).json({ error: 'Method not allowed.' });
  }
  try {
    await requireAdmin(request);
    const config = mediaConfig();
    if (request.method === 'GET' && !request.query?.publicId) {
      const options = mediaQuery(request.query);
      const result = request.query?.q
        ? await cloudinary.search.expression(mediaSearch(request.query)).with_field('context').sort_by('created_at', 'desc').max_results(60).next_cursor(options.next_cursor).execute()
        : await cloudinary.api.resources(options);
      return response.status(200).json({ items: result.resources.map(publicMedia), nextCursor: result.next_cursor || null });
    }
    const publicId = mediaPublicId(request.method === 'GET' ? request.query.publicId : request.body?.publicId);
    const resource = await cloudinary.api.resource(publicId, { resource_type: 'image', type: 'upload' });
    const usage = await mediaUsage(getAdminStore(), publicId, config.cloud_name);
    if (request.method === 'GET') return response.status(200).json({ item: publicMedia(resource), usage });
    if (usage.length) throw new HttpError(409, 'This image is used by the website, a blog or a project. Remove those references before deleting it.');
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image', type: 'upload', invalidate: true });
    if (!['ok', 'not found'].includes(result.result)) throw new Error('Image deletion was not confirmed.');
    return response.status(200).json({ deleted: true });
  } catch (error) {
    const failure = error.http_code === 404 ? new HttpError(404, 'This image no longer exists. Refresh the library.') : error;
    return sendError(response, failure, 'Media Library is unavailable. Please try again.');
  }
}
