import { useRef, useEffect, useCallback } from 'react';
import { useScrollFade } from '../hooks/useScrollFade';

const PROGRESS_ITEMS = [
  { icon: 'icon-star-solid',       label: 'Design Quality',    value: 95  },
  { icon: 'icon-clock-solid',      label: 'On-Time Delivery',  value: 98  },
  { icon: 'icon-heart-solid',      label: 'Client Satisfaction', value: 100 },
  { icon: 'icon-chart-line-solid', label: 'Brand Impact',      value: 92  },
];

const DURATION = 2000; // ms — animation length

/**
 * ProgressItem — loader-style design
 * Rectangular track with pink border, pink fill grows left → right.
 * Percentage text is ALWAYS centered on the full track (white, bold).
 */
function ProgressItem({ icon, label, value }) {
  const fillRef = useRef(null);
  const pctRef = useRef(null);
  const startedRef = useRef(false);

  const runAnimation = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const fill = fillRef.current;
    const pct = pctRef.current;
    if (!fill || !pct) return;

    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / DURATION, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentPct = Math.round(eased * value);

      fill.style.width = currentPct + '%';
      pct.textContent = currentPct + '%';

      // Toggle text color dynamically when fill crosses the middle
      if (currentPct >= 50) {
        pct.style.color = '#ffffff';
      } else {
        pct.style.color = 'var(--brand)';
      }

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        fill.style.width = value + '%';
        pct.textContent = value + '%';
        if (value >= 50) {
          pct.style.color = '#ffffff';
        } else {
          pct.style.color = 'var(--brand)';
        }
      }
    };

    requestAnimationFrame(tick);
  }, [value]);

  useEffect(() => {
    const fill = fillRef.current;
    if (!fill) return;
    fill.style.width = '0%';

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          runAnimation();
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(fill);
    return () => observer.disconnect();
  }, [runAnimation]);

  return (
    <div className="benefits-progress-item">

      {/* ── Label row (icon + name) ── */}
      <div className="progress-label">
        <i className={`icon ${icon}`}></i>
        <span>{label}</span>
      </div>

      {/* ── Loader-style track ── */}
      <div className="progress-track">
        {/* Growing pink fill */}
        <div ref={fillRef} className="progress-fill" style={{ width: '0%' }} />
        {/* Percentage — always centered on the FULL track */}
        <span ref={pctRef} className="progress-pct">0%</span>
      </div>

    </div>
  );
}

function Benefits() {
  const sectionRef = useRef(null);
  useScrollFade(sectionRef);

  return (
    <div className="section-benefits flat-spacing pt-0" ref={sectionRef}>
      <div className="container">

        {/* Heading */}
        <div className="heading-section center mb-70">
          <div className="heading-sub fw-semibold effectFade fadeUp">Benefits</div>
          <div className="heading-title text-gradient-3 effectFade fadeRotateX">Why Choose Us</div>
        </div>

        {/* Row 1 */}
        <div className="row mb-24">
          {/* Progress bars box */}
          <div className="col-lg-7">
            <div className="benefits-box benefits-progress">
              <div className="benefits-progress-inner">
                {PROGRESS_ITEMS.map((item) => (
                  <ProgressItem key={item.label} {...item} />
                ))}
              </div>
              <div className="content">
                <h6 className="fw-semibold title">Quality over Quantity</h6>
                <p className="text text-secondary">
                  We obsess over every pixel, colour, and curve — so every deliverable reflects your brand at its absolute best.
                </p>
              </div>
            </div>
          </div>

          {/* Step / checklist box */}
          <div className="col-lg-5">
            <div className="effectFade fadeUp" style={{ padding: '30px', margin: '-30px' }}>
              <div className="benefits-box benefits-step">
                <div className="benefits-step-inner">
                  <div className="line-step"></div>
                  <div className="step-item"><i className="icon icon-check-solid"></i></div>
                  <div className="step-item"><i className="icon icon-check-solid"></i></div>
                  <div className="step-item"><i className="icon icon-check-solid"></i></div>
                </div>
                <div className="content">
                  <h6 className="fw-semibold title">Deadline-First Commitment</h6>
                  <p className="text text-secondary">
                    We build realistic timelines and stick to them. You always know where your project stands — no surprises, ever.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2 */}
        <div className="row">
          <div className="col-lg-5">
            <div className="benefits-box benefits-secure">
              <div className="benefits-secure-inner text-center">
                <img loading="lazy" src="/assets/images/item/benefits-1.svg" alt="" />
              </div>
              <div className="content">
                <h6 className="fw-semibold title">Brand Consistency</h6>
                <p className="text text-secondary">
                  Every touchpoint — from your logo to your website — stays on-brand, on-message, and unmistakably you.
                </p>
              </div>
            </div>
          </div>

          <div className="col-lg-7">
            <div className="benefits-box benefits-design">
              <div className="benefits-design-inner">
                <img loading="lazy" className="item-img-1" src="/assets/images/item/benefits-2.svg" alt="" />
                <img loading="lazy" className="item-img-2 rightleft" src="/assets/images/item/benefits-3.svg" alt="" />
                <img loading="lazy" className="item-img-3 updown" src="/assets/images/item/benefits-4.svg" alt="" />
              </div>
              <div className="content">
                <h6 className="fw-semibold title">Creative That Converts</h6>
                <p className="text text-secondary">
                  Beautiful design is only half the job. We make sure every creative decision serves your business goals and drives real results.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Benefits;
