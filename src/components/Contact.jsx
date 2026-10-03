import { useRef } from 'react';
import { useScrollFade } from '../hooks/useScrollFade';
import Orb from './Orb';
import ContactForm from './ContactForm';

function Contact({ preview = false }) {
  const sectionRef = useRef(null);
  useScrollFade(sectionRef);
  return <div id="contact" className="flat-spacing pt-0" ref={sectionRef}>
    <div className="section-contact">
      <div className="contact-image" style={{ background: '#000000', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.65 }}>
          <Orb hue={0} hoverIntensity={0.3} rotateOnHover forceHoverState={false} backgroundColor="#000000" />
        </div>
      </div>
      <div className="container"><div className="row">
        <div className="col-lg-6"><div className="col-left" style={{ position: 'relative', zIndex: 2 }}>
          <div className="heading-section mb-48">
            <div className="heading-sub fw-semibold text-black effectFade fadeUp" style={{ color: '#000000' }}>Contact</div>
            <div className="heading-title text-white effectFade fadeRotateX" style={{ paddingBottom: '15px' }}>Let's Build <br /> Intelligent Things</div>
          </div>
          <div>
            <div className="contact-item mb-20 effectFade fadeRotateX"><i className="icon icon-envelope-solid" style={{ color: '#000000' }} /><div className="content"><div className="title text-white fw-semibold mb-2">E-mail address</div><div className="text text-neutral-300">hello@fanzcreative.design</div></div></div>
            <div className="contact-item effectFade fadeRotateX" data-delay="0.1"><i className="icon icon-headset-solid" style={{ color: '#000000' }} /><div className="content"><div className="title text-white fw-semibold mb-2">Phone number</div><div className="text text-neutral-300">+44 (0) 7378562333</div></div></div>
          </div>
        </div></div>
        <div className="col-lg-6"><ContactForm preview={preview} /></div>
      </div></div>
    </div>
  </div>;
}

export default Contact;
