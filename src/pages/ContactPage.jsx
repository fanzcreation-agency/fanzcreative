import { useRef } from 'react';
import { useScrollFade } from '../hooks/useScrollFade';
import { playHover } from '../hooks/useSound';
import ContactForm from '../components/ContactForm';
import FAQs from '../components/FAQs';
import AnimatedTitleIcon from '../components/AnimatedTitleIcon';

function ContactPage() {
  const pageRef = useRef(null);
  useScrollFade(pageRef);

  return (
    <div className="wrapper" ref={pageRef}>
      {/* Hero Banner */}
      <div className="section-hero v1">
        <div className="hero-image">
        </div>
        <div className="container">
          <div className="content-wrap text-center">
            <div className="title text-display-2 effectFade fadeRotateX">
              <span className="title1 fw-semibold text-gradient-1">Let’s Build Intelligent</span>
              <br />
              <div className="title2 d-flex gap-20 justify-content-center flex-wrap align-items-center">
                <span className="fw-semibold text-gradient-1">Things</span>
                <AnimatedTitleIcon />
              </div>
            </div>
            <p className="text effectFade fadeUp">
              Reach out to our team today and let’s collaborate to turn your ideas into innovative <br /> solutions that truly inspire
            </p>
          </div>
        </div>
      </div>
      {/* /Hero Banner */}

      {/* section-contact */}
      <div id="contact" className="flat-spacing">
        <div className="section-contact p-0">
          <div className="container">
            <div className="row mb-60">
              <div className="col-md-4 md-mb-24">
                <div className="box-contact-item text-center effectFade fadeUp">
                  <i className="icon icon-envelope-solid"></i>
                  <h6 className="title fw-semibold">E-mail address</h6>
                  <a className="text" href="mailto:hello@fanzcreative.design" onMouseEnter={playHover}>
                    hello@fanzcreative.design
                  </a>
                </div>
              </div>
              <div className="col-md-4 md-mb-24">
                <div className="box-contact-item text-center effectFade fadeUp" data-delay="0.1">
                  <i className="icon icon-headset-solid"></i>
                  <h6 className="title fw-semibold">Phone number</h6>
                  <a href="tel:+4407378562333" className="text" onMouseEnter={playHover}>
                    +44 (0) 7378562333
                  </a>
                </div>
              </div>
              <div className="col-md-4">
                <div className="box-contact-item text-center effectFade fadeUp" data-delay="0.2">
                  <i className="icon icon-map-marker-solid"></i>
                  <h6 className="title fw-semibold">Our Location</h6>
                  <div className="text">
                    United Kingdom, Company Number # 14391900
                  </div>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-lg-6 lg-mb-24">
                <div className="col-left p-0">
                  <div className="mb-24">
                    <div className="heading-section mb-48">
                      <div className="heading-sub fw-semibold effectFade fadeUp">Contact</div>
                      <div className="heading-title text-gradient-3 effectFade fadeRotateX">
                        Let’s Build <br /> Intelligent Things
                      </div>
                    </div>
                    <p className="text effectFade fadeUp">combining creativity, technology, and strategy to craft solutions that think, adapt, and inspire. Connect with us to turn visionary ideas into meaningful, data-driven realities.</p>
                  </div>
                  <div className="tf-social-1 gap-24 effectFade fadeRotateX">
                    <a href="https://x.com/" target="_blank" rel="noreferrer" className="text-body-1 fw-semibold" onMouseEnter={playHover}>
                      Twitter / X
                      <div className="social-item">
                        <i className="icon icon-twitter-x"></i>
                      </div>
                    </a>
                    <a href="https://www.facebook.com/" target="_blank" rel="noreferrer" className="text-body-1 fw-semibold" onMouseEnter={playHover}>
                      Facebook
                      <div className="social-item">
                        <i className="icon icon-facebook-f"></i>
                      </div>
                    </a>
                    <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" className="text-body-1 fw-semibold" onMouseEnter={playHover}>
                      Instagram
                      <div className="social-item">
                        <i className="icon icon-instagram"></i>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
              <div className="col-lg-6">
                <ContactForm light />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /section-contact */}

      {/* map */}
      <div className="wg-map">
        <iframe
          title="Google Map Location"
          src="https://maps.google.com/maps?q=United%20Kingdom&t=&z=6&ie=UTF8&iwloc=&output=embed"
          height="660" style={{ border: 0, width: '100%' }} allowFullScreen="" loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"></iframe>
      </div>
      {/* /map */}

      {/* section-faqs */}
      <FAQs className="" />
      {/* /section-faqs */}
      

    </div>
  );
}

export default ContactPage;
