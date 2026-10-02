import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, MessageSquare, RefreshCw, Search, X } from 'lucide-react';
import { COMMENT_STATUSES, discussionKey } from '../../shared/comments';
import { contentSeconds } from '../../shared/content';
import { adminRequest } from './apiClient';
import { notifyContentChanged } from '../lib/content-events';
import './CommentsPanel.css';

function CommentDialog({ comment, mode, busy, error, onClose, onSave }) {
  const ref = useRef(null);
  const [form, setForm] = useState({ name: comment.name, email: comment.email, message: mode === 'reply' ? '' : comment.message });
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus = document.activeElement;
    dialog.showModal();
    return () => { dialog.close(); previousFocus?.focus(); };
  }, []);
  return <dialog ref={ref} className="admin-comment-dialog" aria-label={mode === 'reply' ? 'Reply to comment' : 'Edit comment'} onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
    <div className="admin-comment-dialog-header"><h2>{mode === 'reply' ? `Reply to ${comment.name}` : 'Edit comment'}</h2><button type="button" aria-label="Close comment dialog" title="Close" disabled={busy} onClick={onClose}><X size={19} /></button></div>
    {mode === 'reply' && <blockquote>{comment.message}</blockquote>}
    {error && <p className="admin-error" role="alert">{error}</p>}
    <form onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
      <fieldset disabled={busy} className="admin-comment-fields">
        {mode === 'edit' && comment.authorType !== 'admin' && <><label className="admin-field">Author name<input value={form.name} required minLength={2} maxLength={80} onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))} /></label><label className="admin-field">Author email<input type="email" value={form.email} required maxLength={254} onChange={(event) => setForm((previous) => ({ ...previous, email: event.target.value }))} /></label></>}
        <label className="admin-field">{mode === 'reply' ? 'Reply' : 'Comment text'}<textarea rows={8} required minLength={3} maxLength={5000} autoFocus value={form.message} onChange={(event) => setForm((previous) => ({ ...previous, message: event.target.value }))} /></label>
        <div className="admin-actions"><button type="button" className="admin-btn secondary" onClick={onClose}>Cancel</button><button type="submit" className="admin-btn primary">{busy ? 'Saving...' : mode === 'reply' ? 'Publish reply' : 'Save changes'}</button></div>
      </fieldset>
    </form>
  </dialog>;
}

export default function CommentsPanel({ posts, onCountsChanged }) {
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, spam: 0, trash: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [status, setStatus] = useState('pending');
  const [search, setSearch] = useState('');
  const [postFilter, setPostFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('approved');
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [dialogError, setDialogError] = useState('');
  const pending = useRef(null);
  const replySubmission = useRef(null);
  const load = useCallback(async () => {
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    setLoading(true); setError('');
    try {
      const result = await adminRequest('/api/admin-comments', { signal: controller.signal });
      if (!Array.isArray(result.items)) throw new Error('Comments could not be loaded. Please try again.');
      if (!controller.signal.aborted) { setItems(result.items); setCounts(result.counts); onCountsChanged(result.counts); }
    } catch (error) { if (!controller.signal.aborted) setError(error.message); }
    finally { if (!controller.signal.aborted) setLoading(false); }
  }, [onCountsChanged]);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => { if (active) load(); });
    window.addEventListener('focus', load);
    return () => { active = false; pending.current?.abort(); window.removeEventListener('focus', load); };
  }, [load]);

  const change = async (method, body, message) => {
    if (busy) return;
    setBusy(true); setError(''); setNotice(''); setDialogError('');
    try {
      await adminRequest('/api/admin-comments', { method, body: JSON.stringify(body) });
      setDialog(null); setSelected([]); setNotice(message);
      notifyContentChanged('comments'); await load();
    } catch (error) { if (dialog) setDialogError(error.message); else setError(error.message); }
    finally { setBusy(false); }
  };
  const openDialog = (comment, mode) => { setDialog({ comment, mode }); setDialogError(''); replySubmission.current = { id: crypto.randomUUID(), signature: null }; };
  const saveDialog = (data) => {
    if (dialog.mode === 'edit') return change('PUT', { id: dialog.comment.id, data }, 'Comment updated.');
    const signature = data.message.trim();
    if (replySubmission.current.signature !== signature) replySubmission.current = { id: crypto.randomUUID(), signature };
    return change('POST', { id: dialog.comment.id, message: data.message, submissionId: replySubmission.current.id }, 'Reply published.');
  };
  const postMap = new Map(posts.map((post) => [discussionKey(post), post]));
  const filtered = items.filter((item) => (status === 'all' || item.status === status)
    && (!postFilter || item.discussionId === postFilter)
    && `${item.name} ${item.email} ${item.message} ${postMap.get(item.discussionId)?.title || item.postTitle}`.toLowerCase().includes(search.toLowerCase()));
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / 20)));
  const visible = filtered.slice((currentPage - 1) * 20, currentPage * 20);
  const articleOptions = [...new Map(items.map((item) => [item.discussionId, postMap.get(item.discussionId)?.title || item.postTitle])).entries()];
  const allVisibleSelected = visible.length > 0 && visible.every((item) => selected.includes(item.id));
  const resetFilter = () => { setPage(1); setSelected([]); };
  return <div className="admin-content-page admin-comments-page">
    <div className="admin-page-heading"><div><h1>Comments <span className="admin-heading-count">{items.length}</span></h1></div><button type="button" className="admin-icon-button" title="Refresh comments" aria-label="Refresh comments" disabled={busy || loading} onClick={load}><RefreshCw size={17} /></button></div>
    {error && <p className="admin-error" role="alert">{error}</p>}{notice && <p className="admin-notice" role="status">{notice}</p>}
    <div className="admin-list-toolbar"><div className="admin-filters" aria-label="Comment status">{['all', ...COMMENT_STATUSES].map((value) => <button key={value} type="button" className={status === value ? 'active' : ''} aria-pressed={status === value} disabled={busy} onClick={() => { setStatus(value); resetFilter(); }}>{value === 'all' ? 'All' : value[0].toUpperCase() + value.slice(1)} <span>{value === 'all' ? items.length : counts[value]}</span></button>)}</div><label className="admin-search"><Search size={17} /><input value={search} placeholder="Search comments" aria-label="Search comments" disabled={busy} onChange={(event) => { setSearch(event.target.value); resetFilter(); }} /></label></div>
    <div className="admin-comment-controls"><label>Article<select aria-label="Filter comments by article" value={postFilter} disabled={busy} onChange={(event) => { setPostFilter(event.target.value); resetFilter(); }}><option value="">All articles</option>{articleOptions.map(([key, title]) => <option value={key} key={key}>{title}</option>)}</select></label><div className="admin-comment-bulk"><select aria-label="Bulk comment action" value={bulkStatus} disabled={busy} onChange={(event) => setBulkStatus(event.target.value)}>{COMMENT_STATUSES.map((value) => <option value={value} key={value}>{value === 'approved' ? 'Approve' : value === 'pending' ? 'Move to pending' : value === 'spam' ? 'Mark as spam' : 'Move to trash'}</option>)}</select><button type="button" className="admin-btn secondary" disabled={busy || !selected.length} onClick={() => change('PATCH', { ids: selected, status: bulkStatus }, `${selected.length} comments updated.`)}><Check size={16} />Apply{selected.length > 0 && ` (${selected.length})`}</button></div></div>
    <div className="admin-table-wrap"><table className="admin-table admin-comments-table"><thead><tr><th><input type="checkbox" aria-label="Select visible comments" checked={allVisibleSelected} disabled={busy || !visible.length} onChange={(event) => setSelected(event.target.checked ? visible.map((item) => item.id) : [])} /></th><th>Author</th><th>Comment</th><th>Article</th></tr></thead><tbody>{visible.map((comment) => {
      const post = postMap.get(comment.discussionId);
      const seconds = contentSeconds(comment.createdAt);
      return <tr key={comment.id} data-comment-id={comment.id}><td><input type="checkbox" aria-label={`Select comment ${comment.id}`} disabled={busy} checked={selected.includes(comment.id)} onChange={(event) => setSelected((previous) => event.target.checked ? [...previous, comment.id] : previous.filter((id) => id !== comment.id))} /></td><td><strong>{comment.name}</strong>{comment.authorType === 'admin' ? <small>FanzCreative Team</small> : <small>{comment.email}</small>}<small>{seconds ? new Date(seconds * 1000).toLocaleString('en-US') : ''}</small></td><td><span className={`admin-status ${comment.status}`}>{comment.status}</span>{comment.parentId && <small className="admin-comment-parent">In reply to {items.find((item) => item.id === comment.parentId)?.name || 'a removed comment'}</small>}<p className="admin-comment-text">{comment.message}</p><div className="admin-comment-row-actions">
        {comment.status !== 'approved' && comment.status !== 'trash' && <button type="button" disabled={busy} onClick={() => change('PATCH', { id: comment.id, status: 'approved' }, 'Comment approved.')}>Approve</button>}
        {comment.status === 'approved' && <button type="button" disabled={busy} onClick={() => change('PATCH', { id: comment.id, status: 'pending' }, 'Comment moved to pending.')}>Unapprove</button>}
        {comment.status !== 'trash' && <button type="button" disabled={busy} onClick={() => openDialog(comment, 'edit')}>Edit</button>}
        {comment.status === 'approved' && !comment.parentId && <button type="button" disabled={busy} onClick={() => openDialog(comment, 'reply')}>Reply</button>}
        {comment.status !== 'spam' && comment.status !== 'trash' && <button type="button" disabled={busy} onClick={() => change('PATCH', { id: comment.id, status: 'spam' }, 'Comment marked as spam.')}>Spam</button>}
        {comment.status === 'spam' && <button type="button" disabled={busy} onClick={() => change('PATCH', { id: comment.id, status: 'pending' }, 'Comment restored to pending.')}>Not spam</button>}
        {comment.status !== 'trash' ? <button type="button" disabled={busy} className="danger" onClick={() => change('PATCH', { id: comment.id, status: 'trash' }, 'Comment moved to trash.')}>Trash</button> : <><button type="button" disabled={busy} onClick={() => change('PATCH', { id: comment.id, status: 'pending' }, 'Comment restored to pending.')}>Restore</button><button type="button" disabled={busy} className="danger" onClick={() => { if (window.confirm('Permanently delete this comment and its replies? This cannot be undone.')) change('DELETE', { id: comment.id }, 'Comment and replies permanently deleted.'); }}>Delete permanently</button></>}
      </div></td><td><a href={`/blog/single/${post?.slug || comment.postSlug}`} target="_blank" rel="noreferrer">{post?.title || comment.postTitle}</a><small>{post?.status && post.status !== 'published' ? post.status : ''}</small></td></tr>;
    })}{loading && !items.length && <tr><td colSpan={4} className="admin-empty">Loading comments...</td></tr>}{!loading && !visible.length && <tr><td colSpan={4} className="admin-empty"><MessageSquare size={20} /> No matching comments.</td></tr>}</tbody></table></div>
    {filtered.length > 20 && <div className="admin-pagination"><button type="button" className="admin-icon-button" title="Previous" aria-label="Previous" disabled={currentPage === 1 || busy} onClick={() => { setPage(currentPage - 1); setSelected([]); }}><ChevronLeft size={17} /></button><span>Page {currentPage} of {Math.ceil(filtered.length / 20)} · {filtered.length} comments</span><button type="button" className="admin-icon-button" title="Next" aria-label="Next" disabled={currentPage * 20 >= filtered.length || busy} onClick={() => { setPage(currentPage + 1); setSelected([]); }}><ChevronRight size={17} /></button></div>}
    {dialog && <CommentDialog {...dialog} busy={busy} error={dialogError} onClose={() => setDialog(null)} onSave={saveDialog} />}
  </div>;
}
