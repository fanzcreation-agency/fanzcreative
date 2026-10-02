import { useEffect, useRef, useState } from 'react';
import { Monitor, RefreshCw, Smartphone, Tablet, X } from 'lucide-react';
import './SitePreview.css';

const devices = [
  { name: 'Desktop', icon: Monitor, width: '100%' },
  { name: 'Tablet', icon: Tablet, width: 768 },
  { name: 'Mobile', icon: Smartphone, width: 390 },
];

export default function SitePreview({ article, onClose }) {
  const dialogRef = useRef(null);
  const frameRef = useRef(null);
  const [token] = useState(() => crypto.randomUUID());
  const [device, setDevice] = useState(devices[0]);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState('');

  useEffect(() => {
    const previousFocus = document.activeElement;
    const dialog = dialogRef.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      previousFocus?.focus();
    };
  }, []);

  useEffect(() => {
    const receive = (event) => {
      if (event.source !== frameRef.current?.contentWindow || event.origin !== window.location.origin || event.data?.token !== token) return;
      if (event.data.type === 'fanz:preview-ready') event.source.postMessage({ type: 'fanz:preview-content', token, article }, window.location.origin);
      if (event.data.type === 'fanz:preview-loaded') { clearTimeout(timer); setLoading(false); setFailed(''); }
      if (event.data.type === 'fanz:preview-error') { clearTimeout(timer); setLoading(false); setFailed(event.data.message || 'Preview could not load.'); }
      if (event.data.type === 'fanz:preview-close') onClose();
    };
    const timer = setTimeout(() => { setLoading(false); setFailed('Preview could not load.'); }, 15000);
    window.addEventListener('message', receive);
    return () => { clearTimeout(timer); window.removeEventListener('message', receive); };
  }, [article, onClose, token, revision]);

  const refresh = () => { setLoading(true); setFailed(''); setRevision((value) => value + 1); };
  return <dialog ref={dialogRef} className="site-preview" aria-label="Article site preview" onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <div className="site-preview-toolbar">
      <div className="site-preview-title"><strong>Article preview</strong><span>{article.title || 'Untitled article'}</span></div>
      <div className="site-preview-devices" role="group" aria-label="Preview device">{devices.map(({ name, icon: Icon, width }) => <button key={name} type="button" title={name} aria-label={name} aria-pressed={device.name === name} onClick={() => setDevice({ name, width })}><Icon size={18} /><span>{name}</span></button>)}</div>
      <div className="site-preview-actions"><button type="button" title="Refresh preview" aria-label="Refresh preview" onClick={refresh}><RefreshCw size={18} /></button><button type="button" title="Close preview" aria-label="Close preview" onClick={onClose} autoFocus><X size={20} /></button></div>
    </div>
    <div className="site-preview-stage">
      {loading && <div className="site-preview-status" role="status">Loading preview...</div>}
      {failed && <div className="site-preview-status" role="alert">{failed} <button type="button" onClick={refresh}>Retry</button></div>}
      <iframe key={revision} ref={frameRef} title="Article website preview" src={`/blog/preview/${token}`} style={{ width: device.width }} />
    </div>
  </dialog>;
}
