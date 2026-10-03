import { getAuth } from 'firebase-admin/auth';
import { getAdminApp, getAdminStore } from '../server/firebase-admin.js';
import { HttpError, requireAdmin, sendError } from '../server/http.js';
import { changeUser, publicUser, userError, withUserLock } from '../server/admin-users.js';
import { smtpConfig, resetEmail, sendEmail } from '../server/mail.js';
import { deliverOnce, mailHash } from '../server/mail-delivery.js';
import { MAIL_SUBMISSION_ID } from '../shared/contact.js';

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(request.method)) {
    response.setHeader('Allow', 'GET, POST, PATCH, DELETE');
    return response.status(405).json({ error: 'Method not allowed.' });
  }
  try {
    const actor = await requireAdmin(request);
    const auth = getAuth(getAdminApp());
    if (request.method === 'GET') {
      const cursor = request.query?.cursor;
      if (cursor !== undefined && (typeof cursor !== 'string' || cursor.length > 2048)) throw new HttpError(400, 'Invalid page cursor.');
      const result = await auth.listUsers(100, cursor || undefined);
      return response.status(200).json({ items: result.users.map(publicUser), nextCursor: result.pageToken || null });
    }
    const store = getAdminStore();
    if (request.method === 'PATCH' && request.body?.action === 'send-password-reset') {
      const { uid, submissionId } = request.body;
      if (typeof uid !== 'string' || !uid || uid.length > 128 || !MAIL_SUBMISSION_ID.test(submissionId || '')) throw new HttpError(400, 'Choose a valid user and reset request.');
      const config = smtpConfig();
      const result = await withUserLock(store, async () => {
        const actingUser = await auth.getUser(actor.uid);
        if (actingUser.disabled || actingUser.customClaims?.admin !== true) throw new HttpError(403, 'Admin access required.');
        const user = await auth.getUser(uid);
        if (user.disabled || !user.email) throw new HttpError(400, 'Password reset requires an active account with an email address.');
        await deliverOnce(store, { kind: 'password-reset', submissionId, fingerprint: mailHash(`${uid}:${user.email}`), rateKey: uid, maxPerHour: 5, details: { targetUid: uid, requestedBy: actor.uid } }, async () => {
          const resetUrl = await auth.generatePasswordResetLink(user.email);
          return sendEmail(resetEmail(user, resetUrl), config);
        });
        return { emailSent: true, email: user.email };
      });
      return response.status(200).json(result);
    }
    const result = await withUserLock(store, () => changeUser(auth, actor.uid, request.method, request.body));
    return response.status(request.method === 'POST' ? 201 : 200).json(result);
  } catch (error) {
    return sendError(response, userError(error), 'User management is unavailable. Please try again.');
  }
}
