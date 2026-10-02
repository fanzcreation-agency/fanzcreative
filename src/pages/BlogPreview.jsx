import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { BlogArticle } from './BlogSingle';
import { validateArticleBlocks } from '../../shared/article-blocks';
import { prepareEndQuote } from '../../shared/content';

export default function BlogPreview() {
  const { token } = useParams();
  const [article, setArticle] = useState(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const owner = window.parent !== window ? window.parent : window.opener;
    const origin = window.location.origin;
    const timer = setTimeout(() => setUnavailable(true), 10000);
    const receive = (event) => {
      if (!owner || event.source !== owner || event.origin !== origin || event.data?.token !== token || event.data?.type !== 'fanz:preview-content') return;
      try {
        const data = event.data.article;
        const blocks = validateArticleBlocks(data.blocks);
        setArticle({ ...data, ...prepareEndQuote(data), blocks, publishedAt: data.publishedAt || { seconds: Math.floor(Date.now() / 1000) } });
        setUnavailable(false);
        clearTimeout(timer);
        owner.postMessage({ type: 'fanz:preview-loaded', token }, origin);
      } catch (error) {
        clearTimeout(timer);
        setUnavailable(true);
        owner.postMessage({ type: 'fanz:preview-error', token, message: error.message }, origin);
      }
    };
    const escape = (event) => {
      if (event.key === 'Escape') owner?.postMessage({ type: 'fanz:preview-close', token }, origin);
    };
    // Preview forms must not send enquiries or mutate public content.
    const preventSubmit = (event) => { event.preventDefault(); event.stopPropagation(); };
    window.addEventListener('message', receive);
    window.addEventListener('keydown', escape);
    document.addEventListener('submit', preventSubmit, true);
    owner?.postMessage({ type: 'fanz:preview-ready', token }, origin);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('message', receive);
      window.removeEventListener('keydown', escape);
      document.removeEventListener('submit', preventSubmit, true);
    };
  }, [token]);

  return <>
    <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
    {article ? <BlogArticle article={article} preview /> : <section className="section-page-title"><div className="container text-center" role="status"><h2>{unavailable ? 'Preview unavailable' : 'Loading preview...'}</h2>{unavailable && <p>Open Preview again from the article editor.</p>}</div></section>}
  </>;
}
