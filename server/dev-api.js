import adminContent from '../api/admin-content.js';
import publicContent from '../api/content.js';
import cloudinarySign from '../api/cloudinary-sign.js';
import comments from '../api/comments.js';
import adminComments from '../api/admin-comments.js';

const handlers = {
  '/api/admin-content': adminContent,
  '/api/content': publicContent,
  '/api/cloudinary-sign': cloudinarySign,
  '/api/comments': comments,
  '/api/admin-comments': adminComments,
};

export function apiMiddleware(request, response, next) {
  const url = new URL(request.url, 'http://localhost');
  if (!url.pathname.startsWith('/api/')) return next();
  response.status = (status) => { response.statusCode = status; return response; };
  response.json = (value) => {
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.end(JSON.stringify(value));
    return response;
  };
  const handler = handlers[url.pathname];
  if (!handler) return response.status(404).json({ error: 'API endpoint not found.' });
  request.query = Object.fromEntries(url.searchParams);
  (async () => {
    if (!['GET', 'HEAD'].includes(request.method)) {
      const chunks = [];
      let size = 0;
      for await (const chunk of request) {
        size += chunk.length;
        if (size > 512 * 1024) return response.status(413).json({ error: 'Request is too large.' });
        chunks.push(chunk);
      }
      const raw = Buffer.concat(chunks).toString('utf8');
      try { request.body = raw ? JSON.parse(raw) : {}; }
      catch { return response.status(400).json({ error: 'Invalid JSON request.' }); }
    }
    await handler(request, response);
  })().catch((error) => {
    console.error('Local API request failed:', error.message);
    if (!response.writableEnded) response.status(500).json({ error: 'Service is unavailable. Please try again.' });
  });
}
