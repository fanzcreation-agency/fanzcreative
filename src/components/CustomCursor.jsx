import { useEffect, useRef } from 'react';

/**
 * CustomCursor
 *
 * Small cursor accent that follows the native cursor.
 * The browser cursor stays visible; this only adds a subtle blend-mode circle.
 */
function CustomCursor() {
  const dotRef = useRef(null);

  useEffect(() => {
    const dot = dotRef.current;
    if (!dot) return;

    const gsapObj = window.gsap;

    if (gsapObj && gsapObj.quickTo) {
      // GSAP quickTo for buttery smooth easing follow (duration 0.5, power3 ease)
      const xTo = gsapObj.quickTo(dot, 'x', { duration: 0.5, ease: 'power3' });
      const yTo = gsapObj.quickTo(dot, 'y', { duration: 0.5, ease: 'power3' });

      // Initialize position offscreen and hidden
      gsapObj.set(dot, { x: -300, y: -300, opacity: 0 });

      const onMouseMove = (e) => {
        gsapObj.to(dot, { opacity: 1, duration: 0.2 });
        xTo(e.clientX);
        yTo(e.clientY);
      };

      const onMouseOver = (e) => {
        const target = e.target.closest(
          'a, button, [role="button"], .hover-target, .tf-btn, .palmer-video-card, .rw-card-wrapper, .rw-casestudy-btn, .rw-nav-arrow, .framer-tab-btn, .menu-item'
        );
        if (target) {
          gsapObj.to(dot, { scale: 1.5, duration: 0.25, ease: 'power2.out' });
        } else {
          gsapObj.to(dot, { scale: 1, duration: 0.25, ease: 'power2.out' });
        }
      };

      const onMouseDown = () => {
        gsapObj.to(dot, { scale: 1.2, duration: 0.15, ease: 'power2.out' });
      };

      const onMouseUp = (e) => {
        const target = e.target.closest(
          'a, button, [role="button"], .hover-target, .tf-btn, .palmer-video-card, .rw-card-wrapper, .rw-casestudy-btn, .rw-nav-arrow, .framer-tab-btn, .menu-item'
        );
        gsapObj.to(dot, { scale: target ? 1.5 : 1, duration: 0.2, ease: 'power2.out' });
      };

      const onMouseLeave = () => {
        gsapObj.to(dot, { opacity: 0, duration: 0.2 });
      };

      const onMouseEnter = () => {
        gsapObj.to(dot, { opacity: 1, duration: 0.2 });
      };

      window.addEventListener('mousemove', onMouseMove, { passive: true });
      document.addEventListener('mouseover', onMouseOver, { passive: true });
      document.addEventListener('mousedown', onMouseDown, { passive: true });
      document.addEventListener('mouseup', onMouseUp, { passive: true });
      document.body.addEventListener('mouseleave', onMouseLeave, { passive: true });
      document.body.addEventListener('mouseenter', onMouseEnter, { passive: true });

      return () => {
        window.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseover', onMouseOver);
        document.removeEventListener('mousedown', onMouseDown);
        document.removeEventListener('mouseup', onMouseUp);
        document.body.removeEventListener('mouseleave', onMouseLeave);
        document.body.removeEventListener('mouseenter', onMouseEnter);
      };
    } else {
      // Fallback LERP if GSAP script is still loading
      let targetX = -300, targetY = -300, currentX = -300, currentY = -300, raf;
      const onMove = (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
        dot.style.opacity = '1';
        const interactive = Boolean(
          e.target.closest('a, button, [role="button"], .hover-target, .tf-btn')
        );
        dot.style.scale = interactive ? '1.5' : '1';
      };

      const loop = () => {
        currentX += (targetX - currentX) * 0.16;
        currentY += (targetY - currentY) * 0.16;
        dot.style.transform = `translate3d(${currentX}px,${currentY}px,0) translate(-50%,-50%)`;
        raf = requestAnimationFrame(loop);
      };

      document.addEventListener('mousemove', onMove, { passive: true });
      raf = requestAnimationFrame(loop);

      return () => {
        document.removeEventListener('mousemove', onMove);
        cancelAnimationFrame(raf);
      };
    }
  }, []);

  return (
    <>
      <style>{`
        /* Native cursor remains visible; this is only a subtle cursor accent. */
        .cursor {
          position: fixed;
          top: 0;
          left: 0;
          width: 15px;
          height: 15px;
          background: #ffffff;
          border-radius: 50%;
          pointer-events: none;
          mix-blend-mode: difference;
          z-index: 999999;
          transform: translate(-50%, -50%);
          will-change: transform;
        }

        .cursor.cc-hover {
          transform: scale(1.5);
        }

        /* Hide on touch / coarse devices */
        @media (hover: none), (pointer: coarse) {
          .cursor { display: none !important; }
        }
      `}</style>

      <div ref={dotRef} className="cursor" id="cursor" />
    </>
  );
}

export default CustomCursor;
