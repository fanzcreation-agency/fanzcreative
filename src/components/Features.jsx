import { useRef } from 'react';
import { useScrollFade } from '../hooks/useScrollFade';

const LEFT_FEATURES = [
  { icon: 'icon-desktop-solid',      title: 'Web Design',     text: 'Pixel-perfect, responsive designs that captivate users and reflect your brand across every device.' },
  { icon: 'icon-paint-roller-solid', title: 'Branding',       text: 'Memorable logos, colour palettes, and brand systems that make your business instantly recognisable.' },
  { icon: 'icon-play-solid',         title: 'Motion Design',  text: 'Scroll-stopping animations and explainers that communicate complex ideas in seconds.' },
];
const RIGHT_FEATURES = [
  { icon: 'icon-code-solid',          title: 'Website Development', text: 'Clean, fast websites built on HTML, WordPress, Shopify, and more — delivered on time, every time.' },
  { icon: 'icon-bezier-curve-solid',  title: 'UI / UX Design',      text: 'Intuitive flows and interfaces grounded in user research so visitors convert and come back.' },
  { icon: 'icon-shopping-cart-solid', title: 'Packaging Design',    text: 'Shelf-ready packaging that tells your story, earns trust, and sells before a word is read.' },
];

function Features() {
  const sectionRef = useRef(null);
  useScrollFade(sectionRef);

  return (
    <div className="section-features flat-spacing pt-0" ref={sectionRef}>
      {/* Override CSS background → green gradient */}
      <style>{`
        .features-center {
          background: linear-gradient(135deg, #0af9cf 0%, #7ef716 100%) !important;
          box-shadow:
            0px 22.91px 37.08px 0px rgba(10,249,207,0.25),
            0px 56px 83px 0px rgba(126,247,22,0.20),
            0px 14px 34px 0px rgba(10,249,207,0.30),
            0px 1px 2px 0px rgba(126,247,22,0.4) !important;
        }
        .side-line-main .link-break-line .item.top,
        .side-line-main .link-break-line .item.bottom,
        .side-line-main .simu-electric.left,
        .side-line-main .simu-electric.right {
          background-color: #0af9cf !important;
          background-image: none !important;
        }
        .side-line-main .link-break-line .item.top {
          background: radial-gradient(circle at top right, #0af9cf 0%, transparent 90%) !important;
        }
        .side-line-main .link-break-line .item.bottom {
          background: radial-gradient(circle at bottom right, #0af9cf 0%, transparent 90%) !important;
        }
        .side-line-main .simu-electric.left {
          background: linear-gradient(to right, #0af9cf 0%, transparent 100%) !important;
        }
        .side-line-main .simu-electric.right {
          background: linear-gradient(to left, #0af9cf 0%, transparent 100%) !important;
        }
      `}</style>

      <div className="container">
        <div className="heading-section center mb-64">
          <div className="heading-sub fw-semibold effectFade fadeUp">What We Do</div>
          <div className="heading-title text-gradient-3 effectFade fadeRotateX">All Services in One Place</div>
        </div>
      </div>

      <div className="position-relative">
        <div className="container z-5">
          <div className="features-wrap justify-content-between">

            {/* Left column */}
            <div className="features-col col-left lg-mb-24">
              {LEFT_FEATURES.map((f) => (
                <div key={f.title} className="features-item effectFade fadeUp no-div">
                  <i className={`icon ${f.icon}`}></i>
                  <h6 className="title fw-semibold">{f.title}</h6>
                  <p className="text-secondary">{f.text}</p>
                </div>
              ))}
            </div>

            {/* Center logo — CSS handles size/shape; we just put the logo inside */}
            <div className="features-center flex-shrink">
              <img loading="lazy"
                src="/assets/images/logo/fanz-logo.webp"
                alt="FanzCreative"
                style={{
                  width: 120,
                  height: 'auto',
                  objectFit: 'contain',
                  filter: 'none',
                }}
              />
            </div>

            {/* Right column */}
            <div className="features-col col-right">
              {RIGHT_FEATURES.map((f) => (
                <div key={f.title} className="features-item effectFade fadeUp no-div" data-delay="0.1">
                  <i className={`icon ${f.icon}`}></i>
                  <h6 className="title fw-semibold">{f.title}</h6>
                  <p className="text-secondary">{f.text}</p>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Decorative side-line (desktop only) */}
        <div className="side-line-main d-none d-lg-block">
          <div className="container">
            <div className="row">
              <div className="col-lg-4 mx-auto">
                <div className="side-line-wrap">
                  <div className="link-break-line left">
                    <div className="link-break-line">
                      <span className="item top"></span>
                      <span className="item bottom"></span>
                    </div>
                  </div>
                  <div className="link-break-center">
                    <span className="simu-electric left"></span>
                    <span className="simu-electric right"></span>
                  </div>
                  <div className="link-break-line right">
                    <span className="item top"></span>
                    <span className="item bottom"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Features;
