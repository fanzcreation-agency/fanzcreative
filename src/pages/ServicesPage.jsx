import { useEffect, useRef, useState } from 'react';
import { useScrollFade } from '../hooks/useScrollFade';
import { Helmet } from 'react-helmet-async';
import Partner from '../components/Partner';
import Process from '../components/Process';
import Pricing from '../components/Pricing';
import FAQs from '../components/FAQs';
import Contact from '../components/Contact';
import { playClick, playHover } from '../hooks/useSound';
import AnimatedTitleIcon from '../components/AnimatedTitleIcon';
import PrismaticBurst from '../components/PrismaticBurst';

const SERVICE_ITEMS = [
  {
    id: 1,
    title: 'Web Design',
    img: '/assets/images/item/service-web-design.webp',
    desc: 'Elevate your digital presence with a beautifully crafted website design. We focus on aesthetics, usability, and performance to create experiences that engage users.',
    tags: ['Concept', 'User flow', 'Wireframe', 'UI Design', 'Ux Design', 'Design Guidelines'],
  },
  {
    id: 2,
    title: 'Branding',
    img: '/assets/images/item/service-branding.webp',
    desc: 'Your brand design is your business\'s first impression — make it count. We develop strong visual identities that communicate your values and resonate with your audience.',
    tags: ['Logo Design', 'Brand Identity', 'Social media kit', 'Stationery Items', 'Presentation Design', 'Packaging Design'],
  },
  {
    id: 3,
    title: 'Motion Design',
    img: '/assets/images/item/service-motion-design.gif',
    desc: 'Motion graphics are a great way to add visual interest to your brand design. We create engaging animations that explain your product and bring your story to life.',
    tags: ['2d Animation', '3d Animation', 'Logo Animation', 'White Board Animation', 'Animate Your Presentations', 'Create Product Explainers'],
  },
  {
    id: 4,
    title: 'Website Development',
    img: '/assets/images/item/service-web-dev.webp',
    desc: 'From concept to reality, we bring your website to life. Our clean, efficient code ensures that your site is fast, responsive, and easy to manage.',
    tags: ['HTML', 'WordPress', 'Wix', 'Shopify', 'Squarespace', 'WooCommerce'],
  },
];

function ServicesPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const pageRef = useRef(null);
  useScrollFade(pageRef);

  const [openId, setOpenId] = useState(1);
  const toggle = (id) => setOpenId((cur) => (cur === id ? null : id));

  return (
    <div ref={pageRef} className="services-page-wrapper">
      <Helmet>
        <title>Services - FanzCreative</title>
        <meta name="description" content="Explore FanzCreative's services — web design, branding, motion design, and website development for modern businesses." />
      </Helmet>
      <style>{`
        .services-page-wrapper .section-hero.v1 .hero-image {
          background-image: none !important;
        }
      `}</style>
      {/* Hero Banner */}
      <div className="section-hero v1">
        <div
          className="hero-image"
          style={{ pointerEvents: 'none', zIndex: 0, borderRadius: 40, overflow: 'hidden', backgroundColor: '#000' }}
        >
          <PrismaticBurst intensity={1.5} speed={0.4} animationType="rotate3d" colors={['#0af9cf', '#7ef716', '#1a1a2e', '#16213e']} mixBlendMode="screen" />
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.45)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', zIndex: 1, pointerEvents: 'none' }}></div>
        </div>
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div className="content-wrap text-center">
            <div className="title text-display-2 effectFade fadeRotateX">
              <span className="title1 fw-semibold" style={{ color: '#ffffff' }}>Design Better with</span>
              <br />
              <div className="title2 d-flex gap-20 justify-content-center flex-wrap align-items-center">
                <span className="fw-semibold" style={{ color: '#ffffff' }}>Creative Services</span>
                <AnimatedTitleIcon style={{ transform: 'translateY(16px)' }} />
              </div>
            </div>
            <p className="text effectFade fadeUp" style={{ color: '#ffffff' }}>
              From brand identity to fully built websites — we cover every layer of the <br /> digital experience with design, motion, and development.
            </p>
          </div>
        </div>
      </div>

      {/* section-services */}
      <div id="services" className="section-services flat-spacing">
        <div className="container">
          <div className="top">
            <div className="heading-section center mb-48">
              <div className="heading-sub fw-semibold effectFade fadeUp">Services</div>
              <div className="heading-title text-gradient-3 effectFade fadeRotateX">End-to-End Creative Services</div>
            </div>
            <p className="text text-center effectFade fadeUp">
              We blend premium brand storytelling, visual design standards, and clean web <br /> development to build unforgettable digital experiences that elevate your business.
            </p>
          </div>
          <div className="accordion-faq_list gap-32">
            {SERVICE_ITEMS.map((item, index) => {
              const isOpen = openId === item.id;
              const num = String(index + 1).padStart(2, '0');

              return (
                <div
                  key={item.id}
                  className="accordion-faq_item style-1 effectFade fadeRotateX"
                  role="presentation"
                >
                  <div
                    className={`accordion-action${isOpen ? '' : ' collapsed'}`}
                    role="button"
                    aria-expanded={isOpen}
                    onClick={() => { toggle(item.id); playClick(); }}
                    onMouseEnter={playHover}
                  >
                    <div className="accordion-title">
                      {item.title}
                      <i className="icon icon-arrow-top-right"></i>
                    </div>
                  </div>
                  <div
                    className="faq-answer-panel"
                    style={{
                      display: 'grid',
                      gridTemplateRows: isOpen ? '1fr' : '0fr',
                      transition: 'grid-template-rows 0.4s ease',
                    }}
                  >
                    <div style={{ overflow: 'hidden' }}>
                      <div className="accordion-content">
                        <div className="image">
                          <img loading="lazy" src={item.img} alt="" />
                        </div>
                        <div className="content">
                          <div className="text-body-3 text-neutral-300 text">{item.desc}</div>
                          <div className="list-tags">
                            {item.tags.map((tag) => (
                              <a key={tag} href="#" className="tags-item fw-semibold" onClick={(e) => { e.preventDefault(); playClick(); }} onMouseEnter={playHover}>
                                {tag}
                              </a>
                            ))}
                          </div>
                          <div className="text-body-1 num">{num}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Partner />

      <div className="box-white">
        <Process className="" />
        <Pricing />
      </div>

      <FAQs className="" />
      <Contact />
    </div>
  );
}

export default ServicesPage;
