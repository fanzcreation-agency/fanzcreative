import { useRef } from 'react';
import { useScrollFade } from '../hooks/useScrollFade';
import { playPop, playHover } from '../hooks/useSound';

function Pricing() {
  const sectionRef = useRef(null);
  useScrollFade(sectionRef);

  const PLANS = [
    {
      icon: 'icon-paint-roller-solid',
      name: 'Starter Projects',
      sub: 'Landing Pages & Brand Refresh',
      desc: 'Ideal for startups and small businesses looking to launch quickly with a professional and high-converting online presence.',
      features: ['Landing Pages', 'Small Business Websites', 'Brand Refresh'],
      style: '',
      delay: null,
    },
    {
      icon: 'icon-desktop-solid',
      name: 'Growth Projects',
      sub: 'Custom Websites & Automations',
      desc: 'Bespoke designs, e-commerce, and advanced workflow integrations to scale your brand and streamline operations.',
      features: ['Custom Websites', 'Automation Systems', 'E-Commerce'],
      style: 'style-black',
      delay: '0.1',
    },
    {
      icon: 'icon-building',
      name: 'Enterprise Solutions',
      sub: 'Bespoke Platforms & AI Workflows',
      desc: 'Advanced software systems, custom platforms, and tailor-made AI automation workflows built for large-scale operations.',
      features: ['Custom Platforms', 'AI Workflows', 'Large Scale Systems'],
      style: '',
      delay: '0.2',
    },
  ];

  return (
    <div id="pricing" className="section-pricing flat-spacing" ref={sectionRef}>
      <div className="container">
        <div className="heading-section mb-80">
          <div className="heading-sub fw-semibold effectFade fadeUp">Project Tiers</div>
          <div className="heading-title text-gradient-3 gap-8 effectFade fadeRotateX no-div">
            Bespoke plans tailored to your scope
          </div>
        </div>

        <div className="row">
          {PLANS.map((plan) => (
            <div key={plan.name} className="col-lg-4 col-md-6 mb-24">
              <div
                className={`pricing-item h-100 effectFade fadeRotateX${plan.style ? ` ${plan.style}` : ''}`}
                data-delay={plan.delay || undefined}
              >
                <div className="top d-flex gap-12 align-items-center">
                  <div className="d-flex gap-8 align-items-center">
                    <i className={`icon ${plan.icon} fs-24`}></i>
                    <div className="fw-semibold text">{plan.name}</div>
                  </div>
                  <div className="line"></div>
                  <div className={`fw-semibold ${plan.style ? 'text-neutral-400' : 'text-secondary'}`} style={{ fontSize: '13px' }}>{plan.sub}</div>
                </div>

                <div className="heading" style={{ marginTop: 24, marginBottom: 24 }}>
                  <a href="#contact" className="tf-btn w-100 justify-content-center text-center" onClick={playPop} onMouseEnter={playHover}>Request Quote</a>
                </div>

                <div className="line"></div>

                <div className="content d-flex flex-column" style={{ gap: '16px' }}>
                  <div style={{ width: '100%' }}>
                    <div className="title fw-semibold mb-4">What's included</div>
                    <div className="text fw-semibold">{plan.desc}</div>
                  </div>
                  <ul className="list-text type-check" style={{ width: '100%', paddingLeft: 0 }}>
                    {plan.features.map((f) => (
                      <li key={f}>
                        <i className="icon icon-check-solid"></i>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Pricing;
