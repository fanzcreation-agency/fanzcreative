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
                <img loading="lazy" src={a.img} alt="" />
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
