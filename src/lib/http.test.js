import assert from 'node:assert/strict';
import test from 'node:test';
import { requestJson } from './http.js';

test('JSON requests return successful content and preserve fetch options', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/test');
    assert.equal(options.method, 'POST');
    assert.equal(options.body, '{}');
    return new Response('{"ok":true}', { status: 201 });
  });
  assert.deepEqual(await requestJson('/api/test', { method: 'POST', body: '{}' }), { ok: true });
});

test('empty and malformed responses are readable errors, not JSON parsing crashes', async (t) => {
  const mock = t.mock.method(globalThis, 'fetch', async () => new Response(''));
  await assert.rejects(requestJson('/api/test'), /empty response/);
  mock.mock.mockImplementation(async () => new Response('<html>Not JSON</html>'));
  await assert.rejects(requestJson('/api/test'), /invalid response/);
});

test('HTTP errors retain status and managed content metadata', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response('{"error":"Not found","managed":true}', { status: 404 }));
  await assert.rejects(requestJson('/api/test'), (error) => error.status === 404 && error.data.managed && error.message === 'Not found');
});

test('Cloudinary nested errors and empty HTTP failures are handled', async (t) => {
  const mock = t.mock.method(globalThis, 'fetch', async () => new Response('{"error":{"message":"Invalid signature"}}', { status: 400 }));
  await assert.rejects(requestJson('/api/test'), /Invalid signature/);
  mock.mock.mockImplementation(async () => new Response('', { status: 503 }));
  await assert.rejects(requestJson('/api/test'), (error) => error.status === 503 && /503/.test(error.message));
});

test('connection failures show a useful retry message', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('Failed to fetch'); });
  await assert.rejects(requestJson('/api/test'), /Could not reach the service/);
});

test('slow requests time out and caller cancellation propagates', async (t) => {
  t.mock.method(globalThis, 'fetch', async (_, { signal }) => new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason);
    if (signal.aborted) abort();
    else signal.addEventListener('abort', abort, { once: true });
  }));
  await assert.rejects(requestJson('/api/test', { timeoutMs: 10 }), /timed out/);
  const controller = new AbortController();
  const request = requestJson('/api/test', { signal: controller.signal });
  controller.abort();
  await assert.rejects(request, { name: 'AbortError' });
});
