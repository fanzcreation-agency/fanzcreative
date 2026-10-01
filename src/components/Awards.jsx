import { useRef } from 'react';
import { useScrollFade } from '../hooks/useScrollFade';

const AWARDS = [
  { img: '/assets/images/partner/partner-7.svg',  title: 'Best Brand Identity Design',       text: 'Lumière Skincare — Awwwards Honorable Mention', year: '2025', delay: null },
  { img: '/assets/images/partner/partner-8.svg',  title: 'Top Creative Agency — Canada',      text: 'Clutch Global Awards, B2B Category',            year: '2025', delay: '0.1' },
  { img: '/assets/images/partner/partner-9.svg',  title: 'Excellence in Motion Graphics',     text: 'Forté Launch Film — Vimeo Staff Pick',           year: '2024', delay: '0.2' },
  { img: '/assets/images/partner/partner-10.svg', title: 'Best E-commerce UX Design',         text: 'Oakwell Store — CSS Design Awards Winner',      year: '2024', delay: '0.3' },
];

function Awards() {
  const sectionRef = useRef(null);
  useScrollFade(sectionRef);

  return (
    <div className="section-awards flat-spacing" ref={sectionRef}>
      <style>{`
        .section-awards .awards-item {
          align-items: stretch;
        }
        .section-awards .awards-item .image {
          flex: 0 0 104px;
          width: 104px;
          display: flex;
          align-items: center;
          justify-content: flex-start;
        }
        .section-awards .award-row-icon {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.82);
          background: rgba(255, 255, 255, 0.035);
          border: 1px solid rgba(255, 255, 255, 0.14);
          transition: border-color 0.3s ease, color 0.3s ease, background-color 0.3s ease;
        }
        .section-awards .award-row-icon svg {
          width: 19px;
          height: 19px;
        }
        .section-awards .awards-item:hover .award-row-icon {
          color: #0af9cf;
          background: rgba(10, 249, 207, 0.08);
          border-color: rgba(10, 249, 207, 0.34);
        }
        @media (max-width: 767px) {
          .section-awards .awards-item .image {
            width: 100%;
            flex: none;
            min-height: unset;
          }
        }
      `}</style>
      <div className="container">
        <div className="heading-section center mb-48">
          <div className="heading-sub fw-semibold style-1 mb-0 effectFade fadeUp">Awards</div>
        </div>
        <div className="d-grid gap-16">
          {AWARDS.map((a) => (
            <div
              key={a.title + a.year}
              className="awards-item effectFade fadeUp"
              data-delay={a.delay || undefined}
            >
              <div className="image">
                <span className="award-row-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4.2"></circle>
                    <path d="M9.6 11.4 8.2 20l3.8-2.3 3.8 2.3-1.4-8.6"></path>
                  </svg>
                </span>
              </div>
              <div className="title text-body-1 text-white">{a.title}</div>
              <div className="text text-body-1 text-white">{a.text}</div>
              <div className="year text-body-1 text-neutral-400">/ {a.year}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Awards;
