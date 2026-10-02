export const BLOCK_TYPES = ['paragraph', 'heading', 'image', 'list', 'quote', 'divider'];

export function createBlock(type = 'paragraph', id = globalThis.crypto.randomUUID()) {
  if (!BLOCK_TYPES.includes(type)) throw new Error('Invalid article block type.');
  const block = { id, type };
  if (['paragraph', 'heading', 'quote'].includes(type)) block.text = '';
  if (type === 'heading') block.level = 2;
  if (type === 'image') Object.assign(block, { url: '', alt: '', caption: '', width: 0, height: 0 });
  if (type === 'list') Object.assign(block, { items: [], ordered: false });
  if (type === 'quote') block.attribution = '';
  return block;
}

export function legacyArticleBlocks(body = '') {
  return String(body || '').split(/\n\s*\n/).filter((text) => text.trim()).map((text, index) => {
    const heading = /^(#{2,4})\s+([\s\S]*)$/.exec(text.trim());
    return heading
      ? { id: `legacy-${index}`, type: 'heading', level: heading[1].length, text: heading[2] }
      : { id: `legacy-${index}`, type: 'paragraph', text: text.trim() };
  });
}

export function articleBlocks(post) {
  return Array.isArray(post?.blocks) ? post.blocks : legacyArticleBlocks(post?.body);
}

const textValue = (value) => typeof value === 'string' ? value.trim() : '';

export function validateArticleBlocks(input) {
  if (!Array.isArray(input) || input.length > 200) throw new Error('An article can contain up to 200 blocks.');
  if (JSON.stringify(input).length > 300000) throw new Error('Article content is too large. Shorten the text before saving.');
  const ids = new Set();
  return input.map((inputBlock) => {
    if (!inputBlock || !BLOCK_TYPES.includes(inputBlock.type)) throw new Error('Invalid article block type.');
    const { id, type } = inputBlock;
    if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(id) || ids.has(id)) throw new Error('Article blocks must have unique IDs.');
    ids.add(id);
    const block = { id, type };
    if (['paragraph', 'heading', 'quote'].includes(type)) block.text = textValue(inputBlock.text);
    if (type === 'heading') {
      if (![2, 3, 4].includes(inputBlock.level)) throw new Error('Heading level must be 2, 3 or 4.');
      block.level = inputBlock.level;
    }
    if (type === 'image') {
      block.url = textValue(inputBlock.url);
      if (block.url) {
        try {
          if (!['https:', 'http:'].includes(new URL(block.url).protocol)) throw new Error();
        } catch { throw new Error('Article image URLs must start with https:// or http://.'); }
      }
      block.alt = textValue(inputBlock.alt);
      block.caption = textValue(inputBlock.caption);
      for (const field of ['width', 'height']) {
        const number = Number(inputBlock[field] || 0);
        block[field] = Number.isSafeInteger(number) && number >= 0 && number <= 50000 ? number : 0;
      }
    }
    if (type === 'list') {
      block.items = Array.isArray(inputBlock.items) ? inputBlock.items.map(textValue).filter(Boolean) : [];
      block.ordered = inputBlock.ordered === true;
    }
    if (type === 'quote') block.attribution = textValue(inputBlock.attribution);
    return block;
  });
}

export function blocksToBody(blocks) {
  return blocks.map((block) => {
    if (block.type === 'heading') return `${'#'.repeat(block.level)} ${block.text}`;
    if (block.type === 'list') return block.items.join('\n');
    if (block.type === 'quote') return [block.text, block.attribution].filter(Boolean).join('\n');
    return ['paragraph'].includes(block.type) ? block.text : '';
  }).filter(Boolean).join('\n\n');
}

export function hasArticleContent(blocks) {
  return blocks.some((block) => block.type === 'image' ? !!block.url : block.type === 'list' ? block.items.length > 0 : !!block.text);
}
