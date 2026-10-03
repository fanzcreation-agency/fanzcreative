import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Copy, Eye, EyeOff, KeyRound, Mail, Pencil, Plus, RefreshCw, Search, ShieldCheck, Trash2, UserRound } from 'lucide-react';
import { adminRequest } from './apiClient';
import AdminDialog from './AdminDialog';
import './WorkspaceTools.css';

function UserEditor({ item, currentUid, busy, error, onClose, onSave }) {
  const [form, setForm] = useState({ email: item?.email || '', displayName: item?.displayName || '', admin: item?.admin ?? true, disabled: item?.disabled || false, password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const update = (field, value) => setForm((previous) => ({ ...previous, [field]: value }));
  const self = item?.uid === currentUid;
  const generate = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    const bytes = crypto.getRandomValues(new Uint8Array(20));
    update('password', Array.from(bytes, (value) => chars[value % chars.length]).join('')); setShowPassword(true);
  };
  return <AdminDialog title={item ? 'Edit user' : 'Add user'} busy={busy} onClose={onClose}>
    {error && <p className="admin-error" role="alert">{error}</p>}
    <form onSubmit={(event) => { event.preventDefault(); onSave(form); }}><fieldset className="admin-tool-fields" disabled={busy}>
      <label className="admin-field">Full name<input autoFocus required maxLength={100} autoComplete="name" value={form.displayName} onChange={(event) => update('displayName', event.target.value)} /></label>
      <label className="admin-field">Email address<input type="email" required maxLength={254} autoComplete="off" value={form.email} onChange={(event) => update('email', event.target.value)} /></label>
      {!item && <label className="admin-field">Initial password<div className="admin-password-field"><input aria-label="Initial password" type={showPassword ? 'text' : 'password'} required minLength={12} maxLength={128} autoComplete="new-password" value={form.password} onChange={(event) => update('password', event.target.value)} /><button type="button" className="admin-icon-button" title={showPassword ? 'Hide password' : 'Show password'} aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div><button type="button" className="admin-btn secondary" onClick={generate}><KeyRound size={15} />Generate password</button></label>}
      <label className="admin-field">Role<select aria-label="Role" value={form.admin ? 'admin' : 'user'} disabled={self} onChange={(event) => update('admin', event.target.value === 'admin')}><option value="admin">Administrator</option><option value="user">User (no admin access)</option></select></label>
      <label className="admin-checkbox"><input type="checkbox" checked={form.disabled} disabled={self} onChange={(event) => update('disabled', event.target.checked)} />Disable account</label>
      <div className="admin-actions"><button type="button" className="admin-btn secondary" onClick={onClose}>Cancel</button><button type="submit" className="admin-btn primary">{busy ? 'Saving...' : item ? 'Save changes' : 'Create user'}</button></div>
    </fieldset></form>
  </AdminDialog>;
}

export default function UsersPanel({ currentUid }) {
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [dialogError, setDialogError] = useState('');
  const [notice, setNotice] = useState('');
  const [dialog, setDialog] = useState(null);
  const [resetUrl, setResetUrl] = useState('');
  const pending = useRef(null);
  const resetSubmission = useRef(null);
  const mutationLock = useRef(false);
  const load = useCallback(async (nextCursor = null) => {
    pending.current?.abort(); const controller = new AbortController(); pending.current = controller;
    setLoading(true); setError('');
    try {
      const result = await adminRequest(`/api/admin-users${nextCursor ? `?cursor=${encodeURIComponent(nextCursor)}` : ''}`, { signal: controller.signal });
      if (!Array.isArray(result.items)) throw new Error('Users could not be loaded. Please refresh.');
      if (!controller.signal.aborted) { setItems((previous) => nextCursor ? [...new Map([...previous, ...result.items].map((item) => [item.uid, item])).values()] : result.items); setCursor(result.nextCursor); }
    } catch (error) { if (!controller.signal.aborted) setError(error.message); }
    finally { if (!controller.signal.aborted) setLoading(false); }
  }, []);
  useEffect(() => { let active = true; queueMicrotask(() => { if (active) load(); }); return () => { active = false; pending.current?.abort(); }; }, [load]);
  const change = async (method, body, message) => {
    if (mutationLock.current) return;
    mutationLock.current = true;
    setBusy(true); setDialogError(''); setError(''); setNotice('');
    try {
      const result = await adminRequest('/api/admin-users', { method, body: JSON.stringify(body), ...(body.action === 'send-password-reset' ? { timeoutMs: 55000 } : {}) });
      if (result.resetUrl) { setResetUrl(result.resetUrl); return; }
      if (result.emailSent) { setDialog(null); setResetUrl(''); setNotice(`Password-reset email sent to ${result.email}.`); return; }
      setItems((previous) => result.item ? [result.item, ...previous.filter((item) => item.uid !== result.item.uid)] : previous.filter((item) => item.uid !== body.uid));
      setDialog(null); setNotice(message);
    } catch (error) { setDialogError(error.message); }
    finally { setBusy(false); mutationLock.current = false; }
  };
  const open = (mode, item = null) => { resetSubmission.current = crypto.randomUUID(); setDialog({ mode, item }); setDialogError(''); setResetUrl(''); };
  const filtered = items.filter((item) => (filter === 'all' || (filter === 'admin' ? item.admin : item.disabled)) && `${item.email} ${item.displayName}`.toLowerCase().includes(search.toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(filtered.length / 20));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * 20, currentPage * 20);
  return <section className="admin-content-page">
    <div className="admin-page-heading"><h1>Users <span className="admin-heading-count">{items.length}</span></h1><div className="admin-heading-actions"><button type="button" className="admin-icon-button" title="Refresh users" aria-label="Refresh users" disabled={busy || loading} onClick={() => load()}><RefreshCw size={17} /></button><button type="button" className="admin-btn primary" disabled={busy || loading} onClick={() => open('edit')}><Plus size={16} />Add user</button></div></div>
    {error && <p className="admin-error" role="alert">{error}</p>}{notice && <p className="admin-notice" role="status">{notice}</p>}
    <div className="admin-list-toolbar"><div className="admin-filters">{[['all', 'All users'], ['admin', 'Administrators'], ['disabled', 'Disabled']].map(([value, label]) => <button type="button" className={filter === value ? 'active' : ''} aria-pressed={filter === value} key={value} onClick={() => { setFilter(value); setPage(1); }}>{label}</button>)}</div><label className="admin-search"><Search size={16} /><input aria-label="Search users" placeholder="Search users" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></label></div>
    <div className="admin-table-wrap"><table className="admin-table admin-users-table"><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Last sign-in</th><th>Actions</th></tr></thead><tbody>{visible.map((item) => <tr key={item.uid} data-user-id={item.uid}><td><div className="admin-table-title"><span className="admin-avatar">{(item.displayName || item.email || 'U')[0].toUpperCase()}</span><div><strong>{item.displayName || 'Unnamed user'}{item.uid === currentUid ? ' (you)' : ''}</strong><small>{item.email}</small></div></div></td><td><span className="admin-user-role">{item.admin ? <ShieldCheck size={15} /> : <UserRound size={15} />}{item.admin ? 'Administrator' : 'User'}</span></td><td><span className={`admin-status ${item.disabled ? 'archived' : 'published'}`}>{item.disabled ? 'Disabled' : 'Active'}</span></td><td>{item.lastSignIn ? new Date(item.lastSignIn).toLocaleDateString() : 'Never'}</td><td><div className="admin-row-actions"><button type="button" title="Edit user" aria-label={`Edit ${item.email}`} disabled={busy} onClick={() => open('edit', item)}><Pencil size={16} /></button><button type="button" title="Password reset" aria-label={`Reset password for ${item.email}`} disabled={busy || item.disabled || !item.email} onClick={() => open('reset', item)}><KeyRound size={16} /></button><button type="button" title={item.uid === currentUid ? 'Your account cannot be deleted' : 'Delete user'} aria-label={`Delete ${item.email}`} disabled={busy || item.uid === currentUid} onClick={() => open('delete', item)}><Trash2 size={16} /></button></div></td></tr>)}{loading && !items.length && <tr><td colSpan={5} className="admin-empty">Loading users...</td></tr>}{!loading && !visible.length && <tr><td colSpan={5} className="admin-empty">No matching users.</td></tr>}</tbody></table></div>
    <div className="admin-pagination"><div className="admin-heading-actions"><button type="button" className="admin-icon-button" aria-label="Previous users page" title="Previous page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={16} /></button><span>Page {currentPage} of {pageCount} / {filtered.length} users</span><button type="button" className="admin-icon-button" aria-label="Next users page" title="Next page" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}><ChevronRight size={16} /></button></div>{cursor && <button type="button" className="admin-btn secondary" disabled={loading || busy} onClick={() => load(cursor)}>Load more users</button>}</div>
    {dialog?.mode === 'edit' && <UserEditor key={dialog.item?.uid || 'new'} item={dialog.item} currentUid={currentUid} busy={busy} error={dialogError} onClose={() => setDialog(null)} onSave={(data) => change(dialog.item ? 'PATCH' : 'POST', { uid: dialog.item?.uid, data }, dialog.item ? 'User updated.' : 'User created.')} />}
    {dialog && dialog.mode !== 'edit' && <AdminDialog title={dialog.mode === 'delete' ? 'Delete user' : 'Password reset'} busy={busy} onClose={() => { setDialog(null); setResetUrl(''); }}>
      {dialogError && <p className="admin-error" role="alert">{dialogError}</p>}
      <p className="admin-tool-message">{dialog.mode === 'delete' ? `Permanently delete ${dialog.item.email}? Existing blogs and projects will be retained.` : `Send a password-reset email to ${dialog.item.email}, or generate a link to share manually.`}</p>
      {resetUrl && <label className="admin-field">Password reset link<input readOnly value={resetUrl} onFocus={(event) => event.target.select()} /></label>}
      <div className="admin-actions"><button type="button" className="admin-btn secondary" disabled={busy} onClick={() => { setDialog(null); setResetUrl(''); }}>Close</button>{dialog.mode === 'reset' && <button type="button" className="admin-btn primary" disabled={busy} onClick={() => change('PATCH', { uid: dialog.item.uid, action: 'send-password-reset', submissionId: resetSubmission.current })}><Mail size={16} />{busy ? 'Working...' : 'Send reset email'}</button>}{resetUrl ? <button type="button" className="admin-btn secondary" disabled={busy} onClick={async () => { try { await navigator.clipboard.writeText(resetUrl); setNotice('Reset link copied.'); } catch { setDialogError('Could not copy. Select the reset link to copy it.'); } }}><Copy size={15} />Copy reset link</button> : <button type="button" className={`admin-btn ${dialog.mode === 'delete' ? 'danger' : 'secondary'}`} disabled={busy} onClick={() => change(dialog.mode === 'delete' ? 'DELETE' : 'PATCH', { uid: dialog.item.uid, ...(dialog.mode === 'reset' ? { action: 'reset-password' } : {}) }, 'User deleted.')}>{busy ? 'Working...' : dialog.mode === 'delete' ? 'Delete permanently' : 'Generate reset link'}</button>}</div>
    </AdminDialog>}
  </section>;
}
