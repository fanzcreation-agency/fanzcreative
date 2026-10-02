import { ArrowDown, ArrowUp, Copy, Eye, Heading, Image, List, Minus, Pilcrow, Plus, Quote, Trash2, Upload } from 'lucide-react';
import { BLOCK_TYPES, createBlock } from '../../shared/article-blocks';
import './BlockEditor.css';

const types = {
  paragraph: { label: 'Paragraph', icon: Pilcrow }, heading: { label: 'Heading', icon: Heading },
  image: { label: 'Image', icon: Image }, list: { label: 'List', icon: List },
  quote: { label: 'Quote', icon: Quote }, divider: { label: 'Divider', icon: Minus },
};

function InsertBlock({ position, disabled, onInsert }) {
  return <details className="block-inserter">
    <summary title={`Add block at position ${position + 1}`} aria-label={`Add block at position ${position + 1}`} aria-disabled={disabled} onClick={(event) => { if (disabled) event.preventDefault(); }}><Plus size={17} /></summary>
    <div className="block-insert-menu">{BLOCK_TYPES.map((type) => {
      const Icon = types[type].icon;
      return <button type="button" key={type} disabled={disabled} onClick={(event) => { onInsert(position, type); event.currentTarget.closest('details').open = false; }}><Icon size={16} /> {types[type].label}</button>;
    })}</div>
  </details>;
}

export default function BlockEditor({ blocks, onChange, disabled, uploading, errors, onUpload, onPreview }) {
  const update = (id, data) => onChange(blocks.map((block) => block.id === id ? { ...block, ...data } : block));
  const insert = (position, type) => {
    const next = [...blocks];
    next.splice(position, 0, createBlock(type));
    onChange(next);
  };
  const move = (index, direction) => {
    const next = [...blocks];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    onChange(next);
  };
  const duplicate = (index) => {
    const next = [...blocks];
    next.splice(index + 1, 0, { ...structuredClone(blocks[index]), id: globalThis.crypto.randomUUID() });
    onChange(next);
  };

  return <section className="block-editor" aria-label="Article body">
    <div className="block-editor-heading"><h3>Article</h3><button type="button" className="admin-btn secondary" onClick={onPreview} disabled={disabled}><Eye size={16} />Preview</button></div>
    <div className="block-editor-canvas">
      <InsertBlock position={0} disabled={disabled} onInsert={insert} />
      {blocks.map((block, index) => <div key={block.id}>
        <div className="article-editor-block" data-block-id={block.id} data-block-type={block.type}>
          <div className="block-toolbar">
            <select aria-label={`Block ${index + 1} type`} value={block.type} disabled={disabled} onChange={(event) => {
              const replacement = createBlock(event.target.value, block.id);
              if ('text' in replacement) replacement.text = block.text || block.caption || '';
              onChange(blocks.map((item) => item.id === block.id ? replacement : item));
            }}>{BLOCK_TYPES.map((type) => <option key={type} value={type}>{types[type].label}</option>)}</select>
            <div className="block-actions">
              <button type="button" title="Move block up" aria-label={`Move block ${index + 1} up`} disabled={disabled || index === 0} onClick={() => move(index, -1)}><ArrowUp size={16} /></button>
              <button type="button" title="Move block down" aria-label={`Move block ${index + 1} down`} disabled={disabled || index === blocks.length - 1} onClick={() => move(index, 1)}><ArrowDown size={16} /></button>
              <button type="button" title="Duplicate block" aria-label={`Duplicate block ${index + 1}`} disabled={disabled} onClick={() => duplicate(index)}><Copy size={16} /></button>
              <button type="button" title="Delete block" aria-label={`Delete block ${index + 1}`} disabled={disabled} onClick={() => onChange(blocks.filter((item) => item.id !== block.id))}><Trash2 size={16} /></button>
            </div>
          </div>
          {block.type === 'heading' && <label className="block-option">Heading level<select aria-label={`Block ${index + 1} heading level`} value={block.level} disabled={disabled} onChange={(event) => update(block.id, { level: Number(event.target.value) })}>{[2, 3, 4].map((level) => <option key={level} value={level}>H{level}</option>)}</select></label>}
          {['paragraph', 'heading', 'quote'].includes(block.type) && <textarea className={`block-text block-text-${block.type}`} aria-label={`${types[block.type].label} ${index + 1}`} placeholder={types[block.type].label} rows={block.type === 'heading' ? 2 : 4} value={block.text} disabled={disabled} onChange={(event) => update(block.id, { text: event.target.value })} />}
          {block.type === 'quote' && <input className="block-input" aria-label={`Quote ${index + 1} attribution`} placeholder="Attribution" value={block.attribution} disabled={disabled} onChange={(event) => update(block.id, { attribution: event.target.value })} />}
          {block.type === 'list' && <>
            <label className="block-option">List style<select aria-label={`Block ${index + 1} list style`} value={block.ordered ? 'ordered' : 'unordered'} disabled={disabled} onChange={(event) => update(block.id, { ordered: event.target.value === 'ordered' })}><option value="unordered">Bullets</option><option value="ordered">Numbered</option></select></label>
            <textarea className="block-text" aria-label={`List ${index + 1} items`} placeholder="List items" rows={4} value={block.items.join('\n')} disabled={disabled} onChange={(event) => update(block.id, { items: event.target.value.split('\n') })} />
          </>}
          {block.type === 'image' && <>
            {block.url && <img className="block-image-preview" src={block.url} alt={block.alt || ''} />}
            <label className="admin-btn secondary block-upload"><Upload size={16} /> {uploading === `block:${block.id}` ? 'Uploading...' : block.url ? 'Replace image' : 'Upload image'}<input aria-label={`Image ${index + 1} upload`} type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={disabled} hidden onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; if (file) onUpload(block.id, file); }} /></label>
            {errors?.[`block:${block.id}`] && <p className="admin-error" role="alert">{errors[`block:${block.id}`]}</p>}
            <input className="block-input" aria-label={`Image ${index + 1} URL`} placeholder="Image URL" value={block.url} disabled={disabled} onChange={(event) => update(block.id, { url: event.target.value, width: 0, height: 0 })} />
            <input className="block-input" aria-label={`Image ${index + 1} alt text`} placeholder="Alt text" value={block.alt} disabled={disabled} onChange={(event) => update(block.id, { alt: event.target.value })} />
            <input className="block-input" aria-label={`Image ${index + 1} caption`} placeholder="Caption" value={block.caption} disabled={disabled} onChange={(event) => update(block.id, { caption: event.target.value })} />
          </>}
          {block.type === 'divider' && <hr />}
        </div>
        <InsertBlock position={index + 1} disabled={disabled} onInsert={insert} />
      </div>)}
    </div>
  </section>;
}
