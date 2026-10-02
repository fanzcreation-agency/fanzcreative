import assert from 'node:assert/strict';
import test from 'node:test';
import { articleEndQuote, DEFAULT_END_QUOTE, normalizeSlug, prepareContent, SLUG_PATTERN, sortContent } from './content.js';

const image = 'https://example.com/image.webp';
const post = { title: 'Article', excerpt: 'Summary', body: 'Body', status: 'published' };
const project = { title: 'Project', summary: 'Summary', details: 'Details', status: 'published', galleryUrls: [image, image, image] };

test('old and new articles keep the original end quote by default', () => {
  const data = prepareContent('posts', post);
  assert.equal(data.endQuoteMode, 'default');
  assert.equal(data.endQuote, '');
  assert.equal(articleEndQuote(post), DEFAULT_END_QUOTE);
  assert.equal(articleEndQuote(data), DEFAULT_END_QUOTE);
});

test('custom end quotes persist as plain text and can switch back to default', () => {
  const quote = 'Design matters.\n<script>not executable</script>';
  const custom = prepareContent('posts', { ...post, endQuoteMode: 'custom', endQuote: ` ${quote} ` });
  assert.equal(custom.endQuote, quote);
  assert.equal(articleEndQuote(custom), quote);
  const restored = prepareContent('posts', { ...custom, endQuoteMode: 'default' });
  assert.equal(articleEndQuote(restored), DEFAULT_END_QUOTE);
  assert.equal(restored.endQuote, quote);
  const data = prepareContent('projects', { ...project, endQuoteMode: 'custom', endQuote: quote });
  assert.equal(data.endQuoteMode, undefined);
  assert.equal(data.endQuote, undefined);
});

test('invalid custom end quotes are rejected without affecting legacy articles', () => {
  assert.throws(() => prepareContent('posts', { ...post, endQuoteMode: 'hidden' }), /Default or Custom/);
  for (const endQuote of ['', '  ', null, 12]) {
    assert.throws(() => prepareContent('posts', { ...post, endQuoteMode: 'custom', endQuote }), /Enter a custom end quote/);
  }
  assert.throws(() => prepareContent('posts', { ...post, endQuoteMode: 'custom', endQuote: 'a'.repeat(2001) }), /2,000/);
  assert.equal(articleEndQuote({ endQuoteMode: 'custom', endQuote: null }), DEFAULT_END_QUOTE);
});

test('published blogs and projects allow no featured image', () => {
  assert.equal(prepareContent('posts', post).coverUrl, '');
  assert.equal(prepareContent('projects', project).coverUrl, '');
});

test('draft projects preserve missing gallery positions', () => {
  const draft = prepareContent('projects', { title: 'Draft', galleryUrls: ['', image, image] });
  assert.deepEqual(draft.galleryUrls, ['', image, image]);
});

test('publication requires main content and three project gallery images', () => {
  assert.throws(() => prepareContent('posts', { ...post, body: '' }), /main content/);
  assert.throws(() => prepareContent('projects', { ...project, galleryUrls: [image, '', image] }), /all three gallery/);
  assert.throws(() => prepareContent('projects', { ...project, details: '' }), /main content/);
});

test('content validation rejects invalid types, statuses, titles and image URLs', () => {
  assert.throws(() => prepareContent('users', post), /content type/);
  assert.throws(() => prepareContent('posts', { ...post, status: 'unknown' }), /status/);
  assert.throws(() => prepareContent('posts', { ...post, title: ' ' }), /Title/);
  assert.throws(() => prepareContent('posts', { ...post, coverUrl: 'javascript:alert(1)' }), /Image URLs/);
});

test('validation trims text, strips unknown fields and normalizes deliverables', () => {
  const data = prepareContent('projects', { ...project, title: ' Project ', admin: true, deliverables: [' Design ', '', null] });
  assert.equal(data.title, 'Project');
  assert.equal(data.admin, undefined);
  assert.deepEqual(data.deliverables, ['Design']);
});

test('sorting supports client and server Firestore timestamps without mutating input', () => {
  const items = [{ slug: 'old', updatedAt: { seconds: 1 } }, { slug: 'newest', updatedAt: { _seconds: 10 } }];
  assert.deepEqual(sortContent(items).map((item) => item.slug), ['newest', 'old']);
  assert.equal(items[0].slug, 'old');
});

test('slugs reject the reserved new editor route and unsafe URL characters', () => {
  for (const slug of ['', 'new', 'UPPER', '../path', 'my project', 'a--b']) assert.equal(SLUG_PATTERN.test(slug), false);
  assert.equal(SLUG_PATTERN.test('my-project-2'), true);
});

test('titles and pasted slug text normalize to lowercase URL-safe words', () => {
  assert.equal(normalizeSlug('  Designing a Website That Builds Trust  '), 'designing-a-website-that-builds-trust');
  assert.equal(normalizeSlug('Branding   & Web Design / 2026!'), 'branding-web-design-2026');
  assert.equal(normalizeSlug('Already--Valid---Slug'), 'already-valid-slug');
  assert.equal(normalizeSlug('What\u2019s New at Caf\u00e9?'), 'whats-new-at-cafe');
  assert.equal(normalizeSlug('123 Test Project'), '123-test-project');
});

test('typing a space in the slug preserves a separator until the next word', () => {
  let value = normalizeSlug('my ', { allowTrailingHyphen: true });
  assert.equal(value, 'my-');
  value = normalizeSlug(`${value}project`, { allowTrailingHyphen: true });
  assert.equal(value, 'my-project');
  assert.equal(normalizeSlug('my-project- '), 'my-project');
  for (const input of ['', null, undefined, '---', '   ', '\u2605']) assert.equal(normalizeSlug(input), '');
});

test('project placement and taxonomy persist with safe defaults', () => {
  const data = prepareContent('projects', { ...project, featured: true, sortOrder: '2', projectType: ' Website ', services: [' Design ', 'Design', '', null, 'Development'] });
  assert.equal(data.featured, true);
  assert.equal(data.sortOrder, 2);
  assert.equal(data.projectType, 'Website');
  assert.deepEqual(data.services, ['Design', 'Development']);
  assert.equal(prepareContent('projects', project).featured, false);
  assert.equal(prepareContent('projects', project).sortOrder, 0);
  for (const sortOrder of [-1, 1.5, 'invalid', 1000000]) {
    assert.throws(() => prepareContent('projects', { ...project, sortOrder }), /Sort order/);
  }
});
