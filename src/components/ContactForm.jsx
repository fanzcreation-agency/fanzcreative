import { useId, useRef, useState } from 'react';
import { Paperclip, X } from 'lucide-react';
import { ATTACHMENT_TYPES, contactErrors, validateContactFiles } from '../../shared/contact';
import { requestJson } from '../lib/http';
import { playHover, playLongClick } from '../hooks/useSound';
import './ContactForm.css';

const emptyForm = { name: '', phone: '', message: '', website: '' };
const fields = [
  { name: 'name', label: 'Your Name', placeholder: 'Enter your full name', maximum: 100, autoComplete: 'name' },
  { name: 'phone', label: 'Email or Phone', placeholder: 'Enter your email or phone number', maximum: 254, autoComplete: 'off' },
  { name: 'message', label: 'More About The Project', maximum: 5000 },
];

function fileData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('The attachment could not be read. Please select it again.'));
    reader.onload = () => resolve({ name: file.name, type: file.type, data: reader.result.split(',')[1] });
    reader.readAsDataURL(file);
  });
}

export default function ContactForm({ light = false, preview = false }) {
  const id = useId();
  const input = useRef(null);
  const lock = useRef(false);
  const submission = useRef(null);
  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const update = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: '' })); setStatus(null);
  };
  const chooseFiles = (event) => {
    try {
      const next = [...files, ...Array.from(event.target.files)];
      validateContactFiles(next);
      setFiles(next); setErrors((previous) => ({ ...previous, attachments: '' })); setStatus(null);
    } catch (error) { setErrors((previous) => ({ ...previous, attachments: error.message })); }
    event.target.value = '';
  };
  const submit = async (event) => {
    event.preventDefault();
    if (lock.current || preview) return;
    const nextErrors = contactErrors(form);
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }
    lock.current = true; setBusy(true); setStatus(null); playLongClick();
    try {
      const attachments = await Promise.all(files.map(fileData));
      const data = { ...form, attachments };
      const signature = JSON.stringify(data);
      if (submission.current?.signature !== signature) submission.current = { signature, id: crypto.randomUUID() };
      const result = await requestJson('/api/contact', { method: 'POST', timeoutMs: 55000,
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, submissionId: submission.current.id }) });
      if (!result.sent) throw new Error('Your message could not be confirmed. Please try again.');
      setStatus({ ok: true, message: result.message || 'Your message has been sent. We will be in touch soon.' });
      setForm(emptyForm); setFiles([]); setErrors({}); submission.current = null;
    } catch (error) { setStatus({ ok: false, message: error.message }); }
    finally { lock.current = false; setBusy(false); }
  };
  return <form className={`form-contact effectFade fadeUp contact-mail-form ${light ? 'm-0 contact-page-form' : 'contact-glass-form'}`} onSubmit={submit} noValidate>
    <h4 className={`heading fw-semibold ${light ? '' : 'text-white'}`}>Fill this form below</h4>
    <fieldset className="contact-inputs" disabled={busy || preview}>
      {fields.map((field) => <div className={field.name === 'message' ? 'mb-18' : 'mb-21'} key={field.name}>
        <label htmlFor={`${id}-${field.name}`} className={`fw-semibold text-body-3 ${field.name === 'message' ? 'mb-0' : 'mb-20'} ${light ? '' : 'text-white'}`}>{field.label}</label>
        {field.name === 'message' ? <textarea id={`${id}-${field.name}`} name={field.name} maxLength={field.maximum} value={form[field.name]} onChange={update} required aria-invalid={Boolean(errors[field.name])} aria-describedby={errors[field.name] ? `${id}-${field.name}-error` : undefined} /> :
          <input id={`${id}-${field.name}`} name={field.name} type="text" maxLength={field.maximum} autoComplete={field.autoComplete} placeholder={field.placeholder} value={form[field.name]} onChange={update} onMouseEnter={playHover} required aria-invalid={Boolean(errors[field.name])} aria-describedby={errors[field.name] ? `${id}-${field.name}-error` : undefined} />}
        {errors[field.name] && <div id={`${id}-${field.name}-error`} className="contact-field-error">{errors[field.name]}</div>}
      </div>)}
      <label className="contact-trap" aria-hidden="true">Website<input name="website" value={form.website} onChange={update} tabIndex={-1} autoComplete="off" /></label>
      <input ref={input} type="file" hidden multiple accept={ATTACHMENT_TYPES.join(',')} aria-label="Project attachments" onChange={chooseFiles} />
      <button type="button" className="attachment d-flex gap-8 align-items-center contact-attachment-button" onClick={() => input.current?.click()} onMouseEnter={playHover}><Paperclip size={22} /><span className="fw-semibold text-body-3">Add an Attachment</span></button>
      {files.length > 0 && <ul className="contact-files">{files.map((file, index) => <li key={`${file.name}-${index}`}><span>{file.name}</span><button type="button" title={`Remove ${file.name}`} aria-label={`Remove ${file.name}`} onClick={() => { setFiles(files.filter((_, position) => position !== index)); setErrors((previous) => ({ ...previous, attachments: '' })); setStatus(null); }}><X size={16} /></button></li>)}</ul>}
      {errors.attachments && <div className="contact-field-error" role="alert">{errors.attachments}</div>}
      <button type="submit" className="tf-btn w-100" onMouseEnter={playHover}>{busy ? 'Sending...' : 'Submit Message'}</button>
    </fieldset>
    {status && <p className={`contact-feedback ${status.ok ? 'success' : 'error'}`} role={status.ok ? 'status' : 'alert'}>{status.message}</p>}
  </form>;
}
