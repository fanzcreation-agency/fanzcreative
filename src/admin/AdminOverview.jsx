import { ArrowRight, ArrowUpRight, FileText, FolderKanban, Image, MessageSquare, Plus, RefreshCw, Save } from 'lucide-react';
import { sortContent } from '../../shared/content';

function date(timestamp) {
  const seconds = timestamp?.seconds ?? timestamp?._seconds;
  return seconds ? new Date(seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Not saved';
}

export default function AdminOverview({ content, loading, errors, commentCounts, onNavigate, onRefresh }) {
  const items = sortContent([...content.posts.map((item) => ({ ...item, type: 'posts' })), ...content.projects.map((item) => ({ ...item, type: 'projects' }))]);
  const drafts = items.filter((item) => item.status === 'draft');
  const busy = loading.posts || loading.projects;
  return <div className="admin-content-page admin-overview">
    <div className="admin-page-heading"><div><h1>Overview</h1><p>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p></div><div className="admin-heading-actions"><button type="button" className="admin-icon-button" onClick={onRefresh} title="Refresh content" aria-label="Refresh content"><RefreshCw size={17} /></button><button type="button" className="admin-btn primary" onClick={() => onNavigate('/admin/posts/new')}><Plus size={16} /> New blog</button></div></div>
    {(errors.posts || errors.projects) && <p className="admin-error" role="alert">{errors.posts || errors.projects}</p>}
    <div className="admin-stats">
      <button className="admin-stat blogs" onClick={() => onNavigate('/admin/posts')}><span className="admin-stat-top"><span>Blogs</span><FileText size={19} /></span><strong>{busy ? '—' : content.posts.length}</strong><small><span className="admin-status-dot published" />{content.posts.filter((item) => item.status === 'published').length} published</small></button>
      <button className="admin-stat projects" onClick={() => onNavigate('/admin/projects')}><span className="admin-stat-top"><span>Projects</span><FolderKanban size={19} /></span><strong>{busy ? '—' : content.projects.length}</strong><small><span className="admin-status-dot published" />{content.projects.filter((item) => item.status === 'published').length} published</small></button>
      <div className="admin-stat drafts"><span className="admin-stat-top"><span>Drafts</span><Save size={19} /></span><strong>{busy ? '—' : drafts.length}</strong><small>Blogs and projects</small></div>
      <button className="admin-stat comments" onClick={() => onNavigate('/admin/comments')}><span className="admin-stat-top"><span>Pending comments</span><MessageSquare size={19} /></span><strong>{commentCounts?.pending ?? '—'}</strong><small>Awaiting approval <ArrowRight size={13} /></small></button>
    </div>
    <div className="admin-overview-workspace">
      <section className="admin-recent"><div className="admin-section-heading"><div><h2>Recently updated</h2><span>{items.length} content items</span></div><span className="admin-section-caption">Status</span></div>{items.length ? items.slice(0, 7).map((item) => <button key={`${item.type}-${item.slug}`} onClick={() => onNavigate(`/admin/${item.type}/${item.slug}`)}><span className="admin-recent-icon">{item.coverUrl ? <img src={item.coverUrl} alt="" loading="lazy" /> : <Image size={18} />}</span><span className="admin-recent-title">{item.title}<small>{item.type === 'posts' ? 'Blog' : 'Project'} <span>·</span> {date(item.updatedAt)}</small></span><span className={`admin-status ${item.status || 'draft'}`}>{item.status || 'draft'}</span><ArrowUpRight size={15} /></button>) : <div className="admin-empty-state"><FileText size={28} /><h3>{busy ? 'Loading content...' : 'Your workspace is ready'}</h3>{!busy && <button className="admin-btn secondary" onClick={() => onNavigate('/admin/posts/new')}><Plus size={16} /> New blog</button>}</div>}</section>
      <aside className="admin-draft-queue"><div className="admin-section-heading"><div><h2>In progress</h2><span>{drafts.length} drafts</span></div><Save size={17} /></div>{drafts.length ? drafts.slice(0, 4).map((item) => <button key={`${item.type}-${item.slug}`} onClick={() => onNavigate(`/admin/${item.type}/${item.slug}`)}><span className="admin-queue-icon">{item.type === 'posts' ? <FileText size={17} /> : <FolderKanban size={17} />}</span><span><strong>{item.title}</strong><small>{item.type === 'posts' ? 'Blog' : 'Project'} <span>·</span> {date(item.updatedAt)}</small></span><ArrowRight size={15} /></button>) : <div className="admin-empty-state compact"><Save size={23} /><p>{busy ? 'Loading drafts...' : 'No unfinished drafts'}</p></div>}<div className="admin-quick-actions"><button onClick={() => onNavigate('/admin/posts/new')}><FileText size={17} /> Create blog <Plus size={15} /></button><button onClick={() => onNavigate('/admin/projects/new')}><FolderKanban size={17} /> Create project <Plus size={15} /></button></div></aside>
    </div>
  </div>;
}
