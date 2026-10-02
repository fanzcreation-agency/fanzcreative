import { useRef, useState } from 'react';
import { CornerDownRight, MessageSquare, Reply, X } from 'lucide-react';
import { prepareComment } from '../../shared/comments';
import { contentSeconds } from '../../shared/content';
import { requestJson } from '../lib/http';

function CommentItem({ comment, onReply }) {
  const seconds = contentSeconds(comment.createdAt);
  return <article className="blog-comment" id={`comment-${comment.id}`}>
    <div className="blog-comment-avatar" aria-hidden="true">{Array.from(comment.name || '')[0]?.toUpperCase()}</div>
    <div className="blog-comment-content"><div className="blog-comment-meta"><strong>{comment.name}</strong>{comment.authorType === 'admin' && <span className="blog-comment-team">FanzCreative Team</span>}<time dateTime={seconds ? new Date(seconds * 1000).toISOString() : undefined}>{seconds ? new Date(seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</time></div>
      <p>{comment.message}</p>{onReply && <button type="button" className="blog-comment-reply" onClick={() => onReply(comment)}><Reply size={16} />Reply</button>}
    </div>
  </article>;
}

export default function BlogComments({ slug, comments, preview }) {
  const [form, setForm] = useState({ name: '', email: '', message: '', website: '' });
  const [replyTo, setReplyTo] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [visible, setVisible] = useState(10);
  const [replyLimits, setReplyLimits] = useState({});
  const submission = useRef(null);
  const formRef = useRef(null);
  const roots = comments.items.filter((item) => !item.parentId);
  const update = (event) => setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  const reply = (comment) => {
    setReplyTo(comment); setNotice('');
    formRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    formRef.current?.querySelector('textarea')?.focus({ preventScroll: true });
  };
  const submit = async (event) => {
    event.preventDefault();
    if (busy || preview) return;
    setError(''); setNotice('');
    let data;
    try { data = prepareComment({ ...form, parentId: replyTo?.id || '' }); } catch (error) { setError(error.message); return; }
    const signature = JSON.stringify(data);
    if (!submission.current || submission.current.signature !== signature) submission.current = { signature, id: crypto.randomUUID() };
    setBusy(true);
    try {
      const result = await requestJson('/api/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, website: form.website, slug, submissionId: submission.current.id }) });
      setNotice(result.message);
      setForm((previous) => ({ ...previous, message: '', website: '' }));
      setReplyTo(null); submission.current = null;
      comments.refresh();
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  };

  return <section className="blog-comments" id="comments" aria-label="Article comments">
    <h4 className="fw-semibold">Comments {comments.count > 0 && `(${comments.count})`}</h4>
    {comments.loading && !comments.items.length && <p role="status">Loading comments...</p>}
    {comments.error && <div className="blog-comment-feedback error" role="alert">{comments.error}<button type="button" onClick={comments.refresh}>Retry</button></div>}
    {!comments.loading && !comments.error && !roots.length && <p className="blog-comment-empty"><MessageSquare size={20} />No comments yet.</p>}
    {roots.slice(0, visible).map((comment) => {
      const replies = comments.items.filter((item) => item.parentId === comment.id);
      const limit = replyLimits[comment.id] || 5;
      return <div className="blog-comment-thread" key={comment.id}><CommentItem comment={comment} onReply={!preview && !busy ? reply : undefined} /><div className="blog-comment-replies">{replies.slice(0, limit).map((item) => <CommentItem key={item.id} comment={item} />)}{replies.length > limit && <button type="button" className="blog-comment-reply" onClick={() => setReplyLimits((previous) => ({ ...previous, [comment.id]: limit + 5 }))}><CornerDownRight size={16} />More replies</button>}</div></div>;
    })}
    {roots.length > visible && <button type="button" className="tf-btn blog-comments-more" onClick={() => setVisible((value) => value + 10)}>Load more comments</button>}
    <div className="blog-comment-form" ref={formRef} id="post-comment">
      <h4 className="fw-semibold">{replyTo ? `Reply to ${replyTo.name}` : 'Leave a comment'}</h4>
      {replyTo && <button type="button" className="blog-comment-reply" disabled={busy} onClick={() => setReplyTo(null)}><X size={16} />Cancel reply</button>}
      <p>Your email will not be published. Comments appear after approval.</p>
      {error && <p className="blog-comment-feedback error" role="alert">{error}</p>}
      {notice && <p className="blog-comment-feedback success" role="status">{notice}</p>}
      <form onSubmit={submit}>
        <fieldset disabled={busy || preview}>
          <div className="blog-comment-form-fields"><label htmlFor="comment-name">Name *<input id="comment-name" name="name" autoComplete="name" required minLength={2} maxLength={80} value={form.name} onChange={update} /></label><label htmlFor="comment-email">Email *<input id="comment-email" name="email" type="email" autoComplete="email" required maxLength={254} value={form.email} onChange={update} /></label></div>
          <label htmlFor="comment-message">Comment *<textarea id="comment-message" name="message" rows={6} required minLength={3} maxLength={5000} value={form.message} onChange={update} /></label>
          <div className="blog-comment-trap" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={update} /></label></div>
          <button type="submit" className="tf-btn">{busy ? 'Submitting...' : 'Submit comment'}</button>
        </fieldset>
      </form>
    </div>
  </section>;
}
