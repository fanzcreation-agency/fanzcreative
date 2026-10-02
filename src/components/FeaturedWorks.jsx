import { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useScrollFade } from '../hooks/useScrollFade';
import { playList, playHover } from '../hooks/useSound';
import { splitWorkTitle } from '../constants';
import { useProjectCollection } from '../hooks/useProjectCollection';

export function ProjectImageLink({ src, alt, to }) {
  return (
    <Link
      to={to}
      className="image"
      aria-label={`View ${alt} project`}
      onClick={playList}
      onMouseEnter={playHover}
    >
      <img loading="lazy" src={src} alt={alt} />
    </Link>
  );
}

/**
 * FeaturedWorks — Sticky stacked cards version
 *
 * Keeps the existing card UI exactly the same, but changes the scroll behavior:
 * - The section pins when it reaches the viewport.
 * - Project cards replace each other while scrolling.
 * - After the last card is shown, the section releases and the next section continues.
 */

function FeaturedWorks() {
  const sectionRef = useRef(null);
  const pinRef = useRef(null);
  const cardsRef = useRef([]);
  const { featuredProjects: works } = useProjectCollection();
  useScrollFade(sectionRef, works);

  useLayoutEffect(() => {
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    if (!gsap || !ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    const section = sectionRef.current;
    const pin = pinRef.current;
    const cards = cardsRef.current.slice(0, works.length).filter(Boolean);

    if (!section || !pin || cards.length < 2) return undefined;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(max-width: 991px)', () => {
        gsap.set(cards, { clearProps: 'all' });
        requestAnimationFrame(() => ScrollTrigger.refresh());
      });

      mm.add('(min-width: 992px)', () => {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (reduceMotion) {
          gsap.set(cards, { clearProps: 'all' });
          return;
        }

        // Cards share one position so completed transitions show only the active project.
        gsap.set(cards, {
          position: 'absolute',
          inset: 0,
          transformOrigin: 'center top',
          willChange: 'transform, opacity',
        });

        cards.forEach((card, index) => {
          gsap.set(card, {
            zIndex: index + 1,
            yPercent: index === 0 ? 0 : 115,
            autoAlpha: index === 0 ? 1 : 0,
          });
        });

        let lastActiveIndex = 0;
        const timeline = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: () => `+=${window.innerHeight * (cards.length - 1)}`,
            scrub: 0.8,
            pin,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const activeIndex = Math.round(self.progress * (cards.length - 1));
              if (activeIndex !== lastActiveIndex) {
                lastActiveIndex = activeIndex;
                playList();
              }
            }
          },
        });

        for (let i = 1; i < cards.length; i += 1) {
          const step = i - 1;

          timeline.set(cards[i], { autoAlpha: 1 }, step);
          timeline.to(
            cards[i],
            {
              yPercent: 0,
              duration: 1,
            },
            step
          );
          timeline.set(cards[i - 1], { autoAlpha: 0 }, step + 1);
        }
      });

      return () => mm.revert();
    }, section);

    return () => ctx.revert();
  }, [works]);

  if (!works.length) return null;

  return (
    <div id="works" className="section-featured-works sticky-works-section flat-spacing pt-0" ref={sectionRef}>
      <div className="sticky-works-pin" ref={pinRef}>
        <div className="container">

          {/* Heading inside pinned area but above the card stack via z-index */}
          <div className="heading-section mb-0 sticky-works-heading" style={{ position: 'relative', zIndex: 50 }}>
            <div className="heading-sub fw-semibold mx-auto effectFade fadeUp">Featured Works</div>
          </div>

          <div className="featured-works-list sticky-works-stack position-relative">
            {works.map((work, i) => {
              const titleLines = splitWorkTitle(work.title);
              const deliverableLines = work.deliverables.split('\n');

              return (
                <div
                  key={work.slug}
                  className="sticky-works-card"
                  ref={(el) => {
                    cardsRef.current[i] = el;
                  }}
                >
                  <div className={`featured-works-item${i === 0 ? ' effectFade fadeUp no-div' : ''}`} onMouseEnter={playHover}>
                    <ProjectImageLink
                      src={work.img}
                      alt={work.title.replace('\n', ' ')}
                      to={`/project/${work.slug}`}
                    />

                    <div className="content">
                      <div className="pagi-dot">
                        {[0, 1, 2, 3].map((d) => (
                          <span key={d} className={d === work.activeDot ? 'active' : ''}></span>
                        ))}
                      </div>

                      <div className="bot">
                        <h4 className="heading fw-semibold">
                          <Link to={`/project/${work.slug}`} onClick={playList} onMouseEnter={playHover}>
                            {titleLines[0]} {titleLines[1] && <><br /> {titleLines[1]}</>}
                          </Link>
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
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        .sticky-works-section {
          width: 100%;
          max-width: 100%;
          overflow-x: clip;
        }

        .sticky-works-pin {
          width: 100%;
          max-width: 100%;
          min-height: 100vh;
          display: flex;
          align-items: center;
          overflow: hidden;
          padding: 70px 0;
        }

        .sticky-works-heading {
          margin-bottom: 42px !important;
        }

        .sticky-works-stack {
          height: min(72vh, 820px);
          min-height: 620px;
          position: relative;
          z-index: 1;   /* always below the heading z-index:50 */
        }

        .sticky-works-card {
          width: 100%;
          transform-origin: center top;
        }

        .sticky-works-card .featured-works-item {
          height: 100%;
          backface-visibility: hidden;
        }

        .sticky-works-card .featured-works-item .image {
          overflow: hidden;
        }

        .sticky-works-card .featured-works-item .image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
          transition: object-position 2s ease;
        }
        .sticky-works-card .featured-works-item .image:hover img {
          object-position: center bottom;
        }

        @media (max-width: 991px) {
          .sticky-works-pin {
            min-height: auto;
            display: block;
            overflow: visible;
            padding: 80px 0;
          }

          .sticky-works-stack {
            height: auto;
            min-height: auto;
            display: grid;
            gap: 24px;
          }

          .sticky-works-card {
            position: relative !important;
            inset: auto !important;
            transform: none !important;
            opacity: 1 !important;
            visibility: visible !important;
          }

          .sticky-works-card .featured-works-item {
            height: auto;
          }
        }
      `}</style>
    </div>
  );
}

export default FeaturedWorks;
