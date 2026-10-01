import { useRef, useState, useEffect } from 'react';
import { useScrollFade } from '../hooks/useScrollFade';
import { playClick } from '../hooks/useSound';

const STATS = [
  { label: 'PROJECTS DELIVERED', number: '180', prefix: '+' },
  { label: 'SATISFIED CLIENTS', number: '94', prefix: '+' },
  { label: 'ON-TIME DELIVERY', number: '98', prefix: '%' },
];

function Statistic() {
  const sectionRef = useRef(null);
  useScrollFade(sectionRef);
  const [active, setActive] = useState(0);
  const total = STATS.length;

  const prev = () => setActive((a) => (a - 1 + total) % total);
  const next = () => setActive((a) => (a + 1) % total);

  useEffect(() => {
    const timer = setInterval(next, 3500);
    return () => clearInterval(timer);
  }, []);

  const stat = STATS[active];
  const progress = ((active + 1) / total) * 100;

  return (
    <div className="section-statistic" ref={sectionRef}>
      <style>{`
        .section-statistic {
          overflow: visible !important;
          clip-path: none !important;
        }
        .section-statistic .container {
          overflow: visible !important;
        }
        .section-statistic .row {
          overflow: visible !important;
        }
        .section-statistic .col-md-6 {
          overflow: visible !important;
        }
        .section-statistic .statistic-slider {
          overflow: visible !important;
        }
        .section-statistic .swiper.swiper-progressbar {
          overflow: visible !important;
        }
        .section-statistic .swiper .title {
          overflow: visible !important;
        }
      `}</style>
      <div className="line"></div>
      <div className="container">
        <div className="row justify-content-between">

          {/* Left — heading */}
          <div className="col-md-6">
            <div className="heading-section mb-48">
              <div className="heading-sub fw-semibold style-1 effectFade fadeUp">Statistic</div>
              <div className="heading-title text-white effectFade fadeRotateX">
                Creative work, <br /> built for <br /> your brand
              </div>
            </div>
          </div>

          {/* Right — slider */}
          <div className="col-md-6">
            <div className="statistic-slider">
              <div className="text text-body-1 text-neutral-400 effectFade fadeUp">
                FanzCreative redesigned our entire brand in 3 weeks. The results were stunning — our enquiries doubled within a month.
              </div>

              {/* Progress bar + nav */}
              <div className="swiper swiper-progressbar">
                <div className="group-slider effectFade fadeUp">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${progress}%`, transition: 'width 0.4s ease' }}
                    ></div>
                  </div>
                  <div className="group-btn-slider">
                    <div className="btn-slider progressbar-prev" role="button" onClick={() => { prev(); playClick(); }}>
                      <i className="icon icon-angle-left-solid"></i>
                    </div>
                    <div className="btn-slider progressbar-next" role="button" onClick={() => { next(); playClick(); }}>
                      <i className="icon icon-angle-right-solid"></i>
                    </div>
                  </div>
                </div>

                {/* Stat number */}
                <div className="swiper-wrapper effectFade fadeUp">
                  <div className="swiper-slide">
                    <div className="title fw-semibold text-body-1">{stat.label}</div>
                    <div className="statistic-number">
                      <span className="number text-white fw-semibold">{stat.number}</span>
                      <span className="prefix text-brand">{stat.prefix}</span>
                    </div>
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

export default Statistic;
