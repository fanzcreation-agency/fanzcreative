import assert from 'node:assert/strict';
import test from 'node:test';
import { articleBlocks, blocksToBody, legacyArticleBlocks, validateArticleBlocks } from './article-blocks.js';
import { prepareContent } from './content.js';

test('existing text articles become ordered paragraph and heading blocks', () => {
  const body = 'First paragraph.\n\n## Heading\n\nSecond paragraph.';
  const blocks = legacyArticleBlocks(body);
  assert.deepEqual(blocks.map((block) => block.type), ['paragraph', 'heading', 'paragraph']);
  assert.equal(blocksToBody(blocks), body);
  assert.deepEqual(articleBlocks({ blocks: [], body }), []);
});

test('an inline image stays between paragraphs with caption, alt text and dimensions', () => {
  const blocks = validateArticleBlocks([
    { id: 'first', type: 'paragraph', text: ' First ' },
    { id: 'picture', type: 'image', url: 'https://example.com/image.webp', alt: ' Product ', caption: ' Caption ', width: 800, height: 1200, arbitrary: true },
    { id: 'second', type: 'paragraph', text: ' Second ' },
  ]);
  const saved = prepareContent('posts', { title: 'Article', excerpt: 'Summary', blocks, body: 'Old content', status: 'published' });
  assert.equal(saved.blocks[1].alt, 'Product');
  assert.equal(saved.blocks[1].height, 1200);
  assert.equal(saved.blocks[1].arbitrary, undefined);
  assert.equal(saved.body, 'First\n\nSecond');
  assert.deepEqual(saved.blocks.map((block) => block.id), ['first', 'picture', 'second']);
});

test('empty blocks do not resurrect old body content, and incomplete images cannot publish', () => {
  assert.throws(() => prepareContent('posts', { title: 'Article', excerpt: 'Summary', body: 'Old', blocks: [], status: 'published' }), /main content/);
  assert.equal(prepareContent('posts', { title: 'Draft', body: 'Old', blocks: [] }).body, '');
  assert.throws(() => prepareContent('posts', { title: 'Article', excerpt: 'Summary', blocks: [{ id: 'empty-image', type: 'image', url: '' }], status: 'published' }), /empty image block/);
});

test('block schema rejects unsafe image protocols, duplicate IDs and invalid structures', () => {
  assert.throws(() => validateArticleBlocks([{ id: 'a', type: 'image', url: 'javascript:alert(1)' }]), /image URLs/);
  assert.throws(() => validateArticleBlocks([{ id: 'a', type: 'divider' }, { id: 'a', type: 'paragraph', text: '' }]), /unique IDs/);
  assert.throws(() => validateArticleBlocks([{ id: 'a', type: 'script' }]), /block type/);
  assert.throws(() => validateArticleBlocks([{ id: 'a', type: 'heading', text: '', level: 1 }]), /Heading level/);
  assert.throws(() => validateArticleBlocks(null), /200 blocks/);
  assert.throws(() => validateArticleBlocks(Array.from({ length: 201 }, (_, index) => ({ id: String(index), type: 'divider' }))), /200 blocks/);
});

test('lists and quotes normalize text without allowing raw HTML execution', () => {
  const blocks = validateArticleBlocks([
    { id: 'list', type: 'list', items: [' First ', '', null, 'Second'], ordered: true },
    { id: 'quote', type: 'quote', text: '<script>alert(1)</script>', attribution: ' Author ' },
  ]);
  assert.deepEqual(blocks[0].items, ['First', 'Second']);
  assert.equal(blocks[1].attribution, 'Author');
  assert.equal(blocks[1].text, '<script>alert(1)</script>');
});
