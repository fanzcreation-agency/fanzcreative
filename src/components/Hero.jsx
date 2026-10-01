import { useEffect, useState, useRef, useCallback } from 'react';
import { playHover, playTick } from '../hooks/useSound';
import { useScrollFade } from '../hooks/useScrollFade';
import { videoMedia } from '../media';

/* ─────────────────────────────────────────────────────────────────────
   VideoModal — animated open/close
   ───────────────────────────────────────────────────────────────────── */
function VideoModal({ onClose }) {
  const [phase, setPhase] = useState('entering'); // 'entering' | 'open' | 'closing'

  // Animate in
  useEffect(() => {
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => setPhase('open'));
    });
    return () => cancelAnimationFrame(t);
  }, []);

  // Trigger close: animate out, then unmount
  const handleClose = useCallback(() => {
    setPhase('closing');
    setTimeout(() => onClose(), 420);
  }, [onClose]);

  // Close on backdrop click
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) handleClose();
  }, [handleClose]);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleClose]);

  const isOpen = phase === 'open';
  const isClosing = phase === 'closing';

  return (
    <>
      <style>{`
        .vm-backdrop {
          position: fixed;
          inset: 0;
          z-index: 100000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: rgba(0, 0, 0, 0);
          backdrop-filter: blur(0px);
          -webkit-backdrop-filter: blur(0px);
          transition: background 0.4s ease, backdrop-filter 0.4s ease, -webkit-backdrop-filter 0.4s ease;
        }
        .vm-backdrop.open {
          background: rgba(0, 0, 0, 0.92);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
        .vm-content {
          position: relative;
          width: 100%;
          max-width: 960px;
          aspect-ratio: 16 / 9;
          background: #000;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 30px 80px rgba(0,0,0,0.9), 0 0 40px rgba(10,249,207,0.3);
          border: 1px solid rgba(255,255,255,0.15);
          transform: scale(0.88) translateY(32px);
          opacity: 0;
          transition: transform 0.42s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease;
        }
        .vm-content.open {
          transform: scale(1) translateY(0);
          opacity: 1;
        }
        .vm-content.closing {
          transform: scale(0.88) translateY(32px);
          opacity: 0;
        }
        .vm-close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: rgba(10, 10, 10, 0.56);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(255,255,255,0.24);
          color: #fff;
          font-size: 18px;
          line-height: 1;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
          transition: background 0.25s ease, border-color 0.25s ease, color 0.25s ease;
        }
        .vm-close-btn:hover {
          background: #ffffff;
          border-color: #ffffff;
          color: #000000;
        }
        .vm-video { pointer-events: auto; }
      `}</style>

      <div
        className={`vm-backdrop${isOpen ? ' open' : ''}`}
        onClick={handleBackdropClick}
      >
        <div className={`vm-content${isOpen ? ' open' : ''}${isClosing ? ' closing' : ''}`}>
          <button className="vm-close-btn" onClick={handleClose} aria-label="Close video">✕</button>
          <video
            className="vm-video"
            src={videoMedia.promo.url}
            poster={videoMedia.promo.poster}
            autoPlay
            controls
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      </div>
    </>
  );
}

/**
 * Hero Section — Exact Animation Replica of Palmer Framer Template
 *
 * Sequence:
 * Stage 0 (0ms - 800ms): Screen is black. "FanzCreative™" is centered on screen in dark grey.
 *                        A white fill line sweeps left-to-right across the text, filling it crisp white.
 * Stage 1 (800ms - 1800ms): "FanzCreative™" smoothly glides down from screen center to its hero bottom placement.
 *                           Simultaneously, topbar, headline lines, video card, and bottom metadata bar unmask and slide into view around it.
 * Stage 2 (1800ms+): Full hero active and interactive.
 */
function Hero() {
  const sectionRef = useRef(null);
  const [stage, setStage] = useState(0); // 0: loading sweep, 1: morphing to position, 2: active
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  useScrollFade(sectionRef);

  useEffect(() => {
    // Stage 0 -> Stage 1: White sweep finishes, text morphs/glides to bottom
    const t1 = setTimeout(() => {
      setStage(1);
    }, 850);

    // Stage 1 -> Stage 2: Animation complete, fully interactive
    const t2 = setTimeout(() => {
      setStage(2);
    }, 1900);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <section
      className={`palmer-exact-hero stage-${stage}`}
      ref={sectionRef}
    >
      {/* Top Header Bar inside Hero */}
      <div className="palmer-hero-topbar">
        <div className="palmer-brand-logo">
          FanzCreative<sup>®</sup>
        </div>
        <div className="palmer-quick-links">
          <div className="quick-links-title">Quick Links</div>
          <nav className="quick-links-nav">
            <a href="/" onClick={playTick} onMouseEnter={playHover}>Home</a>,{' '}
            <a href="/about" onClick={playTick} onMouseEnter={playHover}>About</a>,{' '}
            <a href="#services" onClick={playTick} onMouseEnter={playHover}>Services</a>,{' '}
            <a href="/works" onClick={playTick} onMouseEnter={playHover}>Works</a>,{' '}
            <a href="/blog" onClick={playTick} onMouseEnter={playHover}>Blog</a>,{' '}
            <a href="/contact" onClick={playTick} onMouseEnter={playHover}>Contact</a>
          </nav>
        </div>
      </div>

      {/* Main Split Content Section */}
      <div className="palmer-hero-middle-grid">
        {/* Left Column: Masked Line-by-Line Headline Reveal */}
        <div className="palmer-hero-headline-col">
          <h1 className="palmer-hero-title">
            <span className="line-mask">
              <span className="line-text text-delay-1">We Design</span>
            </span>
            <br />
            <span className="line-mask">
              <span className="line-text text-delay-2">Digital Experiences</span>
            </span>
            <br />
            <span className="line-mask">
              <span className="line-text text-delay-3">That Make Your Brand</span>
            </span>
            <br />
            <span className="line-mask">
              <span className="line-text text-delay-4">
                Unforgettable.
              </span>
            </span>
          </h1>
        </div>

        {/* Right Column: Featured Video Showcase Card */}
        <div className="palmer-hero-video-col">
          <div
            className="palmer-video-card"
            style={{ cursor: 'pointer' }}
            onClick={() => setVideoModalOpen(true)}
            onMouseEnter={playHover}
          >
            <img
              src={videoMedia.promo.poster}
              alt="FanzCreative showreel preview"
              className="palmer-video-element"
              fetchPriority="high"
            />
            {/* Center Play Overlay Icon */}
            <div className="palmer-video-brand-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8.5 5.5v13l10-6.5-10-6.5z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Giant Typography Banner (Centered on Stage 0, Glides down on Stage 1) */}
      <div className="palmer-hero-giant-banner">
        <div className="banner-mask">
          <h2 className="giant-brand-text">
            FanzCreative<span className="giant-tm">™</span>
          </h2>
        </div>
      </div>

      {/* Bottom Footer Metadata */}
      <div className="palmer-hero-bottombar">
        <div className="palmer-bottom-left">
          © CURATED DIGITAL EXPERIENCES
        </div>
        <div className="palmer-bottom-center">
          (CREATIVE STUDIO)
        </div>
        <div className="palmer-bottom-right">
          DIGITAL CREATIVE AGENCY
        </div>
      </div>

      {/* Full-screen Video Modal Popup — animated open/close */}
      {videoModalOpen && (
        <VideoModal onClose={() => setVideoModalOpen(false)} />
      )}

      {/* Scoped CSS Animations */}
      <style>{`
        .palmer-exact-hero {
          background-color: #000000;
          color: #ffffff;
          min-height: 100vh;
          padding: 36px 48px 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif;
          box-sizing: border-box;
          position: relative;
          overflow: hidden;
        }

        /* Top Header Bar Entry Animation */
        .palmer-hero-topbar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding-bottom: 32px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          opacity: 0;
          transform: translateY(-24px);
          transition: transform 1s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.8s ease;
        }

        .stage-1 .palmer-hero-topbar,
        .stage-2 .palmer-hero-topbar {
          opacity: 1;
          transform: translateY(0);
          transition-delay: 0.2s;
        }

        .palmer-brand-logo {
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #ffffff;
        }

        .palmer-brand-logo sup {
          font-size: 13px;
          font-weight: 400;
          margin-left: 2px;
        }

        .palmer-quick-links {
          text-align: right;
        }

        .quick-links-title {
          font-size: 11px;
          font-weight: 700;
          color: #ffffff;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }

        .quick-links-nav {
          font-size: 13px;
          color: #a1a1aa;
        }

        .quick-links-nav a {
          color: #a1a1aa;
          text-decoration: none;
          display: inline-block;
          transition: color 0.25s ease, transform 0.25s ease;
        }

        .quick-links-nav a:hover {
          color: #ffffff;
          transform: translateY(-1px);
        }

        /* Middle Grid Layout */
        .palmer-hero-middle-grid {
          display: grid;
          grid-template-columns: 1fr 440px;
          gap: 60px;
          align-items: flex-start;
          margin-top: 24px;
          margin-bottom: 20px;
        }

        /* Headline Masked Entry Animation */
        .palmer-hero-title {
          font-size: clamp(2.4rem, 4.8vw, 4.4rem);
          line-height: 1.08;
          font-weight: 600;
          letter-spacing: -0.03em;
          color: #ffffff;
          margin: 0;
        }

        .line-mask {
          display: inline-block;
          overflow: hidden;
          vertical-align: top;
          padding-bottom: 4px;
        }

        .line-text {
          display: inline-block;
          opacity: 0;
          transform: translateY(110%) skewY(4deg);
          transition: transform 1s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.9s ease;
          will-change: transform, opacity;
        }

        .stage-1 .text-delay-1, .stage-2 .text-delay-1 {
          opacity: 1;
          transform: translateY(0) skewY(0deg);
          transition-delay: 0.2s;
        }

        .stage-1 .text-delay-2, .stage-2 .text-delay-2 {
          opacity: 1;
          transform: translateY(0) skewY(0deg);
          transition-delay: 0.35s;
        }

        .stage-1 .text-delay-3, .stage-2 .text-delay-3 {
          opacity: 1;
          transform: translateY(0) skewY(0deg);
          transition-delay: 0.5s;
        }

        .stage-1 .text-delay-4, .stage-2 .text-delay-4 {
          opacity: 1;
          transform: translateY(0) skewY(0deg);
          transition-delay: 0.65s;
        }

        .japanese-accent {
          font-weight: 400;
        }

        /* Video Showcase Card Animation & Hover */
        .palmer-hero-video-col {
          display: flex;
          justify-content: flex-end;
        }

        .palmer-video-card {
          width: 100%;
          max-width: 440px;
          height: 310px;
          border-radius: 22px;
          overflow: hidden;
          position: relative;
          background: #111115;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
          opacity: 0;
          transform: scale(0.9) translateY(30px);
          filter: blur(14px);
          transition: transform 1.1s cubic-bezier(0.16, 1, 0.3, 1),
                      opacity 1.1s ease,
                      filter 1.1s ease,
                      box-shadow 0.4s ease;
          cursor: pointer;
        }

        .stage-1 .palmer-video-card,
        .stage-2 .palmer-video-card {
          opacity: 1;
          transform: scale(1) translateY(0);
          filter: blur(0px);
          transition-delay: 0.4s;
        }

        .palmer-video-card:hover {
          box-shadow: 0 24px 52px rgba(0, 0, 0, 0.78);
        }

        .palmer-video-element {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .palmer-video-brand-icon {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 58px;
          height: 58px;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.72);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #050505;
          pointer-events: none;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.28);
          transition: background 0.3s ease, border-color 0.3s ease;
        }

        .palmer-video-brand-icon::before,
        .palmer-video-brand-icon::after {
          content: '';
          position: absolute;
          inset: -9px;
          border-radius: inherit;
          border: 1px solid rgba(255, 255, 255, 0.48);
          animation: play-sonar 2.2s ease-out infinite;
          pointer-events: none;
        }

        .palmer-video-brand-icon::after {
          animation-delay: 1.1s;
        }

        @keyframes play-sonar {
          0% {
            opacity: 0.65;
            transform: scale(0.78);
          }
          100% {
            opacity: 0;
            transform: scale(1.65);
          }
        }

        .palmer-video-brand-icon svg {
          width: 20px;
          height: 20px;
          margin-left: 2px;
          position: relative;
          z-index: 1;
          fill: none;
        }

        .palmer-video-card:hover .palmer-video-brand-icon {
          background: #ffffff;
          border-color: #ffffff;
        }

        /* Giant Banner Typography Morphing & Glide Animation */
        .palmer-hero-giant-banner {
          width: 100%;
          margin: 16px 0 8px;
          overflow: hidden;
          line-height: 0.85;
          position: relative;
          z-index: 10;
        }

        .banner-mask {
          overflow: hidden;
        }

        .giant-brand-text {
          font-size: clamp(4.5rem, 15.5vw, 16.5rem);
          font-weight: 800;
          letter-spacing: -0.04em;
          margin: 0;
          white-space: nowrap;
          line-height: 0.82;
          display: block;
          width: 100%;
          text-align: left;
          will-change: transform, background-position, opacity;
          
          /* Left-to-right white text fill gradient sweep */
          background: linear-gradient(90deg, #ffffff 0%, #ffffff 45%, rgba(255, 255, 255, 0.14) 55%, rgba(255, 255, 255, 0.14) 100%);
          background-size: 250% 100%;
          background-position: 100% 0;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;

          /* Stage 0 position: Center of viewport */
          transform: translateY(calc(-35vh + 40px));
          transition: transform 1.25s cubic-bezier(0.16, 1, 0.3, 1),
                      background-position 0.75s ease-in-out;
        }

        /* Stage 0: Text sweep fills left-to-right */
        .stage-0 .giant-brand-text {
          background-position: 0% 0;
        }

        /* Stage 1 & 2: Text glides smoothly from viewport center to its hero placement */
        .stage-1 .giant-brand-text,
        .stage-2 .giant-brand-text {
          background-position: 0% 0;
          transform: translateY(0);
        }

        .giant-tm {
          font-size: 0.35em;
          vertical-align: super;
          font-weight: 700;
          margin-left: -0.02em;
        }

        /* Bottom Footer Bar Animation */
        .palmer-hero-bottombar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #888888;
          font-weight: 600;
          opacity: 0;
          transform: translateY(16px);
          transition: transform 0.9s ease, opacity 0.9s ease;
        }

        .stage-1 .palmer-hero-bottombar,
        .stage-2 .palmer-hero-bottombar {
          opacity: 1;
          transform: translateY(0);
          transition-delay: 0.6s;
        }

        /* Responsive Breakpoints */
        @media (max-width: 1024px) {
          .palmer-exact-hero {
            padding: 24px;
          }

          .palmer-hero-middle-grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }

          .palmer-hero-video-col {
            justify-content: flex-start;
          }

          .palmer-video-card {
            max-width: 100%;
            height: 320px;
          }

          .giant-brand-text {
            transform: translateY(calc(-25vh + 30px));
          }

          .stage-1 .giant-brand-text,
          .stage-2 .giant-brand-text {
            transform: translateY(0);
          }
        }

        @media (max-width: 640px) {
          .palmer-hero-topbar {
            flex-direction: column;
            gap: 16px;
          }

          .palmer-quick-links {
            text-align: left;
          }

          .palmer-hero-title {
            font-size: 2rem;
          }

          .giant-brand-text {
            font-size: 3.8rem;
          }

          .palmer-hero-bottombar {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .palmer-bottom-center {
            display: none;
          }
        }
      `}</style>
    </section>
  );
}

export default Hero;
