import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useScrollFade } from '../hooks/useScrollFade';
import AnimatedTitleIcon from '../components/AnimatedTitleIcon';
import Pricing from '../components/Pricing';
import FAQs from '../components/FAQs';
import Contact from '../components/Contact';
import { MouseFollowImage, WORKS } from '../components/FeaturedWorks';
import { SLUGS } from '../constants';
import { playClick, playHover } from '../hooks/useSound';

function WorksPage() {
  const pageRef = useRef(null);
  useScrollFade(pageRef);
  const [layoutMode, setLayoutMode] = useState('single');

  useEffect(() => {
    // If we want the hover effect, we can just use MouseFollowImage component for images
    // I will replace standard image with MouseFollowImage.
  }, []);

  return (
    <div ref={pageRef} className="works-page-wrapper">
      <Helmet>
        <title>Works - FanzCreative</title>
      </Helmet>

      {/* Hero Banner */}
      <div className="section-hero v1">
        <div className="hero-image">
        </div>
        <div className="container">
          <div className="content-wrap text-center">
            <div className="title text-display-2 effectFade fadeZoom">
              <span className="title1 fw-semibold text-gradient-1">Explore Our Finest</span>
              <br />
              <div className="title2 d-flex gap-20 justify-content-center flex-wrap align-items-center">
                <span className="fw-semibold text-gradient-1">AI Work</span>
                <AnimatedTitleIcon style={{ transform: 'translateY(16px)' }} />
              </div>
            </div>
            <p className="text effectFade fadeUp">
              Where innovation meets intelligence. Discover data-driven solutions, smart automation, and <br /> transformative projects shaping the future of businesses worldwide.
            </p>
          </div>
        </div>
      </div>

      {/* section-featured-works */}
      <div id="works" className="section-featured-works flat-spacing">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-40">
            <div className="heading-section mb-0">
              <div className="heading-sub fw-semibold effectFade fadeUp" style={{ margin: 0 }}>Featured Works</div>
            </div>
            <div className="layout-toggle d-flex gap-12 align-items-center effectFade fadeUp">
              <button 
                onClick={() => { setLayoutMode('single'); playClick(); }}
                onMouseEnter={playHover}
                style={{
                  background: layoutMode === 'single' ? '#0af9cf' : 'transparent',
                  border: '1px solid #0af9cf',
                  color: layoutMode === 'single' ? '#fff' : '#0af9cf',
                  width: '40px', height: '40px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.3s ease'
                }}
                aria-label="List View"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                  <line x1="3" y1="6" x2="3.01" y2="6"></line>
                  <line x1="3" y1="12" x2="3.01" y2="12"></line>
                  <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
              </button>
              <button 
                onClick={() => { setLayoutMode('grid'); playClick(); }}
                onMouseEnter={playHover}
                style={{
                  background: layoutMode === 'grid' ? '#0af9cf' : 'transparent',
                  border: '1px solid #0af9cf',
                  color: layoutMode === 'grid' ? '#fff' : '#0af9cf',
                  width: '40px', height: '40px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.3s ease'
                }}
                aria-label="Grid View"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              </button>
            </div>
          </div>
          <div className={`featured-works-list position-relative ${layoutMode === 'grid' ? 'grid-mode' : ''}`}>
            {WORKS.map((work, i) => {
              const titleLines = work.title.split('\n');
              const deliverableLines = work.deliverables.split('\n');

              return (
                <div key={i} className={`featured-works-item${i === 0 ? ' effectFade fadeUp no-div' : ''}`}>
                  <MouseFollowImage 
                    src={work.img} 
                    alt={work.title.replace('\n', ' ')}
                    href={`/project/${SLUGS[i]}`} 
                  />
                  <div className="content">
                    <div className="pagi-dot">
                      {[0, 1, 2, 3].map((d) => (
                        <span key={d} className={d === work.activeDot ? 'active' : ''}></span>
                      ))}
                    </div>
                    <div className="bot">
                      <h4 className="heading fw-semibold">
                        {titleLines[0]} {titleLines[1] && <><br /> {titleLines[1]}</>}
                      </h4>
                      <div className="grid-text">
                        <div className="item">
                          <div className="title text-secondary">DESCRIPTION</div>
                          <div className="text-body-3 fw-semibold">{work.desc}</div>
                        </div>
                        <div className="item">
                          <div className="title text-secondary">DELIVERABLES</div>
                          <div className="fw-semibold text-body-3">
                            {deliverableLines.map((line, index) => (
                              <span key={line}>
                                {line}
                                {index < deliverableLines.length - 1 && <br />}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="item">
                          <div className="title text-secondary">INDUSTRY</div>
                          <div className="fw-semibold text-body-3">{work.industry}</div>
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

      <div className="box-white">
        {/* section-value */}
        <div className="section-delay flat-spacing">
          <div className="container">
            <div className="heading-section center mb-64">
              <div className="heading-sub fw-semibold effectFade fadeUp">The Value We Bring</div>
              <div className="heading-title text-gradient-3 effectFade fadeRotateX">
                Partner with us to accelerate <br /> your digital growth.
              </div>
            </div>
            <div className="delay-wrap">
              <div className="delay-item">
                <div className="left">
                  <h6 className="effectFade fadeUp title fw-semibold mb-12">Streamlined Operations Drive Growth</h6>
                  <h6 className="effectFade fadeUp title fw-semibold">/ 01</h6>
                </div>
                <div className="right">
                  <div className="delay-progress mb-12">
                    <div className="progress-line" style={{ width: '90%', backgroundColor: '#0af9cf' }}></div>
                    <h4 className="number-progress fw-semibold text-white">90%</h4>
                  </div>
                  <div className="text text-secondary text-end">/Efficiency</div>
                </div>
              </div>
              <div className="delay-item">
                <div className="left">
                  <h6 className="effectFade fadeUp title fw-semibold mb-12">Innovative Solutions Keep You Ahead</h6>
                  <h6 className="effectFade fadeUp title fw-semibold">/ 02</h6>
                </div>
                <div className="right">
                  <div className="delay-progress mb-12">
                    <div className="progress-line" style={{ width: '85%', backgroundColor: '#0af9cf' }}></div>
                    <h4 className="number-progress fw-semibold text-white">85%</h4>
                  </div>
                  <div className="text text-secondary text-end">/Innovation</div>
                </div>
              </div>
              <div className="delay-item">
                <div className="left">
                  <h6 className="effectFade fadeUp title fw-semibold mb-12">Automation Unlocks True Potential</h6>
                  <h6 className="effectFade fadeUp title fw-semibold">/ 03</h6>
                </div>
                <div className="right">
                  <div className="delay-progress mb-12">
                    <div className="progress-line" style={{ width: '95%', backgroundColor: '#0af9cf' }}></div>
                    <h4 className="number-progress fw-semibold text-white">95%</h4>
                  </div>
                  <div className="text text-secondary text-end">/Opportunities</div>
                </div>
              </div>
              <div className="delay-item">
                <div className="left">
                  <h6 className="effectFade fadeUp title fw-semibold mb-12">Creative Freedom Enhances Output</h6>
                  <h6 className="effectFade fadeUp title fw-semibold">/ 04</h6>
                </div>
                <div className="right">
                  <div className="delay-progress mb-12">
                    <div className="progress-line" style={{ width: '98%', backgroundColor: '#0af9cf' }}></div>
                    <h4 className="number-progress fw-semibold text-white">98%</h4>
                  </div>
                  <div className="text text-secondary text-end">/Creative Focus</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Pricing />
      </div>

      <FAQs className="" />
      <Contact />

      <style>{`
        .featured-works-list.grid-mode {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 40px;
        }
        @media (max-width: 991px) {
          .featured-works-list.grid-mode {
            grid-template-columns: 1fr;
          }
        }
        .featured-works-list.grid-mode .featured-works-item {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .featured-works-list.grid-mode .featured-works-item .image {
          height: 400px;
          border-radius: 24px;
        }
        .featured-works-list.grid-mode .featured-works-item .image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .featured-works-list.grid-mode .featured-works-item .content {
          padding: 24px 12px 24px 12px;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }
        .featured-works-list.grid-mode .featured-works-item .content .bot {
          flex-direction: column;
          gap: 16px;
        }
        .featured-works-list.grid-mode .featured-works-item .content .bot .heading {
          width: 100%;
        }
        .featured-works-list.grid-mode .featured-works-item .content .grid-text {
          width: 100%;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px 16px;
        }
        .featured-works-list.grid-mode .featured-works-item .content .grid-text .item {
          width: 100% !important;
        }
        .featured-works-list.grid-mode .featured-works-item .content .grid-text .item:nth-child(1) {
          grid-column: span 2;
        }
      `}</style>
    </div>
  );
}

export default WorksPage;
