import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import { HttpError } from './http.js';
import { ATTACHMENT_LIMIT, MAIL_SUBMISSION_ID, prepareContact, validateContactFiles } from '../shared/contact.js';
import { mailHash } from './mail-delivery.js';

export function contactAttachments(input = []) {
  if (!Array.isArray(input) || input.length > 2) throw new HttpError(400, 'Attach up to two files.');
  const attachments = input.map((item) => {
    if (!item || typeof item.name !== 'string' || item.name.length > 200 || typeof item.data !== 'string' || item.data.length > Math.ceil(ATTACHMENT_LIMIT / 3) * 4 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(item.data)) throw new HttpError(400, 'Invalid attachment.');
    const content = Buffer.from(item.data, 'base64');
    const mime = item.type;
    const valid = mime === 'application/pdf' ? content.subarray(0, 5).toString() === '%PDF-' : mime === 'image/png' ? content.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) : mime === 'image/jpeg' ? content.length >= 3 && content[0] === 255 && content[1] === 216 && content[2] === 255 : mime === 'image/webp' && content.subarray(0, 4).toString() === 'RIFF' && content.subarray(8, 12).toString() === 'WEBP';
    if (!valid || !content.length || content.toString('base64') !== item.data) throw new HttpError(400, 'The attachment does not match its file type.');
    return { filename: item.name.replace(/[\\/\r\n]/g, '_').trim() || 'attachment', contentType: mime, content };
  });
  try { validateContactFiles(attachments.map((item) => ({ type: item.contentType, size: item.content.length }))); }
  catch (error) { throw new HttpError(400, error.message); }
  return attachments;
}

export function contactRequest(request, env = process.env) {
  let origin;
  try { origin = new URL(request.headers.origin); } catch { throw new HttpError(403, 'Submit the form from this website.'); }
  if (!['http:', 'https:'].includes(origin.protocol) || origin.host !== request.headers.host || !request.headers['content-type']?.startsWith('application/json')) throw new HttpError(403, 'Submit the form from this website.');
  if (request.body?.website) return { honeypot: true };
  if (!MAIL_SUBMISSION_ID.test(request.body?.submissionId || '')) throw new HttpError(400, 'Invalid submission. Refresh the page and try again.');
  let data;
  try { data = prepareContact(request.body); } catch (error) { throw new HttpError(400, error.message); }
  const attachments = contactAttachments(request.body.attachments);
  const secret = env.MAIL_RATE_LIMIT_SECRET || env.CLOUDINARY_API_SECRET;
  if (!secret) throw new HttpError(503, 'Message protection is not configured.');
  const rawIp = env.VERCEL ? request.headers['x-vercel-forwarded-for'] || request.headers['x-forwarded-for'] : request.socket?.remoteAddress;
  const ip = typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : '';
  if (!isIP(ip)) throw new HttpError(503, 'Could not verify the submission. Please try again.');
  const rateKey = createHmac('sha256', secret).update(ip).digest('hex');
  const fingerprint = mailHash(JSON.stringify([data, attachments.map((item) => [item.filename, item.contentType, mailHash(item.content)])]));
  return { data, attachments, rateKey, fingerprint, submissionId: request.body.submissionId };
}
