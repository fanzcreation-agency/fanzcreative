import { useRef, useState } from 'react';
import { useScrollFade } from '../hooks/useScrollFade';
import { playClick, playHover } from '../hooks/useSound';

const FAQS = [
  { id: 1, q: "How long does a branding project take?",              a: 'A standard brand identity project takes 2–4 weeks depending on scope. We start with a discovery session to understand your business, then move through concepts, refinements, and final delivery.' },
  { id: 2, q: 'What do I need to provide to get started?',           a: 'Just a brief about your business, your target audience, any references you like, and your timeline. We\'ll take it from there and guide you through every step.' },
  { id: 3, q: 'Do you build websites from scratch or use templates?', a: 'Both — we build fully custom sites on HTML/CSS or WordPress, and we also work with Shopify, Wix, and Squarespace when a platform solution makes more sense for your needs.' },
  { id: 4, q: 'Are revisions included in the price?',                a: 'Yes. Every project includes a set number of revision rounds. We\'re flexible and want you to love the result — we won\'t stop until it\'s right.' },
];

function FAQs({ className = "pt-0" }) {
  const sectionRef = useRef(null);
  useScrollFade(sectionRef);
  const [openId, setOpenId] = useState(1);

  const toggle = (id) => setOpenId((cur) => (cur === id ? null : id));

  return (
    <div className={`section-faqs flat-spacing ${className}`} ref={sectionRef}>
      <div className="container">
        <div className="heading-section center mb-64">
          <div className="heading-sub fw-semibold effectFade fadeUp">FAQs</div>
          <div className="heading-title text-gradient-3 effectFade fadeRotateX">
            Frequently Asked <br /> Questions
          </div>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="accordion-asked">
              {FAQS.map((faq, i) => {
                const isOpen = openId === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="accordion-asked-item effectFade fadeRotateX"
                    data-delay={i > 0 ? String(i * 0.1) : undefined}
                  >
                    <div className="accordion-asked-title">
                      <button
                        className={`accordion-button text-body-1 fw-semibold${isOpen ? '' : ' collapsed'}`}
                        type="button"
                        onClick={() => { toggle(faq.id); playClick(); }}
                        onMouseEnter={playHover}
                        aria-expanded={isOpen}
                      >
                        {faq.q}
                        <span className="right-icon"></span>
                      </button>
                    </div>
                    <div
                      className={`faq-answer-panel${isOpen ? ' show' : ''}`}
                    >
                      <div className="faq-answer-inner">
                        <div className="accordion-body">{faq.a}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .accordion-asked .faq-answer-panel {
          display: grid;
          grid-template-rows: 0fr;
          opacity: 0;
          transform: translateY(-6px);
          transition:
            grid-template-rows 0.42s cubic-bezier(0.22, 1, 0.36, 1),
            opacity 0.28s ease,
            transform 0.36s ease;
        }

        .accordion-asked .faq-answer-panel.show {
          grid-template-rows: 1fr;
          opacity: 1;
          transform: translateY(0);
        }

        .accordion-asked .faq-answer-inner {
          min-height: 0;
          overflow: hidden;
        }

        .accordion-asked .faq-answer-panel .accordion-body {
          transform: translateY(-8px);
          transition: transform 0.42s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .accordion-asked .faq-answer-panel.show .accordion-body {
          transform: translateY(0);
        }

        @media (prefers-reduced-motion: reduce) {
          .accordion-asked .faq-answer-panel,
          .accordion-asked .faq-answer-panel .accordion-body {
            transition: none;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}

export default FAQs;
