export async function requestJson(url, options = {}) {
  const { timeoutMs = 30000, signal, ...fetchOptions } = options;
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  const cancel = () => controller.abort(signal?.reason);
  if (signal?.aborted) cancel();
  else signal?.addEventListener('abort', cancel, { once: true });
  try {
    const response = await fetch(url, { ...fetchOptions, signal: controller.signal });
    const raw = await response.text();
    let data;
    try { data = raw.trim() ? JSON.parse(raw) : null; }
    catch { throw new Error(`The service returned an invalid response (HTTP ${response.status}). Please try again.`); }
    if (!response.ok) {
      const message = typeof data?.error === 'string' ? data.error : data?.error?.message;
      const error = new Error(message || `The request failed (HTTP ${response.status}). Please try again.`);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    if (!data || typeof data !== 'object') throw new Error('The service returned an empty response. Please try again.');
    return data;
  } catch (error) {
    if (timedOut) throw new Error('The request timed out. Check your connection and try again.', { cause: error });
    if (error instanceof TypeError) throw new Error('Could not reach the service. Check your connection and try again.', { cause: error });
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', cancel);
  }
}
