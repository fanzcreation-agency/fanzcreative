export const COMMENT_STATUSES = ['pending', 'approved', 'spam', 'trash'];
export const COMMENT_ID = /^[a-zA-Z0-9_-]{1,80}$/;
export const SUBMISSION_ID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

export function discussionKey(post) {
  return post.discussionId || post.previousSlugs?.[0] || post.slug;
}

export function prepareComment(input, { reply = false } = {}) {
  const text = (key) => typeof input?.[key] === 'string' ? input[key].trim().replace(/\p{Cc}/gu, (character) => ['\n', '\r', '\t'].includes(character) ? character : '') : '';
  const data = { name: text('name'), email: text('email').toLowerCase(), message: text('message'), parentId: text('parentId') };
  if (!reply && (data.name.length < 2 || data.name.length > 80)) throw new Error('Name must be between 2 and 80 characters.');
  if (!reply && (data.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))) throw new Error('Enter a valid email address.');
  if (data.message.length < 3 || data.message.length > 5000) throw new Error('Comment must be between 3 and 5,000 characters.');
  if (data.parentId && !COMMENT_ID.test(data.parentId)) throw new Error('Invalid reply target.');
  return data;
}

export function publicComment(comment) {
  return { id: comment.id, name: comment.name, message: comment.message, parentId: comment.parentId || '', createdAt: comment.createdAt, authorType: comment.authorType === 'admin' ? 'admin' : 'visitor' };
}

export function approvedComments(comments) {
  const roots = new Set(comments.filter((item) => item.status === 'approved' && !item.parentId).map((item) => item.id));
  return comments.filter((item) => item.status === 'approved' && (!item.parentId || roots.has(item.parentId)));
}

export function commentCounts(comments) {
  return Object.fromEntries(COMMENT_STATUSES.map((status) => [status, comments.filter((item) => item.status === status).length]));
}
