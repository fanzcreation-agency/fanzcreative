import assert from 'node:assert/strict';

export async function signInAdminTest(page, { base, email, customToken }) {
  const hostname = new URL(base).hostname;
  if (['localhost', '127.0.0.1', '[::1]'].includes(hostname)) {
    return page.evaluate(async (token) => {
      const { auth } = await import('/src/lib/firebase.js');
      const { signInWithCustomToken } = await import('/node_modules/.vite/deps/firebase_auth.js');
      await signInWithCustomToken(auth, token);
      return auth.currentUser.getIdToken();
    }, customToken);
  }

  if (!process.env.ADMIN_TEST_PASSWORD) throw new Error('Set ADMIN_TEST_PASSWORD to test the deployed login form.');
  const response = page.waitForResponse((result) => {
    const url = new URL(result.url());
    return url.hostname === 'identitytoolkit.googleapis.com' && url.pathname.endsWith('/accounts:signInWithPassword');
  }, { timeout: 30000 });
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(process.env.ADMIN_TEST_PASSWORD);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  const result = await response;
  const session = await result.json();
  assert.equal(result.status(), 200, session.error?.message || 'Deployed login failed.');
  assert.equal(typeof session.idToken, 'string');
  return session.idToken;
}
