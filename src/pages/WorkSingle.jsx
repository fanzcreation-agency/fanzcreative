import { useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useScrollFade } from '../hooks/useScrollFade';
import Testimonials from '../components/Testimonials';
import Contact from '../components/Contact';
import AnimatedTitleIcon from '../components/AnimatedTitleIcon';
import { MouseFollowImage } from '../components/FeaturedWorks';
import { playClick, playHover, playPop } from '../hooks/useSound';
import { SLUGS } from '../constants';

const PROJECT_DATA = [
  {
    title: "Cora Beauty",
    title2: "Skincare Store",
    tagline: "A luxury skincare and cosmetics e-commerce storefront designed to showcase clean, organic beauty products.",
    image: "/assets/images/section/cora-beauty-ecommerce-mockup.webp",
    img1: "/assets/images/section/cora-beauty-1.webp",
    img2: "/assets/images/section/cora-beauty-2.webp",
    img3: "/assets/images/section/cora-beauty-3.webp",
    img4: "/assets/images/section/cora-beauty-4.webp",
    details: "Cora Beauty is a premium skincare and cosmetics storefront designed to capture a clean, organic visual language. The brand emphasizes age-defying botanical formulations, clinical-grade skin health ingredients, and sustainable product design. The interface centers on soft tones, modern serif typography, and tactile visuals. The user experience is optimized to guide users from educational ingredient breakdowns to shopping collections with single-click purchases.",
    detailsContinued: "We designed a full design system including responsive landing pages, mobile shopping layouts, custom product displays, and stationary packaging mockups. In-depth research of skincare customer habits helped us design a frictionless product-comparison grid and a subscription funnel that makes re-ordering essential items incredibly easy.",
    deliverables: ["UI/UX Design", "E-commerce Storefront", "Brand Identity"],
    industry: "Skincare & Beauty",
    research: "Our research showed that customers hesitate to buy skincare online without understanding active ingredients and compatibility. We created an interactive 'Skin Advisor' quiz that maps user skin concerns to specific product bundles. Additionally, we optimized high-resolution close-ups of product textures and formulas to bridge the gap between retail stores and online shopping.",
    results: "Within three months of launch, Cora Beauty experienced a 45% lift in subscription registrations and a 28% reduction in check-out bounce rates. Influencer campaigns backed by the premium brand assets led to viral social engagement, establishing the brand as a leader in clean cosmetics.",
    nextProjectIndex: 1,
    nextProjectTitle: "Revolution Fashion Store",
    nextProjectDesc: "A bold, dynamic e-commerce experience for a fast-fashion apparel brand, featuring interactive lookbooks and an optimized quick-cart system.",
    nextProjectDeliverables: "UI/UX Design, E-commerce Platform, Web Development",
    nextProjectIndustry: "Fashion & Retail",
    nextProjectImage: "/assets/images/section/revolution-fashion-store-mockup.webp"
  },
  {
    title: "Revolution",
    title2: "Fashion Store",
    tagline: "A bold, dynamic e-commerce experience for a fast-fashion apparel brand.",
    image: "/assets/images/section/revolution-fashion-store-mockup.webp",
    img1: "/assets/images/section/revolution-1.webp",
    img2: "/assets/images/section/revolution-2.webp",
    img3: "/assets/images/section/revolution-3.webp",
    img4: "/assets/images/section/revolution-4.webp",
    details: "Revolution is a high-performance fashion and apparel store designed to handle large retail catalogs while maintaining a fast, visual storefront. The design centers on high-contrast black-and-white grids, bold styling, and video lookbooks. It features an interactive grid where customers can preview models wearing clothing lines in real-time, select colors, and add items directly to a quick-access cart.",
    detailsContinued: "The website uses code splitting and lazy loading to maintain fast load times on mobile, ensuring seamless browsing during seasonal drops. The shopping checkout was customized to support multi-currency checkouts and express payment options, reducing friction for fashion-forward buyers worldwide.",
    deliverables: ["UI/UX Design", "E-commerce Platform", "Web Development"],
    industry: "Fashion & Retail",
    research: "We analyzed user behavior during high-traffic clothing drops and found that slow load times and confusing sizing grids accounted for 40% of abandoned purchases. We simplified the checkout steps and added a visual size guide based on model dimensions, enabling users to shop confidently in seconds.",
    results: "Following launch, Revolution saw a 38% increase in mobile conversions and a 50% decrease in sizing-related product returns. Sizing assistance tools and fast checkouts elevated customer satisfaction and boosted lifetime customer value.",
    nextProjectIndex: 2,
    nextProjectTitle: "Marble Fashion E-commerce",
    nextProjectDesc: "An editorial-driven digital storefront for an upscale clothing collection, emphasizing high-resolution photography and custom grids.",
    nextProjectDeliverables: "UI/UX Design, Webflow Development, Motion Design",
    nextProjectIndustry: "Luxury Fashion",
    nextProjectImage: "/assets/images/section/marble-fashion-ecommerce-mockup.webp"
  },
  {
    title: "Marble",
    title2: "Fashion E-commerce",
    tagline: "An editorial-driven digital storefront for an upscale clothing collection.",
    image: "/assets/images/section/marble-fashion-ecommerce-mockup.webp",
    img1: "/assets/images/section/marble-1.webp",
    img2: "/assets/images/section/marble-2.webp",
    img3: "/assets/images/section/marble-3.webp",
    img4: "/assets/images/section/marble-4.webp",
    details: "Marble is a premium digital experience created for a fashion e-commerce storefront looking to establish a strong storytelling narrative online. The visual theme uses elegant editorial layouts, large-format imagery, and micro-interactions. The interface presents clothing collections like an art gallery, inviting customers to explore fabric sources, designer interviews, and styling tips.",
    detailsContinued: "We built the site around optimized interactive grids that showcase fabric details under zoom. Smooth transitions and custom loading animations enhance the premium feel of the brand. This project demonstrates how e-commerce can transcend simple product listings to build brand prestige and customer desire.",
    deliverables: ["UI/UX Design", "Webflow Development", "Motion Design"],
    industry: "Luxury Fashion",
    research: "We studied luxury consumer expectations and found that storytelling, styling guidance, and visual authenticity are key to justifying luxury price points. We designed custom editorial guides and integrated video loops showing clothing movement to convey texture, fit, and silhouette visually.",
    results: "The digital launch generated significant press coverage and saw a 34% increase in Average Order Value (AOV). Customers spent 50% more time on the platform exploring brand collection stories, resulting in strong brand loyalty and repeat purchases.",
    nextProjectIndex: 3,
    nextProjectTitle: "Mojave Clothing Store",
    nextProjectDesc: "Minimal and functional e-commerce design highlighting sustainable outerwear fabric narratives and optimized mobile checkouts.",
    nextProjectDeliverables: "Shopify Development, UI Design, Brand Storytelling",
    nextProjectIndustry: "Apparel & Outerwear",
    nextProjectImage: "/assets/images/section/mojave-clothing-store-mockup.webp"
  },
  {
    title: "Mojave",
    title2: "Clothing Store",
    tagline: "Minimal and functional e-commerce design highlighting sustainable outerwear fabric narratives.",
    image: "/assets/images/section/mojave-clothing-store-mockup.webp",
    img1: "/assets/images/section/mojave-1.webp",
    img2: "/assets/images/section/mojave-2.webp",
    img3: "/assets/images/section/mojave-3.webp",
    img4: "/assets/images/section/mojave-4.webp",
    details: "Mojave is a highly functional storefront designed for an outerwear and everyday essentials brand. Built with Shopify, the storefront focuses on sustainability storytelling, showing the lifecycle of organic materials and outerwear construction. The interface is clean and minimalist, allowing product photography and textile close-ups to stand out.",
    detailsContinued: "We optimized mobile checkouts, shipping calculators, and lazy-loading grids. The site includes sustainable material icons, detail cards, and customer reviews linked directly to sizing data to help customers choose outerwear that fits correctly.",
    deliverables: ["Shopify Development", "UI Design", "Brand Storytelling"],
    industry: "Apparel & Outerwear",
    research: "Outerwear purchases require a high level of trust regarding warmth, durability, and weather resistance. We added structured charts illustrating wind resistance, water-proofing, and temperature ranges for each piece. This helped customers make informed decisions directly on the product detail page.",
    results: "Following launch, Mojave experienced a 34% increase in conversions and a 25% lift in average order value. The sustainable narrative resonated deeply with customers, boosting returning customer rates and overall search rankings.",
    nextProjectIndex: 0,
    nextProjectTitle: "Cora Beauty Skincare Store",
    nextProjectDesc: "A luxury skincare and cosmetics e-commerce storefront showcasing clean, organic beauty products and optimized conversion funnels.",
    nextProjectDeliverables: "UI/UX Design, E-commerce Storefront, Brand Identity",
    nextProjectIndustry: "Skincare & Beauty",
    nextProjectImage: "/assets/images/section/cora-beauty-ecommerce-mockup.webp"
  }
];

function WorkSingle() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const projectIndex = SLUGS.indexOf(slug);
  const rootRef = useRef(null);
  useScrollFade(rootRef);

  const project = PROJECT_DATA[projectIndex] || PROJECT_DATA[0];
  const currentIndex = projectIndex >= 0 ? projectIndex : 0;

  return (
    <div ref={rootRef} className="service-single-page-wrapper">
      <Helmet>
        <title>{project.title} - FanzCreative</title>
        <meta name="description" content={`${project.title} ${project.title2} — project by FanzCreative.`} />
      </Helmet>
      {/* Hero Banner */}
      <div className="section-hero v2" style={{ position: 'relative' }}>
        <div className="hero-image" style={{ position: 'absolute', inset: 0, zIndex: 0 }}></div>
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.45)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', zIndex: 1, pointerEvents: 'none' }}></div>
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div className="content-wrap text-center">
            <div className="title text-display-2 effectFade fadeRotateX" key={currentIndex}>
              <span className="title1 fw-semibold text-gradient-1">{project.title}</span>
              <br />
              <div className="title2 d-flex gap-20 justify-content-center flex-wrap align-items-center">
                <span className="fw-semibold text-gradient-1">{project.title2}</span>
                <AnimatedTitleIcon style={{ transform: 'translateY(16px)' }} />
              </div>
            </div>
            <p className="text text-body-3 effectFade fadeUp">
              {project.tagline}
            </p>
          </div>
        </div>
      </div>

      {/* section-work-single */}
      <div id="works" className="section-services-single flat-spacing pt-0">
        <div className="container">
          {/* Top Image */}
          <div className="row">
            <div className="col-12">
              <div className="top-image mb-40 effectFade fadeZoom" key={`img-top-${currentIndex}`}>
                <img loading="lazy" src={project.image} alt={project.title} />
              </div>
            </div>
            <div className="col-12">
              <div className="heading fw-semibold mb-20 effectFade fadeUp">Project Details</div>
            </div>
          </div>

          {/* Details Text + Tags */}
          <div className="row mb-80">
            <div className="col-md-7 md-mb-24">
              <p className="text-secondary effectFade fadeUp">
                {project.details}
              </p>
            </div>
            <div className="col-md-5">
              <p className="text-secondary mb-30 effectFade fadeUp">
                {project.detailsContinued}
              </p>
              <div className="list-tags effectFade fadeUp">
                {project.deliverables.map((item, idx) => (
                  <a key={idx} href="#" className="tags-item fw-semibold" onClick={(e) => { e.preventDefault(); playClick(); }} onMouseEnter={playHover}>{item}</a>
                ))}
              </div>
              <div className="mt-3 text-body-1 fw-semibold text-secondary effectFade fadeUp">
                INDUSTRY: <span className="text-white">{project.industry}</span>
              </div>
            </div>
          </div>

          {/* Two Images Side by Side */}
          <div className="row mb-40">
            <div className="col-md-8 md-mb-24">
              <div className="image effectFade fadeUp" key={`img-2-${currentIndex}`}>
                <img loading="lazy" src={project.img1} alt="" />
              </div>
            </div>
            <div className="col-md-4">
              <div className="image effectFade fadeUp" data-delay="0.1" key={`img-3-${currentIndex}`}>
                <img loading="lazy" src={project.img2} alt="" />
              </div>
            </div>
          </div>

          {/* Project Research */}
          <div className="row mb-40">
            <div className="col-12">
              <div className="heading fw-semibold mb-20 effectFade fadeUp">Project Research</div>
              <p className="text-secondary effectFade fadeUp">
                {project.research}
              </p>
            </div>
          </div>

          {/* Key Deliverables + Image Sidebar */}
          <div className="row justify-content-between mb-40">
            <div className="col-md-6 md-mb-24">
              <div className="heading fw-semibold mb-20 effectFade fadeUp">Project Results</div>
              <p className="text-secondary mb-30 effectFade fadeUp">
                {project.results}
              </p>
              <h6 className="title fw-semibold mb-16 effectFade fadeUp">Key Deliverables</h6>
              <ul className="d-grid gap-8 mb-30">
                {project.deliverables.map((item, idx) => (
                  <li key={idx} className="effectFade fadeUp">+ {item}</li>
                ))}
              </ul>
              <a href="#contact" className="tf-btn effectFade fadeRotateX" onClick={playPop} onMouseEnter={playHover}>
                Start a Project
              </a>
            </div>
            <div className="col-md-5">
              <div className="image bot-image effectFade fadeUp" key={`img-4-${currentIndex}`}>
                <img loading="lazy" src={project.img3} alt="" />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Testimonials */}
      <div className="box-black">
        <div className="light-box"></div>
        <img loading="lazy" className="light-top" src="/assets/images/item/light-top.webp" alt="" />
        <img loading="lazy" className="light-bot" src="/assets/images/item/light-bot.webp" alt="" style={{ display: 'block', marginBottom: '-4px' }} />
        <Testimonials className="" />
      </div>

      {/* Next Project */}
      <div className="section-featured-works flat-spacing">
        <div className="container">
          <div className="heading-section center mb-64">
            <div className="heading-sub fw-semibold effectFade fadeUp">Project</div>
            <div className="heading-title text-gradient-3 effectFade fadeRotateX" key={`next-${currentIndex}`}>Next Project</div>
          </div>
          <div className="featured-works-list position-relative">
            <div className="element effectFade fadeUp" key={`next-card-${currentIndex}`}>
              <div className="featured-works-item" onMouseEnter={playHover}>
                <MouseFollowImage
                  src={project.nextProjectImage}
                  alt={project.nextProjectTitle}
                  href={`/project/${SLUGS[project.nextProjectIndex]}`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/project/${SLUGS[project.nextProjectIndex]}`);
                  }}
                />
                <div className="content">
                  <div className="pagi-dot">
                    {[0, 1, 2, 3].map((d) => (
                      <span key={d} className={d === project.nextProjectIndex ? 'active' : ''}></span>
                    ))}
                  </div>
                  <div className="bot">
                    <h4 className="heading fw-semibold">
                      {project.nextProjectTitle.split(' ')[0]} <br /> {project.nextProjectTitle.split(' ').slice(1).join(' ')}
                    </h4>
                    <div className="grid-text">
                      <div className="item">
                        <div className="title text-secondary">DESCRIPTION</div>
                        <div className="text-body-3 fw-semibold">{project.nextProjectDesc}</div>
                      </div>
                      <div className="item">
                        <div className="title text-secondary">DELIVERABLES</div>
                        <div className="fw-semibold text-body-3">{project.nextProjectDeliverables}</div>
                      </div>
                      <div className="item">
                        <div className="title text-secondary">INDUSTRY</div>
                        <div className="fw-semibold text-body-3">{project.nextProjectIndustry}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .section-hero.v2 .content-wrap .title-icon {
          position: relative;
          z-index: 1;
        }
        .section-hero.v2 .content-wrap .title-icon .box {
          position: relative;
          z-index: 2;
        }
        .section-hero.v2 .content-wrap .text {
          position: relative;
          z-index: 4;
        }
        .section-services-single {
          position: relative;
          z-index: 5;
        }
      `}</style>
    </div>
  );
}

export default WorkSingle;
