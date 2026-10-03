import { useCallback, useEffect, useRef, useState } from 'react';
import { Copy, ExternalLink, Image, LoaderCircle, RefreshCw, Search, Trash2, Upload } from 'lucide-react';
import { adminRequest } from './apiClient';
import { uploadImage } from './mediaUpload';
import AdminDialog from './AdminDialog';
import './WorkspaceTools.css';

function thumbnail(url) { return url.replace('/image/upload/', '/image/upload/c_limit,w_480,h_360,f_auto,q_auto/'); }
function size(bytes) { return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`; }

function MediaDetails({ item, onClose, onDeleted }) {
  const [usage, setUsage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    adminRequest(`/api/admin-media?publicId=${encodeURIComponent(item.publicId)}`, { signal: controller.signal })
      .then((result) => { if (!Array.isArray(result.usage)) throw new Error('Image references could not be checked. Please reopen the image.'); if (!controller.signal.aborted) setUsage(result.usage); })
      .catch((error) => { if (!controller.signal.aborted) setError(error.message); });
    return () => controller.abort();
  }, [item.publicId]);
  const remove = async () => {
    setBusy(true); setError('');
    try { await adminRequest('/api/admin-media', { method: 'DELETE', body: JSON.stringify({ publicId: item.publicId }) }); onDeleted(item); }
    catch (error) { setError(error.message); }
    finally { setBusy(false); }
  };
  return <AdminDialog title="Image details" busy={busy} onClose={onClose} className="admin-media-dialog">
    <div className="admin-media-details"><div className="admin-media-full-image"><img src={item.url} alt={item.name} /></div><div className="admin-media-info"><h3>{item.name}</h3><dl><dt>Dimensions</dt><dd>{item.width} x {item.height}</dd><dt>File</dt><dd>{item.format.toUpperCase()} / {size(item.bytes)}</dd><dt>Uploaded</dt><dd>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}</dd><dt>Folder</dt><dd>{item.folder}</dd></dl><label className="admin-field">Image URL<input readOnly value={item.url} onFocus={(event) => event.target.select()} /></label>
      <div className="admin-heading-actions"><button className="admin-btn secondary" type="button" onClick={async () => { try { await navigator.clipboard.writeText(item.url); setNotice('Image URL copied.'); } catch { setError('Could not copy. Select the image URL to copy it.'); } }}><Copy size={15} />Copy URL</button><a className="admin-btn secondary" href={item.url} target="_blank" rel="noreferrer"><ExternalLink size={15} />Original</a></div>
      <h3>Used in</h3>{usage === null ? <p className="admin-help">Checking references...</p> : usage.length ? <ul className="admin-media-usage">{usage.map((entry, index) => <li key={index}>{entry.type === 'website' ? entry.title : <a href={`/admin/${entry.type}/${entry.slug}`}>{entry.title}</a>}</li>)}</ul> : <p className="admin-help">No saved content references.</p>}
      <button type="button" className="admin-btn danger" disabled={busy || usage === null || usage.length > 0} onClick={() => setConfirm(true)}><Trash2 size={15} />Delete image</button>
      {confirm && <div className="admin-delete-confirm"><p>Permanently delete this image?</p><div className="admin-heading-actions"><button type="button" className="admin-btn secondary" disabled={busy} onClick={() => setConfirm(false)}>Cancel</button><button type="button" className="admin-btn danger" disabled={busy} onClick={remove}>{busy ? 'Deleting...' : 'Delete permanently'}</button></div></div>}
    </div></div>{error && <p className="admin-error" role="alert">{error}</p>}{notice && <p className="admin-notice" role="status">{notice}</p>}
  </AdminDialog>;
}

export default function MediaLibrary({ onSelect }) {
  const [items, setItems] = useState([]);
  const [folder, setFolder] = useState('all');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selected, setSelected] = useState(null);
  const pending = useRef(null);
  const uploadInput = useRef(null);
  const load = useCallback(async (nextCursor = null) => {
    pending.current?.abort();
    const controller = new AbortController(); pending.current = controller;
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ folder, ...(query ? { q: query } : {}), ...(nextCursor ? { cursor: nextCursor } : {}) });
      const result = await adminRequest(`/api/admin-media?${params}`, { signal: controller.signal });
      if (!Array.isArray(result.items)) throw new Error('Images could not be loaded. Please refresh.');
      if (!controller.signal.aborted) { setItems((previous) => nextCursor ? [...new Map([...previous, ...result.items].map((item) => [item.id, item])).values()] : result.items); setCursor(result.nextCursor); }
    } catch (error) { if (!controller.signal.aborted) setError(error.message); }
    finally { if (!controller.signal.aborted) setLoading(false); }
  }, [folder, query]);
  useEffect(() => { let active = true; queueMicrotask(() => { if (active) load(); }); return () => { active = false; pending.current?.abort(); }; }, [load]);
  const upload = async (event) => {
    const files = [...event.target.files]; event.target.value = '';
    if (!files.length) return;
    setUploading(true); setError(''); setNotice('');
    let count = 0;
    let failure = '';
    try { for (const file of files) { await uploadImage(file, 'assets'); count++; } setNotice(`${count} image${count === 1 ? '' : 's'} uploaded.`); }
    catch (error) { failure = `${count ? `${count} images uploaded. ` : ''}${error.message}`; }
    finally { setUploading(false); if (count) { await load(); } if (failure) setError(failure); }
  };
  return <section className={`admin-content-page${onSelect ? ' admin-library-picker' : ''}`}>
    <div className="admin-page-heading"><h1>Media Library</h1><div className="admin-heading-actions"><button type="button" className="admin-icon-button" title="Refresh media" aria-label="Refresh media" disabled={loading || uploading} onClick={() => load()}><RefreshCw size={17} /></button>{!onSelect && <><button type="button" className="admin-btn primary" disabled={uploading || loading} onClick={() => uploadInput.current.click()}><Upload size={16} />{uploading ? 'Uploading...' : 'Upload images'}</button><input ref={uploadInput} aria-label="Upload library images" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden disabled={uploading || loading} onChange={upload} /></>}</div></div>
    {error && <p className="admin-error" role="alert">{error}</p>}{notice && <p className="admin-notice" role="status">{notice}</p>}
    <div className="admin-list-toolbar"><label className="admin-tool-select">Folder<select aria-label="Media folder" value={folder} disabled={uploading} onChange={(event) => { setItems([]); setFolder(event.target.value); }}>{[['all', 'All images'], ['blog', 'Blogs'], ['projects', 'Projects'], ['assets', 'Site assets']].map(([value, title]) => <option key={value} value={value}>{title}</option>)}</select></label><form className="admin-media-search" onSubmit={(event) => { event.preventDefault(); setQuery(search.trim()); }}><label className="admin-search"><Search size={16} /><input aria-label="Search media" placeholder="Search images" maxLength={100} value={search} disabled={uploading} onChange={(event) => setSearch(event.target.value)} /></label><button type="submit" className="admin-icon-button" title="Search images" aria-label="Search images" disabled={uploading}><Search size={16} /></button></form></div>
    <div className="admin-media-grid" aria-busy={loading}>{items.map((item) => <button type="button" className="admin-media-tile" key={item.id} onClick={() => onSelect ? onSelect(item) : setSelected(item)}><div className="admin-media-thumb"><img src={thumbnail(item.url)} alt="" loading="lazy" /></div><strong>{item.name}</strong><small>{item.width} x {item.height} <span>{item.format.toUpperCase()}</span></small></button>)}</div>
    {loading && <div className="admin-empty-state compact" role="status"><LoaderCircle size={23} className="admin-spin" />Loading images...</div>}{!loading && !items.length && <div className="admin-empty-state"><Image size={30} /><h3>No matching images</h3></div>}
    {items.length > 0 && <div className="admin-pagination"><span>{items.length} images loaded</span>{cursor && <button type="button" className="admin-btn secondary" disabled={loading || uploading} onClick={() => load(cursor)}>Load more</button>}</div>}
    {selected && <MediaDetails key={selected.id} item={selected} onClose={() => setSelected(null)} onDeleted={(item) => { setItems((previous) => previous.filter((entry) => entry.id !== item.id)); setSelected(null); setNotice('Image deleted.'); }} />}
  </section>;
}
