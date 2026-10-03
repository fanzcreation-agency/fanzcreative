export const EMAIL_PATTERN = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
export const MAIL_SUBMISSION_ID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export const ATTACHMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
export const ATTACHMENT_LIMIT = 2 * 1024 * 1024;

export function contactErrors(data) {
  const errors = {};
  const name = typeof data?.name === 'string' ? data.name.trim() : '';
  const phone = typeof data?.phone === 'string' ? data.phone.trim() : '';
  const message = typeof data?.message === 'string' ? data.message.trim() : '';
  if (name.length < 2 || name.length > 100 || /[\r\n]/.test(name)) errors.name = 'Enter your name (2-100 characters).';
  if (!phone || phone.length > 254 || (phone.includes('@') ? !EMAIL_PATTERN.test(phone) : !/^[+\d().\s-]+$/.test(phone) || phone.replace(/\D/g, '').length < 7 || phone.replace(/\D/g, '').length > 20)) errors.phone = 'Enter a valid email address or phone number.';
  if (message.length < 10 || message.length > 5000) errors.message = 'Enter a project message (10-5,000 characters).';
  return errors;
}

export function prepareContact(data) {
  const errors = contactErrors(data);
  if (Object.keys(errors).length) throw Object.assign(new Error(Object.values(errors)[0]), { fields: errors });
  return { name: data.name.trim(), phone: data.phone.trim(), message: data.message.trim() };
}

export function validateContactFiles(files) {
  if (files.length > 2) throw new Error('Attach up to two PDF, JPG, PNG or WebP files.');
  if (files.some((file) => !ATTACHMENT_TYPES.includes(file.type))) throw new Error('Attachments must be PDF, JPG, PNG or WebP files.');
  if (files.reduce((total, file) => total + file.size, 0) > ATTACHMENT_LIMIT) throw new Error('Attachments must total 2 MB or less.');
}
