import { getAdminStore } from '../server/firebase-admin.js';
import { contactRequest } from '../server/contact.js';
import { contactEmail, sendEmail, smtpConfig } from '../server/mail.js';
import { deliverOnce } from '../server/mail-delivery.js';
import { sendError } from '../server/http.js';

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') { response.setHeader('Allow', 'POST'); return response.status(405).json({ error: 'Method not allowed.' }); }
  try {
    const entry = contactRequest(request);
    if (!entry.honeypot) {
      const config = smtpConfig();
      await deliverOnce(getAdminStore(), { kind: 'contact', ...entry, maxPerHour: 3, details: { ...entry.data, attachments: entry.attachments.map((item) => ({ name: item.filename, type: item.contentType, bytes: item.content.length })) } }, () => sendEmail(contactEmail(entry.data, entry.attachments, config), config));
    }
    return response.status(200).json({ sent: true, message: 'Thank you. Your message has been sent.' });
  } catch (error) { return sendError(response, error, 'Your message could not be sent. Please try again or email us directly.'); }
}
