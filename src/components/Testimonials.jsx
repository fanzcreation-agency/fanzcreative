import { useEffect, useRef, useState } from 'react';
import { useScrollFade } from '../hooks/useScrollFade';
import { playList, playHover } from '../hooks/useSound';
import { videoMedia } from '../media';

const TESTIMONIALS = [
  {
    type: 'stars',
    text: '"Working with FanzCreative was a fantastic experience. He built a beautiful, functional website for our homeopathic practice that perfectly matched the brief. Communication was smooth and clear throughout the entire process. Fanz was always responsible, reliable, and very easy to work with. What really stood out was the top-notch quality for a very reasonable price. The final result exceeded our expectations."',
    name: 'Mariana Brighty',
    role: 'Founder, Homeolistics',
    video: videoMedia.mariana.url,
    poster: videoMedia.mariana.poster,
    imgPosition: 'center 10%'
  },
  {
    type: 'quote',
    text: '"My company builds custom data platforms for marketing teams and agencies. We went to FanzCreative to refresh our brand and image, and we couldn\'t be happier. The logo he created for us perfectly captures our identity. The process was smooth and collaborative. I highly recommend FanzCreative to anyone who\'s just looking for a talented logo and designer."',
    name: 'Gideon Fernandez',
    role: 'Founder, Custom Data Platforms',
    video: videoMedia.gideon.url,
    poster: videoMedia.gideon.poster,
    imgPosition: 'center 15%'
  },
  {
    type: 'quote',
    text: '"We have a company called House of Korea where we sell Korean skincare and beauty products. We reached out to FanzCreative to look at building a website for us, and it was a very collaborative approach. He was very patient with the changes that we required. We ended up with a really amazing website; he got my brief spot on. I would highly recommend his services."',
    name: 'Nadia',
    role: 'Founder, House of Korea',
    video: videoMedia.nadia.url,
    poster: videoMedia.nadia.poster,
    imgPosition: 'center 15%'
  },
];

function Testimonials({ className = "pt-0" }) {
  const sectionRef = useRef(null);
  useScrollFade(sectionRef);
  const [active, setActive] = useState(0);
  const [displayed, setDisplayed] = useState(0);
  const [videoFrom, setVideoFrom] = useState(0);
  const [direction, setDirection] = useState(1);
  const [phase, setPhase] = useState('idle');
  const timerRef = useRef(null);
  const videoRefs = useRef([]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const changeTo = (index, nextDirection) => {
    if (index === active || phase !== 'idle') return;
    if (timerRef.current) clearTimeout(timerRef.current);
    videoRefs.current[videoFrom]?.pause();

    setDirection(nextDirection);
    setActive(index);
    setPhase('switching');

    timerRef.current = setTimeout(() => {
      setDisplayed(index);
      setVideoFrom(index);
      setPhase('idle');
    }, 700);
  };

  const prev = () => {
    changeTo((active - 1 + TESTIMONIALS.length) % TESTIMONIALS.length, -1);
  };

  const next = () => {
    changeTo((active + 1) % TESTIMONIALS.length, 1);
  };

  const goTo = (index) => {
    if (index === active) return;
    changeTo(index, index > active ? 1 : -1);
  };

  const t = TESTIMONIALS[displayed];
  const isSwitching = phase !== 'idle';
  const slideDirection = direction < 0 ? 'from-left' : 'from-right';

  return (
    <div className={`section-testimonials flat-spacing ${className}`} ref={sectionRef}>
      <div className="container">
        <div className="row justify-content-between">

          {/* Left — quote content */}
          <div className="col-lg-5">
            <div className="col-left">
              <div className="heading-section mb-48">
                <div className="heading-sub fw-semibold style-1 effectFade fadeUp">Testimonials</div>
                <div className="heading-title text-white effectFade fadeRotateX">
                  What Our <br /> Clients Says
                </div>
                <div className="effectFade fadeUp" style={{ marginTop: '24px' }}>
                  <a href="https://uk.trustpilot.com/review/fanzcreative.design" target="_blank" rel="noreferrer" className="tf-btn" style={{ padding: '12px 24px', display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#00b67a', borderColor: '#00b67a', color: '#fff' }} onMouseEnter={playHover} onClick={playList}>
                    <i className="icon icon-star-solid" style={{ color: '#fff' }}></i> Review us on Trustpilot
                  </a>
                </div>
              </div>

              <div className="swiper-testimonial_wrap">
                <div className="testimonial-copy-viewport">
                  <TestimonialCopy testimonial={t} className={isSwitching ? `is-exiting ${slideDirection}` : ''} />
                  {isSwitching && (
                    <TestimonialCopy testimonial={TESTIMONIALS[active]} className={`is-entering ${slideDirection}`} />
                  )}
                </div>

                {/* Nav + dots */}
                <div className="group-slider" style={{ marginTop: 24 }}>
                  <div className="group-btn-slider">
                    <div className="btn-slider nav-prev-swiper" role="button" onClick={() => { prev(); playList(); }} onMouseEnter={playHover}>
                      <i className="icon icon-angle-left-solid"></i>
                    </div>
                    <div className="btn-slider nav-next-swiper" role="button" onClick={() => { next(); playList(); }} onMouseEnter={playHover}>
                      <i className="icon icon-angle-right-solid"></i>
                    </div>
                  </div>
                  <div className="testimonials-pagination d-flex gap-8" style={{ marginTop: 12 }}>
                    {TESTIMONIALS.map((_, i) => (
                      <span
                        key={i}
                        onClick={() => { goTo(i); playList(); }}
                        onMouseEnter={playHover}
                        style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: i === active ? '#fff' : 'rgba(255,255,255,0.3)',
                          cursor: 'pointer', transition: 'background 0.3s',
                          display: 'inline-block',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right — photo */}
          <div className="col-lg-6">
            <div className="effectFade fadeUp">
              <div className="testimonial-image">
                <div className="testimonial-video-frame">
                  {TESTIMONIALS.map((item, index) => (
                    <video
                      key={item.name}
                      ref={(element) => { videoRefs.current[index] = element; }}
                      className={`testimonial-video-slide ${index === videoFrom ? 'is-current' : ''} ${isSwitching && index === active ? 'is-fading-in' : ''}`}
                      src={index === videoFrom ? item.video : undefined}
                      poster={item.poster}
                      loop
                      controls={index === videoFrom && !isSwitching}
                      playsInline
                      preload="none"
                      style={{ objectPosition: item.imgPosition || 'center center' }}
                      aria-hidden={index !== active}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
      <style>{`
        .testimonial-image {
          width: 100%;
        }

        .testimonial-video-frame {
          overflow: hidden;
          width: 100%;
          aspect-ratio: 4 / 5;
          position: relative;
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.25);
          background: #111111;
        }

        .testimonial-video-slide {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0;
          pointer-events: none;
        }

        .testimonial-video-slide.is-current {
          opacity: 1;
          pointer-events: auto;
        }

        .testimonial-video-slide.is-fading-in {
          z-index: 2;
          opacity: 1;
          animation: testimonialVideoFadeIn 0.7s ease-in-out both;
        }

        .testimonial-copy-viewport {
          display: grid;
          overflow: hidden;
        }

        .testimonial-copy-slide {
          grid-area: 1 / 1;
          min-width: 0;
        }

        .testimonial-copy-slide.is-entering.from-right {
          animation: testimonialCopyInFromRight 0.7s ease-in-out both;
        }

        .testimonial-copy-slide.is-exiting.from-right {
          animation: testimonialCopyOutToLeft 0.7s ease-in-out both;
        }

        .testimonial-copy-slide.is-entering.from-left {
          animation: testimonialCopyInFromLeft 0.7s ease-in-out both;
        }

        .testimonial-copy-slide.is-exiting.from-left {
          animation: testimonialCopyOutToRight 0.7s ease-in-out both;
        }

        @keyframes testimonialCopyInFromRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        @keyframes testimonialCopyOutToLeft {
          from { transform: translateX(0); }
          to { transform: translateX(-100%); }
        }

        @keyframes testimonialCopyInFromLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }

        @keyframes testimonialCopyOutToRight {
          from { transform: translateX(0); }
          to { transform: translateX(100%); }
        }

        @keyframes testimonialVideoFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @media (prefers-reduced-motion: reduce) {
          .testimonial-copy-slide,
          .testimonial-video-slide {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

function TestimonialCopy({ testimonial, className = '' }) {
  return (
    <div className={`testimonial-copy-slide ${className}`}>
      <div className="top-icon d-flex gap-4">
        {testimonial.type === 'stars' ? (
          [...Array(5)].map((_, i) => (
            <i key={i} className="icon icon-star-solid"></i>
          ))
        ) : (
          <QuoteIcon />
        )}
      </div>

      <div className="text-body-1 text-white desc" style={{ margin: '16px 0' }}>
        {testimonial.text}
      </div>

      <div className="cite">
        <img loading="lazy" className="line-left" src="/assets/images/item/line-1.webp" alt="" />
        <div className="name text-body-3 text-neutral-400 fw-semibold">{testimonial.name}</div>
        <div className="line"></div>
        <div className="sub text-body-3 text-neutral-400">{testimonial.role}</div>
      </div>
    </div>
  );
}

function QuoteIcon() {
  return (
    <svg width="23" height="20" viewBox="0 0 23 20" fill="none">
      <path d="M12.9375 20V10.3597C12.9375 7.72182 13.824 5.51559 15.5969 3.74101C17.4177 1.91847 19.8854 0.671463 23 0V6.40288C21.8021 6.78657 21.0115 7.26619 20.6281 7.84173C20.2448 8.3693 20.0292 9.04077 19.9813 9.85612H23V20H12.9375ZM0 20V10.3597C0 7.72182 0.886459 5.51559 2.65938 3.74101C4.48021 1.91847 6.94792 0.671463 10.0625 0V6.40288C8.9125 6.78657 8.12187 7.26619 7.69062 7.84173C7.30729 8.3693 7.09167 9.04077 7.04375 9.85612H10.0625V20H0Z" fill="#0af9cf" />
    </svg>
  );
}

export default Testimonials;
