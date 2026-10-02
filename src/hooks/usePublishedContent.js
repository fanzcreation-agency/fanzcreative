import { useEffect, useState } from 'react';
import { requestJson } from '../lib/http';
import { CONTENT_EVENT, getContentRevision } from '../lib/content-events';

const cache = new Map();

function getContent(type, slug) {
  const key = `${type}:${slug}`;
  const cached = cache.get(key);
  const version = getContentRevision(type);
  if (cached && cached.version === version && Date.now() - cached.time < 60_000) return cached.promise;

  const query = new URLSearchParams({ type });
  if (slug) query.set('slug', slug);
  const promise = requestJson(`/api/content?${query}`)
    .catch((error) => {
      if (error.status === 404 && slug) return { notFound: true, managed: error.data?.managed === true };
      cache.delete(key);
      throw error;
    });
  cache.set(key, { time: Date.now(), version, promise });
  return promise;
}

export function usePublishedContent(type, slug = '') {
  const key = `${type}:${slug}`;
  const [state, setState] = useState({ key, items: [], managedSlugs: [], item: null, managed: false, loading: true });

  useEffect(() => {
    let active = true;
    let revision = 0;
    const load = () => {
      const currentRevision = ++revision;
      getContent(type, slug)
      .then((result) => active && currentRevision === revision && setState({
        key,
        items: slug ? [] : result.items,
        managedSlugs: slug ? [] : result.managedSlugs,
        item: slug ? (result.notFound ? null : result) : null,
        managed: slug ? (result.managed || !result.notFound) : false,
        loading: false,
      }))
      .catch(() => active && currentRevision === revision && setState((previous) => previous.key === key
        ? { ...previous, loading: false }
        : { key, items: [], managedSlugs: [], item: null, managed: false, loading: false }));
    };
    const refresh = () => { cache.delete(`${type}:${slug}`); load(); };
    const contentChanged = (event) => {
      const changedType = event.type === 'storage'
        ? (() => { try { return JSON.parse(event.newValue)?.type; } catch { return null; } })()
        : event.detail?.type;
      if (event.type === 'storage' && event.key !== `${CONTENT_EVENT}:${type}`) return;
      if (changedType === type) {
        for (const cachedKey of cache.keys()) if (cachedKey.startsWith(`${type}:`)) cache.delete(cachedKey);
        load();
      }
    };
    load();
    window.addEventListener(CONTENT_EVENT, contentChanged);
    window.addEventListener('storage', contentChanged);
    window.addEventListener('focus', refresh);

    return () => {
      active = false;
      window.removeEventListener(CONTENT_EVENT, contentChanged);
      window.removeEventListener('storage', contentChanged);
      window.removeEventListener('focus', refresh);
    };
  }, [type, slug, key]);

  return state.key === key ? state : { key, items: [], managedSlugs: [], item: null, managed: false, loading: true };
}

export function contentDate(item) {
  const seconds = item?.publishedAt?._seconds ?? item?.publishedAt?.seconds;
  return seconds
    ? new Date(seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';
}
