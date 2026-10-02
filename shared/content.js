import { blocksToBody, hasArticleContent, legacyArticleBlocks, validateArticleBlocks } from './article-blocks.js';

export const CONTENT_TYPES = ['posts', 'projects'];
export const CONTENT_STATUSES = ['draft', 'published', 'archived'];
export const SLUG_PATTERN = /^(?!new$)[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const DEFAULT_END_QUOTE = "A little universe of inspiration \u2014 where passion meets professionalism and creativity knows no bounds. Exceptional service, stunning products that made me go 'wow' at first glance, and prices that make you smile!";

export function articleEndQuote(article) {
  return article?.endQuoteMode === 'custom' && typeof article.endQuote === 'string' && article.endQuote.trim()
    ? article.endQuote.trim() : DEFAULT_END_QUOTE;
}

export function prepareEndQuote(input) {
  const endQuoteMode = input?.endQuoteMode ?? 'default';
  if (!['default', 'custom'].includes(endQuoteMode)) throw new Error('Choose Default or Custom for the end quote.');
  const endQuote = typeof input?.endQuote === 'string' ? input.endQuote.trim() : '';
  if (endQuote.length > 2000) throw new Error('End quote must be 2,000 characters or fewer.');
  if (endQuoteMode === 'custom' && !endQuote) throw new Error('Enter a custom end quote or select Default.');
  return { endQuoteMode, endQuote };
}

export function normalizeSlug(value, { allowTrailingHyphen = false } = {}) {
  const slug = String(value ?? '').normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/['\u2018\u2019]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+/, '');
  return allowTrailingHyphen ? slug : slug.replace(/-+$/, '');
}

export function contentSeconds(timestamp) {
  return timestamp?.seconds ?? timestamp?._seconds ?? 0;
}

export function sortContent(items) {
  return [...items].sort((a, b) => contentSeconds(b.updatedAt) - contentSeconds(a.updatedAt));
}

function imageUrl(value) {
  const url = typeof value === 'string' ? value.trim() : '';
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
  } catch {
    throw new Error('Image URLs must start with https:// or http://.');
  }
  return url;
}

export function prepareContent(type, input) {
  if (!CONTENT_TYPES.includes(type)) throw new Error('Invalid content type.');
  const status = input?.status || 'draft';
  if (!CONTENT_STATUSES.includes(status)) throw new Error('Invalid content status.');
  const fields = type === 'posts'
    ? ['title', 'excerpt', 'category', 'body']
    : ['title', 'summary', 'industry', 'projectType', 'details', 'detailsContinued', 'research', 'results'];
  const data = Object.fromEntries(fields.map((field) => [field, typeof input?.[field] === 'string' ? input[field].trim() : '']));
  data.coverUrl = imageUrl(input?.coverUrl);
  data.status = status;
  if (!data.title) throw new Error('Title is required.');
  if (type === 'posts') {
    Object.assign(data, prepareEndQuote(input));
    data.blocks = validateArticleBlocks(input?.blocks === undefined ? legacyArticleBlocks(data.body) : input.blocks);
    data.body = blocksToBody(data.blocks);
    if (status === 'published' && data.blocks.some((block) => block.type === 'image' && !block.url)) {
      throw new Error('Upload an image or remove the empty image block before publishing.');
    }
  }
  if (type === 'projects') {
    data.featured = input?.featured === true;
    data.sortOrder = Number(input?.sortOrder ?? 0);
    if (!Number.isSafeInteger(data.sortOrder) || data.sortOrder < 0 || data.sortOrder > 999999) {
      throw new Error('Sort order must be a whole number from 0 to 999999.');
    }
    data.services = Array.isArray(input?.services)
      ? [...new Set(input.services.filter((value) => typeof value === 'string').map((value) => value.trim()).filter(Boolean))]
      : [];
    data.deliverables = Array.isArray(input?.deliverables)
      ? input.deliverables.filter((value) => typeof value === 'string').map((value) => value.trim()).filter(Boolean)
      : [];
    data.galleryUrls = Array.from({ length: 3 }, (_, index) => imageUrl(input?.galleryUrls?.[index]));
  }
  if (status === 'published') {
    if (type === 'posts' ? !data.excerpt || !hasArticleContent(data.blocks) : !data.summary || !data.details) {
      throw new Error('Add the main content before publishing. The featured image is optional.');
    }
    if (type === 'projects' && data.galleryUrls.some((url) => !url)) {
      throw new Error('Add all three gallery images before publishing the project.');
    }
  }
  return data;
}
