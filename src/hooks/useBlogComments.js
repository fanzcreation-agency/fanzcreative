import { useCallback, useEffect, useRef, useState } from 'react';
import { requestJson } from '../lib/http';
import { CONTENT_EVENT } from '../lib/content-events';

export function useBlogComments(slug, preview) {
  const [state, setState] = useState({ items: [], count: 0, loading: !preview, error: '' });
  const pending = useRef(null);
  const refresh = useCallback(async () => {
    if (preview || !slug) return;
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    setState((previous) => ({ ...previous, loading: true, error: '' }));
    try {
      const result = await requestJson(`/api/comments?${new URLSearchParams({ slug })}`, { signal: controller.signal });
      if (!Array.isArray(result.items)) throw new Error('Comments could not be loaded. Please try again.');
      if (!controller.signal.aborted) setState({ items: result.items, count: result.count, loading: false, error: '' });
    } catch (error) {
      if (!controller.signal.aborted) setState((previous) => ({ ...previous, loading: false, error: error.message }));
    }
  }, [slug, preview]);

  useEffect(() => {
    if (preview) return;
    let active = true;
    const changed = (event) => {
      if (event.type === 'storage') {
        if (event.key === `${CONTENT_EVENT}:comments`) refresh();
      } else if (event.detail?.type === 'comments') refresh();
    };
    queueMicrotask(() => { if (active) refresh(); });
    window.addEventListener('focus', refresh);
    window.addEventListener(CONTENT_EVENT, changed);
    window.addEventListener('storage', changed);
    return () => {
      active = false;
      pending.current?.abort();
      window.removeEventListener('focus', refresh);
      window.removeEventListener(CONTENT_EVENT, changed);
      window.removeEventListener('storage', changed);
    };
  }, [refresh, preview]);
  return { ...state, refresh };
}
