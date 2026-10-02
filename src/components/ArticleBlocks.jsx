import './ArticleBlocks.css';

export default function ArticleBlocks({ blocks = [] }) {
  return <div className="article-blocks">{blocks.map((block) => {
    if (block.type === 'image') return block.url ? <figure className="article-block-image" key={block.id}>
      <img loading="lazy" decoding="async" src={block.url} alt={block.alt || ''} width={block.width || undefined} height={block.height || undefined} />
      {block.caption && <figcaption>{block.caption}</figcaption>}
    </figure> : null;
    if (block.type === 'divider') return <hr key={block.id} />;
    if (block.type === 'list') {
      const Tag = block.ordered ? 'ol' : 'ul';
      return block.items?.length ? <Tag key={block.id}>{block.items.map((item, index) => <li key={index}>{item}</li>)}</Tag> : null;
    }
    if (!block.text) return null;
    if (block.type === 'heading') {
      const Tag = [2, 3, 4].includes(block.level) ? `h${block.level}` : 'h2';
      return <Tag key={block.id}>{block.text}</Tag>;
    }
    if (block.type === 'quote') return <blockquote key={block.id}><p>{block.text}</p>{block.attribution && <cite>{block.attribution}</cite>}</blockquote>;
    return <p key={block.id}>{block.text}</p>;
  })}</div>;
}
