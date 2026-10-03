import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

function runWithoutRequireEsm(source) {
  // Serverless loaders may lack Node's require(esm) interop even on newer Node versions.
  const result = spawnSync(process.execPath, ['--no-experimental-require-module', '--input-type=module', '-e', source], {
    cwd: fileURLToPath(new URL('../', import.meta.url)),
    encoding: 'utf8',
    timeout: 30000,
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr || result.stdout);
}

test('all serverless APIs start without require(esm) and retain method/auth protection', () => {
  runWithoutRequireEsm(`
    import assert from 'node:assert/strict';
    for (const name of ['admin-content', 'admin-comments', 'admin-media', 'admin-users', 'cloudinary-sign', 'content', 'comments', 'contact']) {
      const { default: handler } = await import('./api/' + name + '.js');
      let status;
      let body;
      const response = {
        setHeader() {},
        status(value) { status = value; return this; },
        json(value) { body = value; return this; },
      };
      await handler({ method: 'OPTIONS', headers: {}, query: {} }, response);
      assert.equal(status, 405, name);
      assert.equal(typeof body.error, 'string', name);
      if (name.startsWith('admin-')) {
        await handler({ method: 'GET', headers: {}, query: {} }, response);
        assert.equal(status, 401, name);
      }
    }
  `);
});

test('Firebase JWKS dependency converts RSA/EC keys and preserves signature verification without require(esm)', () => {
  runWithoutRequireEsm(`
    import assert from 'node:assert/strict';
    import { generateKeyPairSync, sign, verify } from 'node:crypto';
    import { createRequire } from 'node:module';
    const require = createRequire(import.meta.url);
    const adminRequire = createRequire(require.resolve('firebase-admin'));
    const jwks = adminRequire('jwks-rsa');
    for (const [type, options, alg] of [
      ['rsa', { modulusLength: 2048 }, 'RS256'],
      ['ec', { namedCurve: 'P-256' }, 'ES256'],
    ]) {
      const { publicKey, privateKey } = generateKeyPairSync(type, options);
      const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'test-' + type, use: 'sig', alg };
      const client = jwks({
        jwksUri: 'https://example.invalid/jwks',
        cache: false,
        fetcher: async () => ({ keys: [jwk] }),
      });
      const keys = await client.getSigningKeys();
      assert.equal(keys.length, 1);
      assert.equal(keys[0].kid, jwk.kid);
      const payload = Buffer.from('signature verification test');
      const signature = sign('sha256', payload, privateKey);
      assert.equal(verify('sha256', payload, keys[0].getPublicKey(), signature), true);
      assert.equal(verify('sha256', Buffer.from('tampered'), keys[0].getPublicKey(), signature), false);
    }
  `);
});
