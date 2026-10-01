import { useEffect } from 'react';

/**
 * Partner — converted from `.section-partner` in index-v2.html
 *
 * Runs a CSS marquee for the partner logos.
 */

const PARTNERS = [
  '/assets/images/partner/1.svg',
  '/assets/images/partner/2.svg',
  '/assets/images/partner/3.svg',
  '/assets/images/partner/4.svg',
  '/assets/images/partner/5.svg',
  '/assets/images/partner/6.svg',
  '/assets/images/partner/7.svg',
  '/assets/images/partner/10.svg',
  '/assets/images/partner/11.svg',
];

function Partner() {
  /* Inject CSS marquee keyframe once */
  useEffect(() => {
    const id = 'partner-marquee-style';
    let style = document.getElementById(id);
    if (!style) {
      style = document.createElement('style');
      style.id = id;
      document.head.appendChild(style);
    }
    style.textContent = `
      @keyframes partner-marquee {
        0%   { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
      .partner-track {
        display: flex;
        width: max-content;
        animation: partner-marquee 30s linear infinite;
      }
      .partner-track:hover { animation-play-state: paused; }
      .partner-track img {
        flex-shrink: 0;
        height: 95px;
        width: auto;
        max-width: 220px;
        margin: 0 40px;
        object-fit: contain;
        filter: brightness(0);
        opacity: 0.7;
        transition: opacity 0.2s;
      }
      .partner-track img:hover {
        opacity: 1;
      }
    `;
    return () => {
      style.remove();
    };
  }, []);

  /* Duplicate the list to create seamless loop */
  const items = [...PARTNERS, ...PARTNERS, ...PARTNERS, ...PARTNERS];

  return (
    <div className="section-partner">
      <div className="container">
        <div className="row">
          <div className="col-12">
            <div className="partner-wrap">
              <p className="text-secondary text fw-semibold">
                Trusted by 100+ <br /> Clients
              </p>
              <div className="infiniteSlide_tech_main d-grid" style={{
                overflow: 'hidden',
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)',
                maskImage: 'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)',
              }}>
                <div className="partner-track">
                  {items.map((src, i) => (
                    <img loading="lazy" key={i} src={src} alt="" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Partner;
