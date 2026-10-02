import assert from 'node:assert/strict';
import test from 'node:test';
import { approvedComments, discussionKey, prepareComment, publicComment } from '../shared/comments.js';
import { commentPost, deleteComment, moderateComments, replyToComment, submitComment } from './comment-store.js';
import { saveContentRecord } from './content-store.js';
import { prepareContent } from '../shared/content.js';

function memoryStore(initial = {}) {
  const records = new Map(Object.entries(initial));
  const snapshot = (reference) => ({ ref: reference, id: reference.id, exists: records.has(reference.path), data: () => ({ ...records.get(reference.path) }), get: (field) => records.get(reference.path)?.[field] });
  const collection = (type, filters = [], maximum = Infinity) => ({
    doc: (id) => { const ref = { path: `${type}/${id}`, id }; ref.get = async () => snapshot(ref); return ref; },
    where: (field, operator, value) => { assert.equal(operator, '=='); return collection(type, [...filters, [field, value]], maximum); },
    limit: (value) => collection(type, filters, value),
    get: async () => {
      const docs = [...records].filter(([path, data]) => path.startsWith(`${type}/`) && filters.every(([key, value]) => data[key] === value))
        .slice(0, maximum).map(([path]) => snapshot(collection(type).doc(path.split('/')[1])));
      return { docs, empty: docs.length === 0 };
    },
  });
  const store = { records, collection };
  store.runTransaction = async (callback) => {
    const writes = [];
    await callback({
      get: async (ref) => { assert.equal(writes.length, 0); return snapshot(ref); },
      getAll: async (...references) => { assert.equal(writes.length, 0); return references.map(snapshot); },
      set: (ref, data, options) => writes.push(() => records.set(ref.path, { ...(options?.merge ? records.get(ref.path) : {}), ...data })),
      delete: (ref) => writes.push(() => records.delete(ref.path)),
    });
    writes.forEach((write) => write());
  };
  store.batch = () => { const refs = []; return { delete: (ref) => refs.push(ref), commit: async () => refs.forEach((ref) => records.delete(ref.path)) }; };
  return store;
}
const post = { slug: 'article', title: 'Article', excerpt: 'Summary', body: 'Body', status: 'published' };
const data = { name: 'Reader', email: 'reader@example.com', message: 'A useful article.', parentId: '' };
const now = 1800000000000;
const submit = (store, overrides = {}) => submitComment(store, { post, data, submissionId: 'first', rateKey: 'visitor', now, ...overrides });
const comments = (store) => [...store.records].filter(([path]) => path.startsWith('comments/')).map(([path, item]) => ({ ...item, id: path.split('/')[1] }));

test('comment validation bounds input, keeps plain text, and normalizes private email', () => {
  const result = prepareComment({ ...data, name: ' Reader ', email: 'Reader@EXAMPLE.COM ', message: 'Line one\nLine two', status: 'approved', uid: 'fake' });
  assert.equal(result.email, 'reader@example.com');
  assert.equal(result.status, undefined);
  assert.equal(result.message, 'Line one\nLine two');
  assert.equal(prepareComment({ ...data, message: '<script>alert(1)</script>' }).message, '<script>alert(1)</script>');
  for (const bad of [{ name: 'x' }, { name: 'x'.repeat(81) }, { email: 'bad' }, { message: 'a' }, { message: 'x'.repeat(5001) }, { parentId: '../unsafe' }]) assert.throws(() => prepareComment({ ...data, ...bad }));
});

test('public comments never expose email or pending, spam, trashed or orphaned replies', () => {
  const items = [{ ...data, id: 'root', status: 'approved', authorType: 'visitor' }, { ...data, id: 'reply', status: 'approved', parentId: 'root' }, { ...data, id: 'pending', status: 'pending' }, { ...data, id: 'spam', status: 'spam' }, { ...data, id: 'trash', status: 'trash' }, { ...data, id: 'orphan', parentId: 'trash', status: 'approved' }];
  assert.deepEqual(approvedComments(items).map((item) => item.id), ['root', 'reply']);
  assert.equal(publicComment(items[0]).email, undefined);
  items[0].status = 'pending';
  assert.equal(approvedComments(items).length, 0);
});

test('visitor comments always start pending and retries/duplicates create only one record', async () => {
  const store = memoryStore({ 'posts/article': post });
  assert.equal((await submit(store)).status, 'pending');
  await submit(store);
  await submit(store, { submissionId: 'second' });
  assert.equal(comments(store).length, 1);
  assert.equal(comments(store)[0].status, 'pending');
  assert.equal(store.records.get('commentRateLimits/visitor').count, 1);
  await assert.rejects(submit(store, { data: { ...data, message: 'Changed submission.' } }), /submission changed/);
});

test('persistent rate protection applies cooldown and hourly limits without storing raw IPs', async () => {
  const store = memoryStore({ 'posts/article': post });
  await submit(store);
  await assert.rejects(submit(store, { submissionId: 'next', data: { ...data, message: 'A second comment.' }, now: now + 1000 }), /wait/);
  await submit(store, { submissionId: 'next', data: { ...data, message: 'A second comment.' }, now: now + 46000 });
  store.records.set('commentRateLimits/visitor', { count: 10, windowStartedAt: now, lastSubmittedAt: now });
  await assert.rejects(submit(store, { submissionId: 'hour', data: { ...data, message: 'Another message.' }, now: now + 60000 }), /wait/);
  await submit(store, { submissionId: 'hour', data: { ...data, message: 'Another message.' }, now: now + 3600001 });
  assert.equal(store.records.get('commentRateLimits/visitor').count, 1);
});

test('replies require an approved root on the same article; admin replies are idempotent', async () => {
  const store = memoryStore({ 'posts/article': post });
  await submit(store);
  const root = comments(store)[0];
  await assert.rejects(replyToComment(store, root.id, 'Team reply', 'admin', 'reply'), /Approve/);
  await moderateComments(store, [root.id], 'approved', 'admin');
  await replyToComment(store, root.id, 'Team reply', 'admin', 'reply');
  await replyToComment(store, root.id, 'Team reply', 'admin', 'reply');
  assert.equal(comments(store).length, 2);
  assert.equal(comments(store).find((item) => item.parentId).authorType, 'admin');
  await submit(store, { submissionId: 'reader-reply', rateKey: 'other-visitor', data: { ...data, parentId: root.id } });
  assert.equal(comments(store).find((item) => item.authorType === 'visitor' && item.parentId).status, 'pending');
  store.records.set('comments/foreign', { status: 'approved', discussionId: 'other-article' });
  await assert.rejects(submit(store, { submissionId: 'foreign-reply', rateKey: 'third', data: { ...data, parentId: 'foreign' } }), /no longer available/);
});

test('a discussion survives multiple article renames and returning to the original slug', async () => {
  const store = memoryStore({ 'posts/article': post });
  await submit(store);
  await saveContentRecord(store, { method: 'PUT', type: 'posts', originalSlug: 'article', slug: 'renamed', data: prepareContent('posts', post) });
  assert.equal(discussionKey(await commentPost(store, 'renamed')), 'article');
  await saveContentRecord(store, { method: 'PUT', type: 'posts', originalSlug: 'renamed', slug: 'article', data: prepareContent('posts', post) });
  assert.equal(discussionKey(await commentPost(store, 'article')), 'article');
  assert.equal(comments(store)[0].discussionId, 'article');
});

test('draft, archived and unknown articles cannot receive comments, including stale writes', async () => {
  const store = memoryStore({ 'posts/article': { ...post, status: 'draft' } });
  await assert.rejects(commentPost(store, 'article'), /not available/);
  await assert.rejects(submit(store), /article changed/);
  await assert.rejects(commentPost(store, 'unknown'), /not available/);
  assert.equal((await commentPost(store, 'future-of-ui-ux')).legacy, true);
  store.records.set('posts/future-of-ui-ux', { status: 'archived' });
  await assert.rejects(commentPost(store, 'future-of-ui-ux'), /not available/);
});

test('trash hides the full thread, restore stays pending, and permanent delete removes replies', async () => {
  const store = memoryStore({ 'posts/article': post });
  await submit(store);
  const root = comments(store)[0];
  await moderateComments(store, [root.id], 'approved', 'admin');
  await replyToComment(store, root.id, 'Team reply', 'admin', 'reply');
  await assert.rejects(deleteComment(store, root.id), /Trash/);
  await moderateComments(store, [root.id], 'trash', 'admin');
  assert.equal(approvedComments(comments(store)).length, 0);
  await moderateComments(store, [root.id], 'pending', 'admin');
  assert.equal(approvedComments(comments(store)).length, 0);
  await moderateComments(store, [root.id], 'trash', 'admin');
  await deleteComment(store, root.id);
  assert.equal(comments(store).length, 0);
});

test('bulk moderation aborts without partial changes and deletion locks prevent concurrent restore', async () => {
  const store = memoryStore({ 'comments/first': { ...data, status: 'pending' }, 'comments/locked': { ...data, status: 'trash', deleting: true } });
  await assert.rejects(moderateComments(store, ['first', 'missing'], 'approved', 'admin'), /no longer exists/);
  assert.equal(store.records.get('comments/first').status, 'pending');
  await assert.rejects(moderateComments(store, ['first', 'locked'], 'pending', 'admin'), /being deleted/);
  assert.equal(store.records.get('comments/locked').status, 'trash');
});
