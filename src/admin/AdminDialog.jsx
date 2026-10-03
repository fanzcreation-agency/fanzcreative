import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import './WorkspaceTools.css';

export default function AdminDialog({ title, busy = false, onClose, className = '', children }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    return () => { dialog.close(); document.body.style.overflow = overflow; previousFocus?.focus(); };
  }, []);
  return <dialog ref={ref} className={`admin-tool-dialog ${className}`} aria-label={title} onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
    <header className="admin-tool-dialog-header"><h2>{title}</h2><button className="admin-icon-button" type="button" title="Close dialog" aria-label="Close dialog" disabled={busy} onClick={onClose}><X size={18} /></button></header>
    {children}
  </dialog>;
}
