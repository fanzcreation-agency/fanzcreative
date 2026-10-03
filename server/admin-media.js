import { readFileSync } from 'node:fs';
import { v2 as cloudinary } from 'cloudinary';
import { HttpError } from './http.js';

const siteMedia = JSON.parse(readFileSync(new URL('../src/cloudinary-media.json', import.meta.url), 'utf8'));
const prefixes = { all: 'fanzcreative/', blog: 'fanzcreative/blog/', projects: 'fanzcreative/projects/', assets: 'fanzcreative/assets/' };

export function mediaConfig() {
  const config = { cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET };
  if (Object.values(config).some((value) => !value)) throw new HttpError(503, 'Media Library is not configured on the server.');
  cloudinary.config(config);
  return config;
}

export function mediaQuery(query = {}) {
  const folder = query.folder || 'all';
  if (!Object.hasOwn(prefixes, folder)) throw new HttpError(400, 'Choose a valid media folder.');
  if (query.cursor !== undefined && (typeof query.cursor !== 'string' || query.cursor.length > 2048)) throw new HttpError(400, 'Invalid page cursor.');
  return { resource_type: 'image', type: 'upload', prefix: prefixes[folder], max_results: 60, context: true, next_cursor: query.cursor || undefined };
}

export function mediaSearch(query = {}) {
  const options = mediaQuery(query);
  if (typeof query.q !== 'string' || query.q.length > 100) throw new HttpError(400, 'Search must be shorter than 100 characters.');
  const term = query.q.trim().replace(/[\\"*]/g, '\\$&');
  return `resource_type:image AND type:upload AND public_id:${options.prefix}* AND (display_name:"${term}" OR filename:"${term}" OR context.caption:"${term}")`;
}

export function publicMedia(item) {
  return {
    id: item.asset_id, publicId: item.public_id, url: item.secure_url,
    name: item.context?.custom?.caption || item.display_name || item.public_id.split('/').at(-1),
    width: item.width || 0, height: item.height || 0, bytes: item.bytes || 0,
    format: item.format || '', createdAt: item.created_at || null,
    folder: item.public_id.substring(0, item.public_id.lastIndexOf('/')),
  };
}

export function mediaPublicId(value) {
  if (typeof value !== 'string') throw new HttpError(400, 'Choose a valid image.');
  if (!value.startsWith('fanzcreative/') || value.length > 512 || value.includes('\\') || [...value].some((character) => character.charCodeAt(0) < 32) || value.split('/').some((part) => !part || part === '.' || part === '..')) throw new HttpError(400, 'Choose a site image.');
  return value;
}

export function containsMedia(value, publicId, cloudName) {
  if (typeof value === 'string') {
    try {
      const url = new URL(value);
      if (url.hostname !== 'res.cloudinary.com') return false;
      const path = decodeURIComponent(url.pathname);
      if (!path.startsWith(`/${cloudName}/image/upload/`)) return false;
      const tail = path.substring(path.indexOf('/fanzcreative/') + 1);
      return tail === publicId || tail.replace(/\.[^/.]+$/, '') === publicId;
    } catch { return false; }
  }
  if (Array.isArray(value)) return value.some((entry) => containsMedia(entry, publicId, cloudName));
  return Boolean(value && typeof value === 'object' && Object.values(value).some((entry) => containsMedia(entry, publicId, cloudName)));
}

export async function mediaUsage(store, publicId, cloudName) {
  const usage = [];
  if (containsMedia(siteMedia, publicId, cloudName)) usage.push({ type: 'website', title: 'Built-in website asset' });
  for (const type of ['posts', 'projects']) {
    const snapshot = await store.collection(type).get();
    for (const doc of snapshot.docs) {
      if (containsMedia(doc.data(), publicId, cloudName)) usage.push({ type, slug: doc.id, title: doc.get('title') || doc.id });
    }
  }
  return usage;
}
