import assert from 'node:assert/strict';
import test from 'node:test';
import { resolvePublishedRecord, saveContentRecord } from './content-store.js';
import { prepareContent } from '../shared/content.js';

function memoryStore(initial) {
  const records = new Map(Object.entries(initial));
  const snapshot = (reference) => ({
    id: reference.id, exists: records.has(reference.path),
    data: () => records.get(reference.path), get: (field) => records.get(reference.path)?.[field],
  });
  const store = {
    records,
    collection: (type) => ({ doc: (slug) => {
      const reference = { path: `${type}/${slug}`, id: slug };
      reference.get = async () => snapshot(reference);
      return reference;
    } }),
    runTransaction: async (callback) => {
      const writes = [];
      const transaction = {
        get: async (reference) => { assert.equal(writes.length, 0, 'All reads precede writes'); return snapshot(reference); },
        getAll: async (...references) => { assert.equal(writes.length, 0); return references.map(snapshot); },
        set: (reference, data, options) => writes.push({ reference, data, options }),
      };
      await callback(transaction);
      for (const { reference, data, options } of writes) records.set(reference.path, { ...(options?.merge ? records.get(reference.path) : {}), ...data });
    },
  };
  return store;
}
const article = { title: 'Article', excerpt: 'Summary', body: 'Original article.', status: 'published', publishedAt: { seconds: 1 }, createdAt: { seconds: 1 } };
const update = (slug, originalSlug) => ({ method: 'PUT', type: 'posts', slug, originalSlug, data: prepareContent('posts', article) });

test('renaming preserves content and timestamps and old URLs resolve to the canonical item', async () => {
  const store = memoryStore({ 'posts/original': article });
  const saved = await saveContentRecord(store, update('renamed', 'original'));
  assert.equal(saved.slug, 'renamed');
  assert.deepEqual(saved.publishedAt, article.publishedAt);
  assert.deepEqual(saved.createdAt, article.createdAt);
  assert.equal(store.records.get('posts/original').redirectTo, 'renamed');
  assert.equal((await resolvePublishedRecord(store, 'posts', 'original')).item.slug, 'renamed');
  assert.equal(store.records.get('posts/original').body, undefined);
});

test('multiple renames keep aliases flat and allow returning to a previous slug', async () => {
  const store = memoryStore({ 'posts/first': article });
  await saveContentRecord(store, update('second', 'first'));
  await saveContentRecord(store, update('third', 'second'));
  assert.equal(store.records.get('posts/first').redirectTo, 'third');
  assert.equal(store.records.get('posts/second').redirectTo, 'third');
  await saveContentRecord(store, update('first', 'third'));
  assert.equal((await resolvePublishedRecord(store, 'posts', 'second')).item.slug, 'first');
  assert.equal(store.records.get('posts/first').redirectTo, undefined);
  assert.deepEqual(store.records.get('posts/first').previousSlugs.sort(), ['second', 'third']);
});

test('collisions abort atomically and missing items or redirect aliases cannot be edited', async () => {
  const store = memoryStore({ 'posts/original': article, 'posts/taken': { ...article, title: 'Another' }, 'posts/alias': { redirectTo: 'taken' } });
  await assert.rejects(saveContentRecord(store, update('taken', 'original')), /already exists/);
  assert.equal(store.records.get('posts/original').body, 'Original article.');
  assert.equal(store.records.get('posts/taken').title, 'Another');
  await assert.rejects(saveContentRecord(store, update('missing', 'missing')), /no longer exists/);
  await assert.rejects(saveContentRecord(store, update('alias', 'alias')), /no longer exists/);
});

test('draft and archived content stays private through every previous URL', async () => {
  const store = memoryStore({ 'posts/original': article });
  await saveContentRecord(store, update('renamed', 'original'));
  for (const status of ['draft', 'archived']) {
    await saveContentRecord(store, { method: 'PATCH', type: 'posts', slug: 'renamed', status });
    assert.deepEqual(await resolvePublishedRecord(store, 'posts', 'original'), { item: null, managed: true });
  }
});

test('invalid original slug and circular redirects are handled without exposing content', async () => {
  const store = memoryStore({ 'posts/a': { redirectTo: 'b' }, 'posts/b': { redirectTo: 'a' } });
  await assert.rejects(saveContentRecord(store, update('target', '../unsafe')), /original slug/);
  assert.deepEqual(await resolvePublishedRecord(store, 'posts', 'a'), { item: null, managed: true });
  assert.deepEqual(await resolvePublishedRecord(store, 'posts', 'missing'), { item: null, managed: false });
});
