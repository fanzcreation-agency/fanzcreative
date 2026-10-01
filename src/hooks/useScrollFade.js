import { useEffect } from 'react';

/**
 * useScrollFade
 *
 * Lightweight, hardware-accelerated IntersectionObserver scroll reveal hook.
 * Replaces heavy GSAP ScrollTrigger calculation loops with native GPU-accelerated CSS transitions.
 *
 * @param {React.RefObject} ref - ref attached to the section root element
 */
export function useScrollFade(ref) {
  useEffect(() => {
    const root = ref?.current;
    if (!root) return;

    const elements = root.querySelectorAll('.effectFade');
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const delay = el.dataset.delay ? parseFloat(el.dataset.delay) : 0;
            if (delay > 0) {
              el.style.transitionDelay = `${delay}s`;
            }
            el.classList.add('is-visible');
            observer.unobserve(el);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [ref]);
}
