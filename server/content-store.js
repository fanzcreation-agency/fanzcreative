import { FieldValue } from 'firebase-admin/firestore';
import { HttpError } from './http.js';
import { prepareContent, SLUG_PATTERN } from '../shared/content.js';

export async function saveContentRecord(store, { method, type, slug, originalSlug = slug, data, status }) {
  if (!SLUG_PATTERN.test(originalSlug || '') || (method !== 'PUT' && originalSlug !== slug)) {
    throw new HttpError(400, 'Choose a valid original slug.');
  }
  const reference = store.collection(type).doc(slug);
  const source = store.collection(type).doc(originalSlug);
  const renaming = originalSlug !== slug;
  await store.runTransaction(async (transaction) => {
    const existing = await transaction.get(source);
    if (method === 'POST' && existing.exists) throw new HttpError(409, 'This slug already exists. Choose a different one.');
    if (method !== 'POST' && (!existing.exists || existing.get('redirectTo'))) {
      throw new HttpError(404, 'This item no longer exists. Refresh the list.');
    }
    let prepared = data;
    if (method === 'PATCH') {
      if (status === 'published') {
        try { prepareContent(type, { ...existing.data(), status }); }
        catch (error) { throw new HttpError(400, error.message); }
      }
      prepared = { status };
    }
    let previousSlugs = existing.get('previousSlugs') || [];
    if (renaming) {
      const target = await transaction.get(reference);
      if (target.exists && target.get('redirectTo') !== originalSlug) {
        throw new HttpError(409, 'This slug already exists. Choose a different one.');
      }
      previousSlugs = [...new Set([...previousSlugs, originalSlug])].filter((value) => value !== slug);
      if (previousSlugs.length > 100) throw new HttpError(400, 'This item has reached the limit of 100 previous URLs.');
      const aliases = await transaction.getAll(...previousSlugs.map((value) => store.collection(type).doc(value)));
      for (const alias of aliases) {
        if (alias.id !== originalSlug && alias.exists && alias.get('redirectTo') !== originalSlug) {
          throw new HttpError(409, 'A previous URL is in use by another item. Refresh and try again.');
        }
      }
    }
    const saved = {
      ...(renaming ? existing.data() : {}), ...prepared,
      updatedAt: FieldValue.serverTimestamp(),
      ...(!existing.exists ? { createdAt: FieldValue.serverTimestamp() } : {}),
      ...(prepared.status === 'published' && existing.get('status') !== 'published'
        ? { publishedAt: FieldValue.serverTimestamp() } : {}),
      ...(renaming ? { previousSlugs } : {}),
      ...(type === 'posts' ? { discussionId: existing.get('discussionId') || existing.get('previousSlugs')?.[0] || originalSlug } : {}),
    };
    if (renaming) {
      delete saved.slug;
      transaction.set(reference, saved);
      for (const oldSlug of previousSlugs) transaction.set(store.collection(type).doc(oldSlug), {
        redirectTo: slug, status: 'redirect', updatedAt: FieldValue.serverTimestamp(),
      });
    } else transaction.set(reference, saved, { merge: true });
  });
  const saved = await reference.get();
  return { ...saved.data(), slug: saved.id };
}

export async function resolvePublishedRecord(store, type, slug) {
  let reference = store.collection(type).doc(slug);
  let managed = false;
  const visited = new Set();
  for (let depth = 0; depth < 10; depth++) {
    if (visited.has(reference.id)) return { item: null, managed };
    visited.add(reference.id);
    const document = await reference.get();
    managed ||= document.exists;
    if (!document.exists) return { item: null, managed };
    const target = document.get('redirectTo');
    if (target) {
      if (!SLUG_PATTERN.test(target)) return { item: null, managed };
      reference = store.collection(type).doc(target);
    } else return {
      item: document.get('status') === 'published' ? { ...document.data(), slug: document.id } : null,
      managed,
    };
  }
  return { item: null, managed };
}
