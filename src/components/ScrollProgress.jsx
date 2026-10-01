import { useEffect, useRef } from 'react';

function ScrollProgress() {
  const progressRef = useRef(null);

  useEffect(() => {
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    if (!gsap || !ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    const el = progressRef.current;
    if (!el) return;

    const anim = gsap.to(el, {
      scaleX: 1,
      ease: "none",
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.3
      }
    });

    return () => {
      if (anim.scrollTrigger) anim.scrollTrigger.kill();
      anim.kill();
    };
  }, []);

  return (
    <div
      ref={progressRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '4px',
        backgroundColor: '#0af9cf',
        transformOrigin: '0% 50%',
        transform: 'scaleX(0)',
        zIndex: 99999,
        pointerEvents: 'none',
      }}
    />
  );
}

export default ScrollProgress;
