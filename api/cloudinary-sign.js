import { randomUUID } from 'node:crypto';
import { v2 as cloudinary } from 'cloudinary';
import { HttpError, requireAdmin, sendError } from '../server/http.js';
import { SLUG_PATTERN } from '../shared/content.js';

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await requireAdmin(request);
    const config = {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    };
    if (!config.cloud_name || !config.api_key || !config.api_secret) {
      throw new HttpError(503, 'Image upload is not configured on the server.');
    }

    const { kind, slug, resourceType = 'image' } = request.body || {};
    if (!['blog', 'project', 'asset'].includes(kind) || !['image', 'video'].includes(resourceType)) {
      return response.status(400).json({ error: 'Invalid upload type' });
    }
    if (kind === 'project' && !SLUG_PATTERN.test(slug || '')) {
      return response.status(400).json({ error: 'Invalid project slug' });
    }

    const folder = kind === 'blog'
      ? 'fanzcreative/blog'
      : kind === 'project'
        ? `fanzcreative/projects/${slug}`
        : 'fanzcreative/assets';
    const timestamp = Math.floor(Date.now() / 1000);
    const publicId = randomUUID();
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder, public_id: publicId },
      config.api_secret,
    );

    return response.status(200).json({
      cloudName: config.cloud_name,
      apiKey: config.api_key,
      timestamp,
      folder,
      publicId,
      signature,
      resourceType,
    });
  } catch (error) {
    return sendError(response, error, 'Image upload service is unavailable. Please try again.');
  }
}
