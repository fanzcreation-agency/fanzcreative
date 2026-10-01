import { useRef, useState } from 'react';
import { useScrollFade } from '../hooks/useScrollFade';
import { playSwoosh, playTap, playHover } from '../hooks/useSound';

const SERVICE_ITEMS = [
  {
    id: 1,
    title: 'Web Design',
    marqueeTitle: 'Web Design',
    img: '/assets/images/item/service-web-design.webp',
    desc: 'We craft modern, responsive websites that engage audiences and drive real conversion.',
    tags: ['UI/UX Design', 'Wireframing', 'Prototyping', 'Design Systems'],
  },
  {
    id: 2,
    title: 'Brand Design',
    marqueeTitle: 'Brand Design',
    img: '/assets/images/item/service-branding.webp',
    desc: 'We build bold, cohesive brand identities that leave a lasting impression.',
    tags: ['Visual Identity', 'Style Guides', 'Brand Strategy'],
  },
  {
    id: 3,
    title: 'Motion Design',
    marqueeTitle: 'Motion Design',
    img: '/assets/images/item/service-motion-design.gif',
    desc: 'We animate brands with captivating 2D and 3D motion graphics that demand attention.',
    tags: ['2D Animation', '3D Motion', 'Logo Motion', 'Explainer Videos'],
  },
  {
    id: 4,
    title: 'Website Development',
    marqueeTitle: 'Web Development',
    img: '/assets/images/item/service-web-dev.webp',
    desc: 'We build fast, scalable digital products engineered with modern code.',
    tags: ['React & Next.js', 'Full-Stack', 'E-Commerce', 'Performance'],
  },
];

function Services() {
  const sectionRef = useRef(null);
  useScrollFade(sectionRef);

  const [activeId, setActiveId] = useState(2); // Default to Brand Design like Framer site
  const [imgVisible, setImgVisible] = useState(true);

  const activeItem = SERVICE_ITEMS.find((s) => s.id === activeId) || SERVICE_ITEMS[1];

  const handleTabClick = (id) => {
    if (id === activeId) return;
    setImgVisible(false);
    setTimeout(() => {
      setActiveId(id);
      setImgVisible(true);
    }, 180);
  };

  // Repeated marquee items
  const marqueeItems = Array(8).fill(activeItem.marqueeTitle);

  return (
    <div
      id="services"
      className="section-services"
      ref={sectionRef}
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '90px 0 100px 0',
        backgroundColor: '#E5E5E5', // Sleek light-grey section background from Framer
        color: '#111111',
        width: '100%',
      }}
    >
      <style>{`
        @keyframes framerMarquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .framer-marquee-track {
          display: flex;
          align-items: center;
          white-space: nowrap;
          width: max-content;
          animation: framerMarquee 25s linear infinite;
        }
        .framer-tab-btn {
          background: transparent;
          border: none;
          outline: none;
          font-size: 15px;
          font-weight: 500;
          color: #666666;
          cursor: pointer;
          transition: color 0.25s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 0;
        }
        .framer-tab-btn:hover {
          color: #111111;
        }
        .framer-tab-btn.active {
          color: #0af9cf;
          font-weight: 600;
        }
        .framer-pill-badge {
          padding: 8px 18px;
          border-radius: 999px;
          background-color: #4A4D52;
          color: #FFFFFF;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.01em;
          transition: all 0.2s ease;
          cursor: pointer;
          display: inline-block;
          border: none;
        }
        .framer-pill-badge:hover {
          background-color: #222222;
          transform: translateY(-1px);
        }
        .framer-card-box {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 620px;
          height: 390px;
          border-radius: 32px;
          overflow: hidden;
          box-shadow: 0 25px 60px -10px rgba(0, 0, 0, 0.18), 0 0 1px rgba(0, 0, 0, 0.1);
          background-color: #1a1a1a;
          margin: 0 auto;
        }
        .framer-marquee-container {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100vw;
          overflow: hidden;
          pointer-events: none;
          z-index: 1;
          padding: 20px 0;
          /* Signature Framer edge fade gradient mask */
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%);
          mask-image: linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%);
        }
        @media (max-width: 768px) {
          .framer-card-box {
            height: 250px;
            border-radius: 20px;
          }
          .framer-tab-btn {
            font-size: 14px;
          }
        }
      `}</style>

      {/* Header Container */}
      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        {/* Subtitle Tag */}
        <div
          className="effectFade fadeUp"
          style={{
            fontSize: '14px',
            color: '#666666',
            fontWeight: 400,
            marginBottom: '6px',
            letterSpacing: '0.01em',
          }}
        >
          (Capabilities)
        </div>

        {/* Section Heading */}
        <h2
          className="effectFade fadeUp"
          style={{
            fontSize: 'clamp(2.5rem, 5.5vw, 4rem)',
            fontWeight: 700,
            color: '#0d0d0d',
            letterSpacing: '-0.03em',
            margin: '0 0 28px 0',
            lineHeight: 1.1,
          }}
        >
          What We Offer
        </h2>
      </div>

      {/* Full-width Screen Line Separator */}
      <div
        style={{
          width: '100%',
          height: '1px',
          backgroundColor: 'rgba(0, 0, 0, 0.12)',
          marginBottom: '32px',
        }}
      />

      {/* Main Content Container for Tabs and Cards */}
      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        {/* Horizontal Service Tabs Bar */}
        <div
          className="d-flex justify-content-between align-items-center flex-wrap gap-3 effectFade fadeUp"
          style={{ marginBottom: '40px' }}
        >
          {SERVICE_ITEMS.map((item) => {
            const isOpen = item.id === activeId;
            return (
              <button
                key={item.id}
                className={`framer-tab-btn ${isOpen ? 'active' : ''}`}
                onClick={() => {
                  handleTabClick(item.id);
                  playSwoosh();
                }}
                onMouseEnter={playHover}
                type="button"
              >
                {isOpen && (
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor: '#0af9cf',
                      display: 'inline-block',
                    }}
                  />
                )}
                {item.title}
              </button>
            );
          })}
        </div>

        {/* Stage Container */}
        <div
          className="position-relative d-flex flex-column align-items-center justify-content-center"
          style={{ minHeight: '440px', padding: '10px 0' }}
        >
          {/* Framer-Style Edge-Faded Full-Width Marquee Background */}
          <div className="framer-marquee-container">
            <div className="framer-marquee-track">
              {marqueeItems.map((txt, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2.5rem',
                    paddingRight: '2.5rem',
                    paddingBottom: '0.15em',
                  }}
                >
                  <span
                    style={{
                      fontSize: 'clamp(4.5rem, 9vw, 7.5rem)',
                      fontWeight: 800,
                      color: '#0af9cf',
                      letterSpacing: '-0.02em',
                      lineHeight: 1.25,
                      paddingBottom: '0.1em',
                      display: 'inline-block',
                    }}
                  >
                    {txt}
                  </span>
                  {/* Framer Star / Cross Separator Symbol */}
                  <span
                    style={{
                      fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
                      color: '#0af9cf',
                      fontWeight: 300,
                      opacity: 0.85,
                      lineHeight: 1,
                    }}
                  >
                    ✖
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Center Showcase Card */}
          <div className="framer-card-box effectFade fadeUp">
            <img
              loading="lazy"
              src={activeItem.img}
              alt={activeItem.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: imgVisible ? 1 : 0,
                transition: 'opacity 0.25s ease, transform 0.4s ease',
                transform: imgVisible ? 'scale(1)' : 'scale(1.02)',
              }}
            />
          </div>

          {/* Description & Dark Pill Badges */}
          <div
            className="text-center effectFade fadeUp"
            style={{
              marginTop: '60px',
              maxWidth: '520px',
              position: 'relative',
              zIndex: 3,
            }}
          >
            <p
              style={{
                fontSize: '15px',
                color: '#333333',
                lineHeight: 1.6,
                marginBottom: '20px',
                fontWeight: 400,
                opacity: imgVisible ? 1 : 0,
                transition: 'opacity 0.25s ease',
              }}
            >
              {activeItem.desc}
            </p>

            {/* Dark Pill Badges */}
            <div className="d-flex flex-wrap justify-content-center gap-2">
              {activeItem.tags.map((tag) => (
                <span
                  key={tag}
                  className="framer-pill-badge"
                  onClick={() => playTap()}
                  onMouseEnter={() => playHover()}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Services;
