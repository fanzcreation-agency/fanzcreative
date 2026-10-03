import nodemailer from 'nodemailer';
import { lookup } from 'node:dns/promises';
import { HttpError } from './http.js';
import { EMAIL_PATTERN } from '../shared/contact.js';

export function smtpConfig(env = process.env) {
  const port = Number(env.SMTP_PORT || 587);
  const secure = env.SMTP_SECURE ? env.SMTP_SECURE === 'true' : port === 465;
  const from = env.SMTP_FROM_EMAIL || env.SMTP_USER;
  const to = env.CONTACT_TO_EMAIL || from;
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD || !EMAIL_PATTERN.test(from || '') || !EMAIL_PATTERN.test(to || '')) throw new HttpError(503, 'Email service is not configured. Please contact us directly by email.');
  if (!Number.isInteger(port) || port < 1 || port > 65535 || (env.SMTP_SECURE && !['true', 'false'].includes(env.SMTP_SECURE)) || (port === 465 && !secure) || (port === 587 && secure)) throw new HttpError(503, 'Email server settings need attention.');
  return {
    from: { name: 'FanzCreative', address: from }, to,
    transport: { host: env.SMTP_HOST, port, secure, requireTLS: !secure, auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
      connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000, dnsTimeout: 10000,
      tls: { minVersion: 'TLSv1.2', rejectUnauthorized: true }, disableFileAccess: true, disableUrlAccess: true, logger: false, debug: false },
  };
}

export async function mailTransportOptions(config) {
  // Use the OS resolver; some Windows networks block Node's separate DNS resolver.
  let timer;
  try {
    const { address } = await Promise.race([lookup(config.transport.host), new Promise((_, reject) => {
      timer = setTimeout(() => reject(Object.assign(new Error('SMTP DNS timed out'), { code: 'ETIMEOUT' })), 10000);
    })]);
    return { ...config.transport, host: address, tls: { ...config.transport.tls, servername: config.transport.host } };
  } finally { clearTimeout(timer); }
}

export async function sendEmail(message, config = smtpConfig()) {
  let transport;
  try {
    transport = nodemailer.createTransport(await mailTransportOptions(config));
    const result = await transport.sendMail({ ...message, from: config.from, disableFileAccess: true, disableUrlAccess: true });
    if (!result.accepted?.length || result.rejected?.length) throw new Error('Recipient not accepted');
    return { messageId: result.messageId };
  } catch (error) {
    console.error('SMTP delivery failed:', error.code || 'delivery-error');
    throw new HttpError(503, 'Email could not be sent. Please try again shortly or contact us directly.');
  } finally { transport?.close(); }
}

function escapeHtml(text) { return String(text).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]); }

function contactEmailHtml(data, attachments) {
  const email = EMAIL_PATTERN.test(data.phone);
  const logo = 'https://res.cloudinary.com/cavd6vos/image/upload/f_png/q_auto/v1790849653/fanzcreative/assets/logo/fanz-logo.webp';
  const wrap = 'word-wrap:break-word;overflow-wrap:anywhere;word-break:break-word;';
  const fileRows = attachments.map((file) => `<tr><td style="padding:10px 0;border-bottom:1px solid #e6e9ed;font-size:14px;line-height:22px;${wrap}">${escapeHtml(file.filename)}<br><span style="font-size:12px;color:#667085;">${escapeHtml(file.contentType === 'application/pdf' ? 'PDF' : file.contentType.replace('image/', '').toUpperCase())} &middot; ${Math.max(1, Math.ceil(file.content.length / 1024))} KB</span></td></tr>`).join('');
  const contactLink = email ? `mailto:${encodeURIComponent(data.phone)}?subject=Re%3A%20Your%20project%20enquiry` : `tel:${data.phone.replace(/[^\d+]/g, '')}`;
  // Presentation tables and inline styles keep the layout independent of website CSS.
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>New project enquiry | FanzCreative</title></head>
<body style="margin:0;padding:0;background-color:#f3f5f7;font-family:Arial,Helvetica,sans-serif;color:#111318;-webkit-text-size-adjust:100%;">
  <div style="display:none;font-size:1px;color:#f3f5f7;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">A new project enquiry from ${escapeHtml(data.name)}. View their message and contact details.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f3f5f7" style="width:100%;"><tr><td align="center" style="padding:28px 12px;">
    <!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;table-layout:fixed;background-color:#ffffff;border:1px solid #e3e7eb;border-radius:8px;">
      <tr><td bgcolor="#090909" style="padding:26px 28px;background-color:#090909;border-radius:8px 8px 0 0;">
        <a href="https://www.fanzcreative.design/" style="text-decoration:none;color:#ffffff;"><img src="${logo}" width="112" alt="FanzCreative" border="0" style="display:block;width:112px;max-width:100%;height:auto;font-size:18px;font-weight:bold;color:#ffffff;"></a>
      </td></tr>
      <tr><td bgcolor="#0af9cf" height="4" style="height:4px;font-size:1px;line-height:4px;background-color:#0af9cf;">&nbsp;</td></tr>
      <tr><td style="padding:30px 28px 22px;">
        <p style="margin:0 0 10px;font-size:11px;line-height:16px;font-weight:bold;color:#087c68;text-transform:uppercase;">Website enquiry</p>
        <h1 style="margin:0;font-size:28px;line-height:36px;font-weight:bold;">New project enquiry</h1>
        <p style="margin:12px 0 0;font-size:15px;line-height:24px;color:#667085;${wrap}">${escapeHtml(data.name)} has reached out about a project.</p>
      </td></tr>
      <tr><td style="padding:0 28px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;table-layout:fixed;border-top:1px solid #e6e9ed;border-bottom:1px solid #e6e9ed;">
          <tr><td style="padding:16px 0 14px;font-size:12px;line-height:18px;color:#667085;">Name<br><strong style="font-size:15px;line-height:25px;color:#111318;${wrap}">${escapeHtml(data.name)}</strong></td></tr>
          <tr><td style="padding:0 0 16px;font-size:12px;line-height:18px;color:#667085;">${email ? 'Email address' : 'Phone number'}<br><a href="${escapeHtml(contactLink)}" style="font-size:15px;line-height:25px;color:#111318;text-decoration:underline;${wrap}">${escapeHtml(data.phone)}</a></td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:0 28px 26px;">
        <h2 style="margin:0 0 14px;font-size:16px;line-height:24px;font-weight:bold;">Project message</h2>
        <p style="margin:0;font-size:15px;line-height:26px;color:#344054;${wrap}">${escapeHtml(data.message).replace(/\r\n|\r|\n/g, '<br>')}</p>
      </td></tr>
      ${attachments.length ? `<tr><td style="padding:0 28px 26px;"><h2 style="margin:0 0 4px;font-size:16px;line-height:24px;font-weight:bold;">Attachments (${attachments.length})</h2><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;table-layout:fixed;">${fileRows}</table><p style="margin:10px 0 0;font-size:12px;line-height:18px;color:#667085;">Files are attached to this email.</p></td></tr>` : ''}
      ${email ? `<tr><td style="padding:0 28px 30px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#090909" style="background-color:#090909;border-radius:6px;mso-padding-alt:14px 22px;"><a href="${escapeHtml(contactLink)}" style="display:inline-block;padding:14px 22px;border:1px solid #090909;border-radius:6px;font-size:14px;line-height:20px;font-weight:bold;color:#ffffff;text-decoration:none;mso-padding-alt:0;">Reply to sender</a></td></tr></table></td></tr>` : ''}
      <tr><td bgcolor="#fafbfc" style="padding:20px 28px;border-top:1px solid #e6e9ed;background-color:#fafbfc;border-radius:0 0 8px 8px;">
        <p style="margin:0;font-size:12px;line-height:20px;color:#667085;">Sent from the FanzCreative contact form.<br><a href="https://www.fanzcreative.design/" style="color:#344054;text-decoration:none;">fanzcreative.design</a></p>
      </td></tr>
    </table>
    <!--[if mso]></td></tr></table><![endif]-->
  </td></tr></table>
</body></html>`;
}

export function contactEmail(data, attachments, config) {
  return {
    to: config.to, subject: 'New project enquiry | FanzCreative',
    ...(EMAIL_PATTERN.test(data.phone) ? { replyTo: { name: data.name, address: data.phone } } : {}),
    text: `FanzCreative | New project enquiry\n\nName: ${data.name}\nEmail / phone: ${data.phone}\n\nPROJECT MESSAGE\n${data.message}${attachments.length ? `\n\nATTACHMENTS\n${attachments.map((file) => file.filename).join('\n')}` : ''}\n\nSent from the FanzCreative contact form.`,
    html: contactEmailHtml(data, attachments),
    attachments,
  };
}

export function resetEmail(user, resetUrl) {
  const url = new URL(resetUrl);
  if (url.protocol !== 'https:') throw new Error('Invalid password-reset URL');
  return {
    to: user.email, subject: 'Reset your FanzCreative password',
    text: `Hello ${user.displayName || 'there'},\n\nAn administrator requested a password reset for your FanzCreative account.\n\nChoose a new password here:\n${resetUrl}\n\nIf you were not expecting this, contact your administrator.\n\nFanzCreative`,
    html: `<h2>Reset your password</h2><p>Hello ${escapeHtml(user.displayName || 'there')},</p><p>An administrator requested a password reset for your FanzCreative account.</p><p><a href="${escapeHtml(resetUrl)}">Choose a new password</a></p><p>If you were not expecting this, contact your administrator.</p><p>FanzCreative</p>`,
  };
}
