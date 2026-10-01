import { useRef, useState } from 'react';
import { useScrollFade } from '../hooks/useScrollFade';
import Orb from './Orb';
import { playClick, playLongClick, playHover } from '../hooks/useSound';

function Contact() {
  const sectionRef = useRef(null);
  useScrollFade(sectionRef);

  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name } = e.target;
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (submitting) return;
    const nextErrors = {};

    if (!form.name.trim()) nextErrors.name = 'Please enter your name.';
    if (!form.phone.trim()) nextErrors.phone = 'Please enter your phone or email.';
    if (!form.message.trim()) nextErrors.message = 'Please tell us a little about your project.';

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      playClick();
      return;
    }

    setSubmitting(true);
    playLongClick();

    setTimeout(() => {
      setSubmitting(false);
      alert('Message sent!');
      setForm({ name: '', phone: '', message: '' });
    }, 1500);
  };

  return (
    <div id="contact" className="flat-spacing pt-0" ref={sectionRef}>
      <div className="section-contact">
        {/* Background animation wrapper */}
        <div className="contact-image" style={{ background: '#000000', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.65 }}>
            <Orb hue={0} hoverIntensity={0.3} rotateOnHover={true} forceHoverState={false} backgroundColor="#000000" />
          </div>
        </div>

        <div className="container">
          <div className="row">

            {/* Left — info */}
            <div className="col-lg-6">
              <div className="col-left" style={{ position: 'relative', zIndex: 2 }}>
                <div className="heading-section mb-48">
                  <div className="heading-sub fw-semibold text-black effectFade fadeUp" style={{ color: '#000000' }}>Contact</div>
                  <div className="heading-title text-white effectFade fadeRotateX" style={{ paddingBottom: '15px' }}>
                    Let's Build <br /> Intelligent Things
                  </div>
                </div>
                <div>
                  <div className="contact-item mb-20 effectFade fadeRotateX">
                    <i className="icon icon-envelope-solid" style={{ color: '#000000' }}></i>
                    <div className="content">
                      <div className="title text-white fw-semibold mb-2">E-mail address</div>
                      <div className="text text-neutral-300">hello@fanzcreative.design</div>
                    </div>
                  </div>
                  <div className="contact-item effectFade fadeRotateX" data-delay="0.1">
                    <i className="icon icon-headset-solid" style={{ color: '#000000' }}></i>
                    <div className="content">
                      <div className="title text-white fw-semibold mb-2">Phone number</div>
                      <div className="text text-neutral-300">+44 (0) 7378562333</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — form */}
            <div className="col-lg-6">
              <form
                className="form-contact effectFade fadeUp"
                onSubmit={handleSubmit}
                noValidate
                style={{
                  background: 'rgba(255, 255, 255, 0.07)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
                  color: '#ffffff',
                  position: 'relative',
                  zIndex: 2
                }}
              >
                <h4 className="heading fw-semibold text-white">Fill this form below</h4>

                <fieldset className="mb-21">
                  <label className="fw-semibold text-white text-body-3 mb-20">Your Name</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={handleChange}
                    onMouseEnter={playHover}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? 'contact-name-error' : undefined}
                    style={{
                      color: '#ffffff',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                    }}
                  />
                  {errors.name && (
                    <div id="contact-name-error" className="contact-field-error">
                      {errors.name}
                    </div>
                  )}
                </fieldset>

                <fieldset className="mb-21">
                  <label className="fw-semibold text-white text-body-3 mb-20">Your Phone</label>
                  <input
                    type="text"
                    name="phone"
                    placeholder="Enter the e-mail"
                    value={form.phone}
                    onChange={handleChange}
                    onMouseEnter={playHover}
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={errors.phone ? 'contact-phone-error' : undefined}
                    style={{
                      color: '#ffffff',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                    }}
                  />
                  {errors.phone && (
                    <div id="contact-phone-error" className="contact-field-error">
                      {errors.phone}
                    </div>
                  )}
                </fieldset>

                <fieldset className="mb-18">
                  <label className="fw-semibold text-white text-body-3 mb-0">More About The Project</label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    onMouseEnter={playHover}
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby={errors.message ? 'contact-message-error' : undefined}
                    style={{
                      color: '#ffffff',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                    }}
                  ></textarea>
                  {errors.message && (
                    <div id="contact-message-error" className="contact-field-error">
                      {errors.message}
                    </div>
                  )}
                </fieldset>

                <div
                  className="attachment d-flex gap-8 align-items-center"
                  style={{ color: '#ffffff', cursor: 'pointer' }}
                  onMouseEnter={playHover}
                  onClick={playClick}
                >
                  <i className="icon icon-paperclip-solid fs-24"></i>
                  <div className="fw-semibold text-body-3">Add an Attachment</div>
                </div>

                <button
                  type="submit"
                  className="tf-btn w-100"
                  disabled={submitting}
                  onMouseEnter={playHover}
                >
                  {submitting ? 'Sending...' : 'Submit Message'}
                </button>
              </form>
            </div>

          </div>
        </div>
      </div>
      <style>{`
        .contact-field-error {
          margin-top: 8px;
          color: #0af9cf;
          font-size: 14px;
          line-height: 20px;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}

export default Contact;
