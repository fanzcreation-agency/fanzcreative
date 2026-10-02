import { requestJson } from '../lib/http';
import { adminRequest } from './apiClient';

export function validateImageFile(file) {
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)) {
    throw new Error('Choose a JPG, PNG, WebP or AVIF image.');
  }
  if (file.size > 15 * 1024 * 1024) throw new Error('Image must be smaller than 15 MB.');
}

export async function uploadImage(file, type, slug) {
  validateImageFile(file);
  const params = await adminRequest('/api/cloudinary-sign', {
    method: 'POST', body: JSON.stringify({ kind: type === 'posts' ? 'blog' : 'project', slug, resourceType: 'image' }),
  });
  if (!params.cloudName || !params.apiKey || !params.signature || !params.publicId || !params.folder || !params.timestamp) {
    throw new Error('Image upload service returned incomplete authorization. Please try again.');
  }
  const form = new FormData();
  form.append('file', file);
  form.append('api_key', params.apiKey);
  form.append('timestamp', String(params.timestamp));
  form.append('folder', params.folder);
  form.append('public_id', params.publicId);
  form.append('signature', params.signature);
  const result = await requestJson(`https://api.cloudinary.com/v1_1/${params.cloudName}/image/upload`, {
    method: 'POST', body: form, timeoutMs: 120000,
  });
  if (typeof result.secure_url !== 'string') throw new Error('The image service did not return an image URL. Please try again.');
  return result.secure_url.replace('/upload/', '/upload/f_auto/q_auto/');
}
