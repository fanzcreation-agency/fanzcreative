import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, Eye, Image as ImageIcon, Layers, Pencil, Plus, RefreshCw, Save, Search, Trash2, Upload, X } from 'lucide-react';
import { auth } from '../lib/firebase';
import { notifyContentChanged } from '../lib/content-events';
import { DEFAULT_END_QUOTE, normalizeSlug, prepareContent, SLUG_PATTERN, sortContent } from '../../shared/content';
import { isFeatured, projectServices } from '../../shared/content-layout';
import { adminRequest } from './apiClient';
import { IMAGE_REQUIREMENTS, gallerySlots, imageRatioError, readImageDimensions } from './imageRequirements';
import CropDialog from './CropDialog';
import BlockEditor from './BlockEditor';
import SitePreview from './SitePreview';
import CommentsPanel from './CommentsPanel';
import AdminShell from './AdminShell';
import AdminOverview from './AdminOverview';
import { articleBlocks, createBlock } from '../../shared/article-blocks';
import { uploadImage, validateImageFile } from './mediaUpload';
import './admin.css';

const EMPTY_POST = {
  slug: '', title: '', excerpt: '', category: '', body: '', blocks: [], coverUrl: '', status: 'draft',
  endQuoteMode: 'default', endQuote: '',
};
const EMPTY_PROJECT = {
  slug: '', title: '', summary: '', industry: '', deliverables: '', details: '',
  detailsContinued: '', research: '', results: '',
  coverUrl: '', galleryUrls: '', status: 'draft',
  featured: false, sortOrder: 0, services: '', projectType: '',
};

function normalizeItem(item, type) {
  const defaults = type === 'posts' ? EMPTY_POST : EMPTY_PROJECT;
  const normalized = { ...defaults, ...item };
  for (const field of Object.keys(defaults)) {
    if (['deliverables', 'galleryUrls', 'featured', 'sortOrder', 'services', 'blocks'].includes(field)) continue;
    if (typeof normalized[field] !== 'string') normalized[field] = defaults[field];
  }
  if (type === 'posts') normalized.blocks = item ? articleBlocks(item) : [createBlock()];
  if (type === 'projects') {
    normalized.deliverables = Array.isArray(item?.deliverables)
      ? item.deliverables.join(', ') : typeof item?.deliverables === 'string' ? item.deliverables : '';
    normalized.galleryUrls = gallerySlots(item?.galleryUrls).join('\n');
    normalized.featured = item ? isFeatured(item) : false;
    normalized.sortOrder = item?.sortOrder ?? 0;
    normalized.services = item ? projectServices(item).join(', ') : '';
  }
  return normalized;
}

function Field({ label, value, onChange, onBlur, multiline = false, rows = 4, required = false, disabled = false, placeholder = '', type = 'text', min, max, step }) {
  const id = useId();
  const props = { id, value: value ?? '', onChange: (event) => onChange(event.target.value), onBlur, required, disabled, placeholder };
  return (
    <div className="admin-field">
      <label htmlFor={id}>{label}</label>
      {multiline ? <textarea {...props} rows={rows} /> : <input {...props} type={type} min={min} max={max} step={step} />}
    </div>
  );
}

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch {
      setError('Sign-in failed. Check your email and password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="admin-root admin-login-page">
      <form className="admin-login" onSubmit={submit}>
        <a className="admin-back" href="/"><ArrowLeft size={17} /> Back to site</a>
        <div className="admin-login-brand"><span className="admin-brand-mark"><Layers size={23} /></span><span>fanz<strong>creative</strong></span></div>
        <h1>Admin sign in</h1>
        <Field label="Email" value={email} onChange={setEmail} required />
        <label className="admin-field"><span>Password</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
        {error && <p className="admin-error" role="alert">{error}</p>}
        <button className="admin-btn primary" disabled={busy} type="submit">{busy ? 'Signing in...' : 'Sign in'}</button>
      </form>
    </main>
  );
}

function formatDate(timestamp) {
  const seconds = timestamp?.seconds ?? timestamp?._seconds;
  return seconds ? new Date(seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
}

function ContentEditor({ type, item, items, onNavigate, onChanged }) {
  const editing = item?.slug || null;
  const [form, setForm] = useState(() => normalizeItem(item, type));
  const manualSlug = useRef(!!editing);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(null);
  const [mediaErrors, setMediaErrors] = useState({});
  const [cropRequest, setCropRequest] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const closePreview = useCallback(() => setPreviewOpen(false), []);
  const cropRef = useRef(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => () => {
    if (cropRef.current) URL.revokeObjectURL(cropRef.current.imageUrl);
  }, []);

  const closeCrop = () => {
    if (cropRef.current) URL.revokeObjectURL(cropRef.current.imageUrl);
    cropRef.current = null;
    setCropRequest(null);
  };

  const update = (key) => (value) => setForm((previous) => ({ ...previous, [key]: value }));
  const updateTitle = (title) => {
    const autoSlug = !editing && !manualSlug.current;
    setForm((previous) => ({ ...previous, title, ...(autoSlug ? { slug: normalizeSlug(title) } : {}) }));
  };
  const updateSlug = (value) => {
    manualSlug.current = value.length > 0;
    update('slug')(normalizeSlug(value, { allowTrailingHyphen: true }));
  };
  const gallery = gallerySlots(form.galleryUrls);
  const updateGallery = (index, value) => setForm((previous) => {
    const urls = gallerySlots(previous.galleryUrls);
    urls[index] = value;
    return { ...previous, galleryUrls: urls.join('\n') };
  });

  const save = async (status) => {
    if (saving || uploading || cropRequest) return;
    const slug = normalizeSlug(form.slug);
    if (!SLUG_PATTERN.test(slug)) {
      setError('Slug must use lowercase letters, numbers and hyphens.');
      return;
    }
    if (items.some((item) => item.slug === slug && item.slug !== editing)) {
      setError('This slug already exists.');
      return;
    }

    setSaving(true);
    setError('');
    setNotice('');
    try {
      const data = prepareContent(type, {
        ...form, status, galleryUrls: gallery,
        deliverables: (form.deliverables || '').split(',').map((value) => value.trim()).filter(Boolean),
        services: (form.services || '').split(',').map((value) => value.trim()).filter(Boolean),
      });
      const result = await adminRequest('/api/admin-content', {
        method: editing ? 'PUT' : 'POST', body: JSON.stringify({ type, slug, originalSlug: editing || slug, data }),
      });
      setForm(normalizeItem(result.item, type));
      onChanged(type, result.item, editing);
      if (!editing || editing !== slug) onNavigate(`/admin/${type}/${slug}`);
      else setNotice(status === 'published' ? 'Published successfully.' : 'Draft saved.');
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (saving || uploading || cropRequest) return;
    if (!editing || !window.confirm(`Archive ${form.title}? It will be removed from the public site.`)) return;
    setSaving(true);
    setError('');
    try {
      const result = await adminRequest('/api/admin-content', {
        method: 'PATCH', body: JSON.stringify({ type, slug: editing, status: 'archived' }),
      });
      onChanged(type, result.item);
      setForm((previous) => ({ ...previous, status: 'archived' }));
      setNotice('Archived. You can restore it as a draft.');
    } catch (archiveError) {
      setError(archiveError.message);
    } finally {
      setSaving(false);
    }
  };

  const commitUpload = async (file, slot, field, galleryIndex) => {
    if (type === 'projects' && !SLUG_PATTERN.test(form.slug.trim())) {
      setError('Enter a valid project slug before uploading.');
      return;
    }
    setUploading(slot);
    try {
      const url = await uploadImage(file, type, form.slug.trim());
      if (galleryIndex === null) setForm((previous) => ({ ...previous, [field]: url }));
      else updateGallery(galleryIndex, url);
      setNotice('Image uploaded. Save the item to keep it.');
    } catch (uploadError) {
      setMediaErrors((previous) => ({ ...previous, [slot]: uploadError.message }));
    } finally {
      setUploading(null);
    }
  };

  const upload = async (event, field, galleryIndex = null) => {
    if (saving || uploading || cropRequest) return;
    const file = event.target.files?.[0];
    if (!file) return;
    const slot = galleryIndex === null ? 'coverUrl' : `gallery${galleryIndex + 1}`;
    const requirement = IMAGE_REQUIREMENTS[slot];
    setMediaErrors((previous) => ({ ...previous, [slot]: '' }));
    setError('');
    setNotice('');
    if (type === 'projects' && !SLUG_PATTERN.test(form.slug.trim())) {
      event.target.value = '';
      setError('Enter a valid project slug before uploading.');
      return;
    }
    setUploading(slot);
    try {
      validateImageFile(file);
      const { width, height } = await readImageDimensions(file);
      const ratioError = imageRatioError(requirement, width, height);
      if (ratioError) {
        const pending = { file, imageUrl: URL.createObjectURL(file), slot, field, galleryIndex, requirement };
        cropRef.current = pending;
        setCropRequest(pending);
        setUploading(null);
        return;
      }
    } catch (validationError) {
      setMediaErrors((previous) => ({ ...previous, [slot]: validationError.message }));
      setUploading(null);
      return;
    } finally {
      event.target.value = '';
    }
    await commitUpload(file, slot, field, galleryIndex);
  };

  const previewUrl = type === 'posts' ? `/blog/single/${editing}` : `/project/${editing}`;
  const uploadBlock = async (id, file) => {
    if (saving || uploading || cropRequest) return;
    const slot = `block:${id}`;
    setUploading(slot);
    setMediaErrors((previous) => ({ ...previous, [slot]: '' }));
    try {
      validateImageFile(file);
      const { width, height } = await readImageDimensions(file);
      const url = await uploadImage(file, 'posts', form.slug.trim());
      setForm((previous) => ({ ...previous, blocks: previous.blocks.map((block) => block.id === id ? { ...block, url, width, height } : block) }));
      setNotice('Image uploaded. Save the item to keep it.');
    } catch (uploadError) {
      setMediaErrors((previous) => ({ ...previous, [slot]: uploadError.message }));
    } finally { setUploading(null); }
  };

  return (
    <div className="admin-editor-page">
      {previewOpen && <SitePreview article={form} onClose={closePreview} />}
      {cropRequest && <CropDialog {...cropRequest} onCancel={closeCrop} onConfirm={(croppedFile) => {
        const { slot, field, galleryIndex } = cropRequest;
        closeCrop();
        commitUpload(croppedFile, slot, field, galleryIndex);
      }} />}
      <div className="admin-editor-topbar">
        <div className="admin-editor-identity"><button className="admin-back-link" onClick={() => onNavigate(`/admin/${type}`)}><ArrowLeft size={16} /> All {type === 'posts' ? 'blogs' : 'projects'}</button><h1>{editing ? 'Edit' : 'New'} {type === 'posts' ? 'blog' : 'project'}</h1></div>
        <div className="admin-heading-actions">
          {editing && form.status === 'published' && <a className="admin-icon-button" href={previewUrl} target="_blank" rel="noreferrer" title="View live" aria-label="View live"><ExternalLink size={17} /></a>}
          {type === 'posts' && <button type="button" className="admin-btn secondary" disabled={saving || !!uploading || !!cropRequest} onClick={() => setPreviewOpen(true)}><Eye size={16} /> Preview article</button>}
          <button className="admin-btn secondary" disabled={saving || !!uploading || !!cropRequest} onClick={() => save('draft')}><Save size={16} /> {form.status === 'published' ? 'Move to draft' : form.status === 'archived' ? 'Restore draft' : 'Save draft'}</button>
          <button className="admin-btn primary" disabled={saving || !!uploading || !!cropRequest} onClick={() => save('published')}>{saving ? 'Saving...' : form.status === 'published' ? 'Update' : 'Publish'}</button>
        </div>
      </div>
      {error && <p className="admin-error admin-editor-feedback" role="alert">{error}</p>}
      {notice && <p className="admin-notice admin-editor-feedback" role="status">{notice}</p>}
      <div className="admin-editor-layout">
        <section className="admin-editor" aria-label="Content editor">
            <fieldset className="admin-fields admin-editor-fields" disabled={saving}>
              <h3>{type === 'posts' ? 'Article details' : 'Project details'}</h3>
              <Field label="Title" value={form.title} onChange={updateTitle} required />
              <Field label="Slug" value={form.slug} onChange={updateSlug} onBlur={() => update('slug')(normalizeSlug(form.slug))} placeholder="lowercase-url-name" required />
              {type === 'posts' ? (
                <>
                  <Field label="Excerpt" value={form.excerpt} onChange={update('excerpt')} multiline rows={3} />
                  <Field label="Category" value={form.category} onChange={update('category')} />
                  <BlockEditor blocks={form.blocks} onChange={update('blocks')} disabled={saving || !!uploading || !!cropRequest} uploading={uploading} errors={mediaErrors} onUpload={uploadBlock} onPreview={() => setPreviewOpen(true)} />
                  <fieldset className="admin-end-quote">
                    <legend>End quote</legend>
                    <div className="admin-quote-options">
                      <label><input type="radio" name="endQuoteMode" value="default" checked={form.endQuoteMode === 'default'} onChange={() => update('endQuoteMode')('default')} /> Default quote</label>
                      <label><input type="radio" name="endQuoteMode" value="custom" checked={form.endQuoteMode === 'custom'} onChange={() => setForm((previous) => ({ ...previous, endQuoteMode: 'custom', endQuote: previous.endQuote || DEFAULT_END_QUOTE }))} /> Custom quote</label>
                    </div>
                    {form.endQuoteMode === 'custom'
                      ? <Field label="Custom end quote" value={form.endQuote} onChange={update('endQuote')} multiline rows={5} required />
                      : <p className="admin-quote-default">{DEFAULT_END_QUOTE}</p>}
                  </fieldset>
                </>
              ) : (
                <>
                  <Field label="Summary" value={form.summary} onChange={update('summary')} multiline rows={3} />
                  <Field label="Industry" value={form.industry} onChange={update('industry')} />
                  <Field label="Project type" value={form.projectType} onChange={update('projectType')} placeholder="Website, Brand identity, Campaign" />
                  <Field label="Services" value={form.services} onChange={update('services')} placeholder="Web design, Branding, Development" />
                  <Field label="Deliverables" value={form.deliverables} onChange={update('deliverables')} placeholder="Branding, Web design, Development" />
                  <Field label="Project details" value={form.details} onChange={update('details')} multiline rows={10} />
                  <Field label="More details" value={form.detailsContinued} onChange={update('detailsContinued')} multiline rows={5} />
                  <Field label="Research" value={form.research} onChange={update('research')} multiline rows={5} />
                  <Field label="Results" value={form.results} onChange={update('results')} multiline rows={5} />
                </>
              )}
            </fieldset>
        </section>
        <aside className="admin-editor-side">
          {type === 'projects' && <fieldset className="admin-side-panel admin-placement" disabled={saving || !!uploading || !!cropRequest}>
            <h3>Placement</h3>
            <label className="admin-checkbox"><input type="checkbox" checked={form.featured} onChange={(event) => update('featured')(event.target.checked)} /> Featured on home</label>
            <Field label="Sort order" type="number" min={0} max={999999} step={1} value={form.sortOrder} onChange={update('sortOrder')} />
            <p className="admin-help">Lower numbers appear first. Home shows up to four published featured projects.</p>
          </fieldset>}
          <div className="admin-side-panel">
            <h3>Document</h3>
            <p className="admin-help">Status: <span className={`admin-status ${form.status}`}>{form.status}</span></p>
            {editing && <p className="admin-help">Last updated: {formatDate(item?.updatedAt)}</p>}
            {editing && form.status !== 'archived' && <button className="admin-archive" disabled={saving || !!uploading || !!cropRequest} onClick={remove}><Trash2 size={15} /> Archive item</button>}
          </div>
          <div className="admin-side-panel">
            <h3>Featured image <span className="admin-optional">Optional</span></h3>
              <p className="admin-help">16:9 ratio, for example 1600 x 900</p>
              <div className="admin-media-row"><h3>Cover image</h3><label className="admin-btn secondary"><Upload size={16} /> {uploading === 'coverUrl' ? 'Uploading...' : 'Upload image'}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={saving || !!uploading || !!cropRequest} onChange={(event) => upload(event, 'coverUrl')} hidden /></label></div>
              {mediaErrors.coverUrl && <p className="admin-error" role="alert">{mediaErrors.coverUrl}</p>}
              <Field label="Cover URL" value={form.coverUrl} onChange={update('coverUrl')} disabled={saving || !!uploading || !!cropRequest} />
              {form.coverUrl && <><img className="admin-image-preview" src={form.coverUrl} alt="Cover preview" /><button className="admin-archive" disabled={saving || !!uploading} onClick={() => update('coverUrl')('')}><X size={15} /> Remove image</button></>}
          </div>
          {type === 'projects' && <div className="admin-side-panel">
            <h3>Project gallery (3 images)</h3>
            {[0, 1, 2].map((index) => {
              const slot = `gallery${index + 1}`;
              const requirement = IMAGE_REQUIREMENTS[slot];
              return <div className="admin-gallery-slot" key={slot}>
                <div className="admin-gallery-slot-heading"><div><strong>Image {index + 1}</strong><small>{requirement.width}:{requirement.height} ratio · {requirement.example}</small></div>{gallery[index] && <button type="button" title={`Remove image ${index + 1}`} disabled={saving || !!uploading || !!cropRequest} onClick={() => updateGallery(index, '')}><X size={16} /></button>}</div>
                {gallery[index] ? <img className="admin-image-preview" src={gallery[index]} alt={`Gallery ${index + 1} preview`} /> : <div className="admin-image-empty"><ImageIcon size={22} /></div>}
                <label className="admin-btn secondary"><Upload size={15} /> {uploading === slot ? 'Uploading...' : gallery[index] ? 'Replace image' : 'Upload image'}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={saving || !!uploading || !!cropRequest} onChange={(event) => upload(event, 'galleryUrls', index)} hidden /></label>
                {mediaErrors[slot] && <p className="admin-error" role="alert">{mediaErrors[slot]}</p>}
              </div>;
            })}
          </div>}
        </aside>
      </div>
    </div>
  );
}

function ContentList({ type, items, loading, error, onNavigate, onRefresh }) {
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const filtered = items.filter((item) => (status === 'all' || item.status === status)
    && `${item.title} ${item.slug} ${item.category || item.industry || ''} ${item.projectType || ''} ${(item.services || []).join(' ')}`.toLowerCase().includes(search.toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(filtered.length / 20));
  const currentPage = Math.min(page, pageCount);
  const visibleItems = filtered.slice((currentPage - 1) * 20, currentPage * 20);
  const label = type === 'posts' ? 'Blogs' : 'Projects';

  return (
    <div className="admin-content-page">
      <div className="admin-page-heading"><div><h1>{label} <span className="admin-heading-count">{items.length}</span></h1></div><button className="admin-btn primary" onClick={() => onNavigate(`/admin/${type}/new`)}><Plus size={17} /> Add new</button></div>
      {error && <p className="admin-error" role="alert">{error}</p>}
      <div className="admin-list-toolbar">
        <div className="admin-filters" aria-label="Filter by status">{['all', 'published', 'draft', 'archived'].map((value) => <button key={value} className={status === value ? 'active' : ''} aria-pressed={status === value} onClick={() => { setStatus(value); setPage(1); }}>{value === 'all' ? 'All' : value[0].toUpperCase() + value.slice(1)} <span>{value === 'all' ? items.length : items.filter((item) => item.status === value).length}</span></button>)}</div>
        <div className="admin-toolbar-tools"><label className="admin-search"><Search size={17} /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={`Search ${label.toLowerCase()}`} aria-label={`Search ${label.toLowerCase()}`} /></label><button className="admin-icon-button" onClick={onRefresh} title="Refresh content"><RefreshCw size={17} /></button></div>
      </div>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>{type === 'posts' ? 'Article' : 'Project'}</th><th>Status</th><th>{type === 'posts' ? 'Category' : 'Industry'}</th><th>Updated</th><th className="admin-table-action">Actions</th></tr></thead><tbody>
        {visibleItems.map((item) => <tr key={item.slug}><td><div className="admin-table-title"><div className="admin-thumbnail">{item.coverUrl ? <img src={item.coverUrl} alt="" loading="lazy" /> : <ImageIcon size={19} />}</div><div><button className="admin-title-button" onClick={() => onNavigate(`/admin/${type}/${item.slug}`)}>{item.title || item.slug}</button><small>/{item.slug}{type === 'projects' && isFeatured(item) ? ' · Featured' : ''}</small></div></div></td><td><span className={`admin-status ${item.status || 'draft'}`}>{item.status || 'draft'}</span></td><td>{item.category || item.industry || '—'}</td><td>{formatDate(item.updatedAt)}</td><td><div className="admin-row-actions"><button title={`Edit ${item.title || item.slug}`} aria-label="Edit" onClick={() => onNavigate(`/admin/${type}/${item.slug}`)}><Pencil size={16} /></button>{item.status === 'published' && <a href={type === 'posts' ? `/blog/single/${item.slug}` : `/project/${item.slug}`} target="_blank" rel="noreferrer" title="View live page" aria-label="View live page"><ExternalLink size={16} /></a>}</div></td></tr>)}
        {!loading && filtered.length === 0 && <tr><td colSpan="5" className="admin-empty">{items.length ? 'No matching items.' : `No ${label.toLowerCase()} yet. Add your first one to get started.`}</td></tr>}
        {loading && <tr><td colSpan="5" className="admin-empty">Loading content...</td></tr>}
      </tbody></table></div>
      {filtered.length > 20 && <div className="admin-pagination"><button className="admin-icon-button" title="Previous" aria-label="Previous" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={17} /></button><span role="status">Page {currentPage} of {pageCount} · {filtered.length} items</span><button className="admin-icon-button" title="Next" aria-label="Next" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}><ChevronRight size={17} /></button></div>}
    </div>
  );
}

function AdminDashboard({ email }) {
  const navigate = useNavigate();
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);
  const type = ['posts', 'projects'].includes(segments[1]) ? segments[1] : null;
  const isComments = segments[1] === 'comments';
  const slug = type ? segments[2] : null;
  const [content, setContent] = useState({ posts: [], projects: [] });
  const [loading, setLoading] = useState({ posts: true, projects: true });
  const [errors, setErrors] = useState({ posts: '', projects: '' });
  const loadRevision = useRef(0);
  const [commentCounts, setCommentCounts] = useState(null);

  useEffect(() => {
    if (isComments) return;
    const controller = new AbortController();
    const refresh = () => adminRequest('/api/admin-comments?summary=1', { signal: controller.signal })
      .then((result) => { if (!controller.signal.aborted) setCommentCounts(result.counts); })
      .catch(() => {});
    refresh(); window.addEventListener('focus', refresh);
    return () => { controller.abort(); window.removeEventListener('focus', refresh); };
  }, [isComments]);

  const loadContent = useCallback(async (signal) => {
    const revision = ++loadRevision.current;
    try {
      const result = await adminRequest('/api/admin-content', { signal });
      if (signal?.aborted || revision !== loadRevision.current) return;
      if (!Array.isArray(result.content?.posts) || !Array.isArray(result.content?.projects)) throw new Error('Content could not be loaded. Please refresh.');
      setContent(result.content);
      setErrors({ posts: '', projects: '' });
    } catch (loadError) {
      if (signal?.aborted || revision !== loadRevision.current) return;
      setErrors({ posts: loadError.message, projects: loadError.message });
    } finally {
      if (!signal?.aborted && revision === loadRevision.current) setLoading({ posts: false, projects: false });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => { if (!controller.signal.aborted) loadContent(controller.signal); });
    const refresh = () => loadContent(controller.signal);
    window.addEventListener('focus', refresh);
    return () => { controller.abort(); window.removeEventListener('focus', refresh); };
  }, [loadContent]);

  const contentChanged = (kind, savedItem, previousSlug) => {
    ++loadRevision.current;
    setContent((previous) => ({ ...previous, [kind]: sortContent([savedItem, ...previous[kind].filter((entry) => entry.slug !== savedItem.slug && entry.slug !== previousSlug)]) }));
    setLoading((previous) => ({ ...previous, [kind]: false }));
    notifyContentChanged(kind);
  };

  const selectedItem = slug && slug !== 'new' ? content[type].find((item) => item.slug === slug) : null;

  return (
    <AdminShell email={email} type={type} slug={slug} isComments={isComments} content={content} commentCounts={commentCounts} onNavigate={navigate} onSignOut={() => signOut(auth)}>
        {isComments && <CommentsPanel posts={content.posts} onCountsChanged={setCommentCounts} />}
        {!type && !isComments && <AdminOverview content={content} loading={loading} errors={errors} commentCounts={commentCounts} onNavigate={navigate} onRefresh={() => loadContent()} />}
        {type && !slug && <ContentList key={type} type={type} items={content[type]} loading={loading[type]} error={errors[type]} onNavigate={navigate} onRefresh={() => loadContent()} />}
        {type && slug && (slug === 'new' || selectedItem ? <ContentEditor key={`${type}:${slug}`} type={type} item={selectedItem} items={content[type]} onNavigate={navigate} onChanged={contentChanged} /> : <div className="admin-content-page">{errors[type] && <p className="admin-error" role="alert">{errors[type]}</p>}<p className="admin-muted">{loading[type] ? 'Loading content...' : 'Content not found.'}</p><button className="admin-btn secondary" onClick={() => navigate(`/admin/${type}`)}>Back to list</button></div>)}
    </AdminShell>
  );
}

function AdminApp() {
  const [session, setSession] = useState({ state: 'loading', user: null });

  useEffect(() => {
    let active = true;
    let revision = 0;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
    const currentRevision = ++revision;
    if (!user) {
      setSession({ state: 'signed-out', user: null });
      return;
    }
    try {
      const token = await user.getIdTokenResult();
      if (active && currentRevision === revision) setSession({ state: token.claims.admin === true ? 'admin' : 'denied', user });
    } catch {
      if (active && currentRevision === revision) setSession({ state: 'error', user });
    }
    });
    return () => { active = false; unsubscribe(); };
  }, []);

  if (session.state === 'loading') return <main className="admin-root admin-loading">Checking access...</main>;
  if (session.state === 'signed-out') return <AdminLogin />;
  if (session.state === 'error') return <main className="admin-root admin-denied"><h1>Could not verify your session</h1><p>Check your connection and try again.</p><button className="admin-btn primary" onClick={() => window.location.reload()}>Retry</button><button className="admin-btn secondary" onClick={() => signOut(auth)}>Sign out</button></main>;
  if (session.state === 'denied') {
    return <main className="admin-root admin-denied"><h1>Access denied</h1><p>This account does not have admin access.</p><button className="admin-btn secondary" onClick={() => signOut(auth)}>Sign out</button></main>;
  }
  return <AdminDashboard email={session.user.email} />;
}

export default AdminApp;
