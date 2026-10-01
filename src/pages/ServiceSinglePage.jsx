import { useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useScrollFade } from '../hooks/useScrollFade';
import Process from '../components/Process';
import FAQs from '../components/FAQs';
import Contact from '../components/Contact';
import { playClick, playHover, playPop } from '../hooks/useSound';

function ServiceSinglePage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const pageRef = useRef(null);
  useScrollFade(pageRef);

  return (
    <div ref={pageRef} className="service-single-page-wrapper">
      <Helmet>
        <title>Service Details - FanzCreative</title>
        <meta name="description" content="Learn more about our creative services and how we can help bring your brand to life." />
      </Helmet>
      {/* Hero Banner */}
      <div className="section-hero v2">
        <div className="hero-image"></div>
        <div className="container">
          <div className="content-wrap text-center">
            <div className="title text-display-2 effectFade fadeRotateX">
              <span className="title1 fw-semibold text-gradient-1">AI UX & Product</span>
              <br />
              <div className="title2 d-flex gap-20 justify-content-center flex-wrap">
                <span className="fw-semibold text-gradient-1">Design</span>
                <div className="title-icon">
                  <div className="box"></div>
                  <div className="title-icon-wrap">
                    <img loading="lazy" src="/assets/images/item/item-13.svg" alt="" className="img-1 img-transform-3" />
                    <img loading="lazy" src="/assets/images/item/item-14.svg" alt="" className="img-2 img-transform-3" />
                    <img loading="lazy" src="/assets/images/item/item-15.svg" alt="" className="img-3 img-transform-3" />
                  </div>
                </div>
              </div>
            </div>
            <p className="text text-body-3 effectFade fadeUp">
              Human-centered flows, prompts, and interfaces that build trust and adoption. We design intuitive AI <br /> experiences focused on transparency, usability, and engagement.
            </p>
          </div>
        </div>
      </div>

      {/* section-services-single */}
      <div id="services" className="section-services-single flat-spacing pt-0">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="top-image mb-40 effectFade fadeZoom">
                <img loading="lazy" src="/assets/images/section/service-single-1.webp" alt="" />
              </div>
            </div>
            <div className="col-12">
              <div className="heading fw-semibold mb-20 effectFade fadeUp">Innovative AI UX & Product Design</div>
            </div>
          </div>
          <div className="row mb-80">
            <div className="col-md-7 md-mb-24">
              <p className="text-secondary effectFade fadeUp">
                Designing AI-powered products requires more than technical excellence it demands seamless human-AI interaction that feels natural, intuitive, and trustworthy. Our AI UX & Product Design service blends user experience design with artificial intelligence to create digital products that think intelligently and feel human-centered. We begin by understanding your users—their goals, challenges, and emotions—then design interfaces and experiences. That make complex AI systems approachable and effective. From conversational flows to adaptive dashboards, we ensure every interaction is clear, context-aware, and meaningful. We prototype rapidly, test with real users, and refine continuously to align performance with human expectations, ensuring each design iteration enhances usability, emotional connection, and trust—transforming intelligent systems into intuitive, delightful experiences.
              </p>
            </div>
            <div className="col-md-5">
              <p className="text-secondary mb-30 effectFade fadeUp">
                The result is a well-defined, measurable AI strategy that drives innovation while minimizing risks and costs. With our AI Strategy & Mapping service, you gain not just a plan, but a partnership—empowering your organization to move confidently toward an intelligent, data-driven competitive future.
              </p>
              <div className="list-tags effectFade fadeUp">
                <a href="#" className="tags-item fw-semibold" onClick={(e) => { e.preventDefault(); playClick(); }} onMouseEnter={playHover}>Prototype flows</a>
                <a href="#" className="tags-item fw-semibold" onClick={(e) => { e.preventDefault(); playClick(); }} onMouseEnter={playHover}>Prompt UX patterns</a>
                <a href="#" className="tags-item fw-semibold" onClick={(e) => { e.preventDefault(); playClick(); }} onMouseEnter={playHover}>Usability testing with real users</a>
              </div>
            </div>
          </div>
          <div className="row mb-40">
            <div className="col-md-8 md-mb-24">
              <div className="image effectFade fadeUp">
                <img loading="lazy" src="/assets/images/section/service-single-2.webp" alt="" />
              </div>
            </div>
            <div className="col-md-4">
              <div className="image effectFade fadeUp" data-delay="0.1">
                <img loading="lazy" src="/assets/images/section/service-single-3.webp" alt="" />
              </div>
            </div>
          </div>
          <div className="row mb-40">
            <div className="col-12">
              <div className="heading fw-semibold mb-20 effectFade fadeUp">What We Do?</div>
              <p className="text-secondary effectFade fadeUp">
                We help businesses harness the power of artificial intelligence to innovate, automate, and scale efficiently. From idea to execution, our team delivers end-to-end AI solutions tailored to your goals.We design data-driven strategies, build intelligent systems, and integrate AI into your workflows to enhance decision-making, customer experience, and operational performance. Our services cover every stage of your AI journey—strategy, development, deployment, and optimization—ensuring your solutions deliver measurable impact and long-term value. Whether you’re exploring automation, predictive analytics, generative AI, or full-scale transformation, we guide you with expertise, transparency, and precision. We combine cutting-edge technology with human insight to help you build smarter and grow faster.
                <br />
                <br />
                We partner closely with organizations to identify opportunities where AI can drive tangible results—streamlining operations, reducing costs, and uncovering new sources of growth. Our multidisciplinary team blends technical expertise with industry knowledge to craft scalable, ethical, and sustainable AI ecosystems. Through collaborative workshops, iterative prototyping, and continuous optimization, we ensure every solution evolves with your business needs. From startups to global enterprises, we empower teams to confidently adopt AI, fostering innovation, agility, and resilience in an ever-changing digital landscape.
              </p>
            </div>
          </div>
          <div className="row justify-content-between">
            <div className="col-md-6 md-mb-24">
              <div className="heading fw-semibold mb-20 effectFade fadeUp">Key Deliverables</div>
              <p className="text-secondary mb-30 effectFade fadeUp">
                Identify high-ROI use cases and define a realistic, measurable AI roadmap. Our AI Strategy & Mapping process aligns technology with business goals through stakeholder discovery, KPI modeling, and data readiness assessment to ensure sustainable growth and measurable transformation.
              </p>
              <ul className="list-text type-check mb-30">
                <li className="effectFade fadeUp">
                  <i className="icon icon-check-solid"></i>
                  Human-centered AI experiences that feel intuitive and intelligent
                </li>
                <li className="effectFade fadeUp">
                  <i className="icon icon-check-solid"></i>
                  Seamless integration of AI into digital products and workflows
                </li>
                <li className="effectFade fadeUp">
                  <i className="icon icon-check-solid"></i>
                  Data-driven design decisions informed by real user behavior
                </li>
                <li className="effectFade fadeUp">
                  <i className="icon icon-check-solid"></i>
                  Scalable design systems for adaptive, AI-powered products
                </li>
              </ul>
              <h6 className="title fw-semibold mb-16 effectFade fadeUp">What's included service?</h6>
              <ul className="d-grid gap-8 mb-30">
                <li className="effectFade fadeUp">+ Product Research & Discovery</li>
                <li className="effectFade fadeUp">+ AI & Automation Integration</li>
                <li className="effectFade fadeUp">+ Design System Architecture</li>
                <li className="effectFade fadeUp">+ Continuous Optimization & Testing</li>
              </ul>
              <a href="#contact" className="tf-btn effectFade fadeRotateX" onClick={playPop} onMouseEnter={playHover}>
                Let’s Connect
              </a>
            </div>
            <div className="col-md-5">
              <div className="image bot-image effectFade fadeUp">
                <img loading="lazy" src="/assets/images/section/service-single-4.webp" alt="" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="box-white">
        <Process />
      </div>

      <FAQs />
      <Contact />
    </div>
  );
}

export default ServiceSinglePage;
