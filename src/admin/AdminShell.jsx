import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ChevronRight, FileText, FolderKanban, Layers, LayoutDashboard, LogOut, Menu, MessageSquare, X } from 'lucide-react';

export default function AdminShell({ email, type, slug, isComments, content, commentCounts, onNavigate, onSignOut, children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const sidebar = useRef(null);
  const menuButton = useRef(null);
  const section = isComments ? 'Comments' : type === 'posts' ? 'Blogs' : type === 'projects' ? 'Projects' : 'Overview';
  const navigate = (path) => { setMenuOpen(false); onNavigate(path); };

  useEffect(() => {
    if (!menuOpen) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const controls = () => [...sidebar.current.querySelectorAll('button, a[href]')];
    controls()[0]?.focus();
    const close = () => setMenuOpen(false);
    const resize = () => { if (window.innerWidth > 800) close(); };
    const keydown = (event) => {
      if (event.key === 'Escape') close();
      if (event.key !== 'Tab') return;
      const elements = controls();
      const first = elements[0];
      const last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    window.addEventListener('keydown', keydown);
    window.addEventListener('resize', resize);
    window.addEventListener('popstate', close);
    const trigger = menuButton.current;
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('resize', resize);
      window.removeEventListener('popstate', close);
      trigger?.focus();
    };
  }, [menuOpen]);

  return <main className={`admin-root admin-shell${menuOpen ? ' admin-menu-open' : ''}`}>
    {menuOpen && <button type="button" className="admin-nav-overlay" aria-label="Close navigation" onClick={() => setMenuOpen(false)} tabIndex={-1} />}
    <aside ref={sidebar} className="admin-sidebar" id="admin-navigation" aria-label="Workspace navigation">
      <div className="admin-sidebar-heading">
        <button className="admin-brand" onClick={() => navigate('/admin')}><span className="admin-brand-mark"><Layers size={20} strokeWidth={2} /></span><span className="admin-brand-name">fanz<span>creative</span><small>Workspace</small></span></button>
        <button type="button" className="admin-mobile-close admin-icon-button" title="Close navigation" aria-label="Close navigation" onClick={() => setMenuOpen(false)}><X size={18} /></button>
      </div>
      <nav aria-label="Admin sections">
        <span className="admin-nav-label">WORKSPACE</span>
        <button className={!type && !isComments ? 'active' : ''} aria-current={!type && !isComments ? 'page' : undefined} onClick={() => navigate('/admin')}><LayoutDashboard size={18} /> Overview</button>
        <button className={type === 'posts' ? 'active' : ''} aria-current={type === 'posts' ? 'page' : undefined} onClick={() => navigate('/admin/posts')}><FileText size={18} /> Blogs <span className="admin-nav-count">{content.posts.length}</span></button>
        <button className={type === 'projects' ? 'active' : ''} aria-current={type === 'projects' ? 'page' : undefined} onClick={() => navigate('/admin/projects')}><FolderKanban size={18} /> Projects <span className="admin-nav-count">{content.projects.length}</span></button>
        <button className={isComments ? 'active' : ''} aria-current={isComments ? 'page' : undefined} onClick={() => navigate('/admin/comments')}><MessageSquare size={18} /> Comments {commentCounts && <span className="admin-nav-count">{commentCounts.pending}</span>}</button>
      </nav>
      <div className="admin-sidebar-bottom">
        <a className="admin-site-link" href="/" target="_blank" rel="noreferrer"><ArrowUpRight size={17} /> View website</a>
        <div className="admin-account"><span className="admin-avatar" aria-hidden="true">{email?.[0]?.toUpperCase() || 'A'}</span><div><strong>Administrator</strong><span title={email}>{email}</span></div><button title="Sign out" aria-label="Sign out" onClick={onSignOut}><LogOut size={17} /></button></div>
      </div>
    </aside>
    <div className="admin-main" inert={menuOpen ? true : undefined}>
      <header className="admin-topbar">
        <div className="admin-topbar-left"><button ref={menuButton} type="button" className="admin-mobile-menu admin-icon-button" title="Open navigation" aria-label="Open navigation" aria-expanded={menuOpen} aria-controls="admin-navigation" onClick={() => setMenuOpen(true)}><Menu size={20} /></button><div className="admin-topbar-location"><span className="admin-breadcrumb-brand">Workspace</span><ChevronRight size={13} /><span>{section}</span>{slug && <><ChevronRight size={13} /><span>{slug === 'new' ? 'Add new' : 'Edit'}</span></>}</div></div>
        <div className="admin-topbar-user"><span className="admin-account-role">Admin</span><span className="admin-avatar" title={email}>{email?.[0]?.toUpperCase() || 'A'}</span></div>
      </header>
      {children}
    </div>
  </main>;
}
