import { useRef, useState } from 'react';
import { useScrollFade } from '../hooks/useScrollFade';
import DotField from './DotField';
import { playClick, playHover } from '../hooks/useSound';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

const SLIDES = [
  {
    icon: 'icon-search-solid',
    title: 'Discovery & Brief',
    text: 'We start by understanding your business, target audience, and goals. A detailed creative brief is built before any design work begins.',
    time: '2-5 DAYS',
    num: '01',
  },
  {
    icon: 'icon-paint-roller-solid',
    title: 'Concept & Design',
    text: 'We craft initial concepts — logos, layouts, moodboards, or wireframes — and refine them through structured feedback rounds.',
    time: '1-2 WEEKS',
    num: '02',
  },
  {
    icon: 'icon-desktop-solid',
    title: 'Build & Develop',
    text: 'Approved designs are brought to life — whether a website on Shopify or WordPress, a motion video, or a full brand kit.',
    time: '1-3 WEEKS',
    num: '03',
  },
  {
    icon: 'icon-check-solid',
    title: 'Deliver & Support',
    text: 'Final files are handed over clean and documented. We stay available post-launch for revisions, updates, or new requests.',
    time: '1-2 DAYS',
    num: '04',
  },
];

function Process({ className = "pt-0" }) {
  const sectionRef = useRef(null);
  useScrollFade(sectionRef);

  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const [isEnd, setIsEnd] = useState(false);
  const [isBeginning, setIsBeginning] = useState(true);

  return (
    <div className={`section-process flat-spacing ${className}`} ref={sectionRef} style={{ position: 'relative' }}>
      {/* DotField background — pink/purple dots react to cursor */}
      <DotField
        dotRadius={1.5}
        dotSpacing={16}
        gradientFrom="rgba(10, 249, 207, 0.25)"
        gradientTo="rgba(126, 247, 22, 0.18)"
        glowColor="transparent"
        glowRadius={0}
        bulgeOnly={true}
        bulgeStrength={60}
      />
      <div className="container">
        <div className="row">

          {/* Left — heading + nav arrows */}
          <div className="col-lg-5">
            <div className="process-heading h-100">
              <div className="heading-section mb-80">
                <div className="heading-sub fw-semibold effectFade fadeUp">Process</div>
                <div className="heading-title text-gradient-3 effectFade fadeRotateX">
                  From Brief <br /> to Beautiful
                </div>              </div>
              <div className="group-btn-slider">
                <div
                  className="nav-prev-swiper"
                  role="button"
                  ref={prevRef}
                  style={{ opacity: isBeginning ? 0.4 : 1, cursor: isBeginning ? 'default' : 'pointer' }}
                  onClick={playClick}
                  onMouseEnter={playHover}
                >
                  <i className="icon icon-angle-left-solid"></i>
                </div>
                <div
                  className="nav-next-swiper"
                  role="button"
                  ref={nextRef}
                  style={{
                    opacity: isEnd ? 0.4 : 1,
                    cursor: isEnd ? 'default' : 'pointer',
                  }}
                  onClick={playClick}
                  onMouseEnter={playHover}
                >
                  <i className="icon icon-angle-right-solid"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Right — slides */}
          <div className="col-lg-7">
            <div className="process-slide">
              <Swiper
                modules={[Navigation]}
                navigation={{
                  prevEl: prevRef.current,
                  nextEl: nextRef.current,
                }}
                onBeforeInit={(swiper) => {
                  swiper.params.navigation.prevEl = prevRef.current;
                  swiper.params.navigation.nextEl = nextRef.current;
                }}
                onSlideChange={(swiper) => {
                  setIsBeginning(swiper.isBeginning);
                  setIsEnd(swiper.isEnd);
                }}
                loop={false}
                centeredSlides={false}
                breakpoints={{
                  0: {
                    slidesPerView: 1,
                    spaceBetween: 30,
                  },
                  768: {
                    slidesPerView: 2,
                    spaceBetween: 24,
                  },
                  992: {
                    slidesPerView: 2,
                    spaceBetween: 24,
                  },
                }}
                className="swiper tf-swiper swiper-box-shadow"
                dir="ltr"
              >
                {SLIDES.map((slide, i) => (
                  <SwiperSlide key={i} style={{ display: 'flex', height: 'auto', paddingBottom: '30px' }}>
                    <div className="process-card" style={{ width: '100%', height: '100%' }}>
                      <i className={`icon ${slide.icon}`}></i>
                      <div className="content">
                        <h4 className="title fw-semibold">{slide.title}</h4>
                        <p className="text text-secondary">{slide.text}</p>
                      </div>
                      <div className="bot">
                        <div className="time fw-semibold">{slide.time}</div>
                        <div className="number">
                          <span className="text-neutral-400">{slide.num}</span>
                          <span className="text-neutral-200">/04</span>
                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Process;
