import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useScrollFade } from '../hooks/useScrollFade';
import Contact from '../components/Contact';
import NotFound from './NotFound';
import { playClick, playHover, playPop } from '../hooks/useSound';

const BLOG_DATA = {
  'future-of-ui-ux': {
    title: 'The Future of UI/UX in E-Commerce',
    date: 'Oct 15, 2026',
    category: 'Design',
    img: '/assets/images/blog/blog_ui_ux.webp',
    content: (
      <>
        <p className="mb-24 text-secondary">
          In the rapidly evolving world of e-commerce, user interface (UI) and user experience (UX) design are no longer just about aesthetics—they are the critical drivers of conversion and customer loyalty. As we move towards more immersive digital environments, the lines between physical and digital shopping are blurring. Modern consumers expect highly personalized, frictionless experiences that anticipate their needs before they even articulate them.
        </p>
        <p className="mb-24 text-secondary">
          One of the most significant shifts we are seeing is the integration of predictive design. By leveraging data analytics and machine learning, platforms can now adapt their layouts, product recommendations, and even color schemes in real-time based on user behavior. This level of dynamic personalization ensures that every interaction feels bespoke, significantly reducing bounce rates and cart abandonment. Furthermore, micro-interactions—subtle animations or visual feedback—are becoming essential in guiding users intuitively through the purchasing funnel.
        </p>
        <h4 className="fw-semibold mb-16 mt-40">The Rise of Voice and Gesture Interfaces</h4>
        <p className="mb-24 text-secondary">
          Looking ahead, traditional click-and-scroll interfaces will increasingly be augmented by voice and gesture controls. E-commerce platforms that adopt conversational UI and augmented reality (AR) try-on features will hold a distinct competitive advantage. The future of UI/UX in e-commerce is about removing all cognitive load from the shopper, making the journey from discovery to purchase as natural and effortless as possible.
        </p>
      </>
    )
  },
  'ai-automation-game-changer': {
    title: 'Why AI Automation is a Game Changer',
    date: 'Sep 28, 2026',
    category: 'Technology',
    img: '/assets/images/blog/blog_ai_automation.webp',
    content: (
      <>
        <p className="mb-24 text-secondary">
          Artificial Intelligence (AI) automation is no longer a futuristic concept reserved for tech giants; it has become a fundamental necessity for businesses aiming to scale efficiently. From customer service chatbots that handle complex queries to automated supply chain management systems, AI is transforming operational workflows across every industry. The true power of AI lies in its ability to process vast amounts of data instantaneously, identifying patterns and making decisions faster and more accurately than humanly possible.
        </p>
        <p className="mb-24 text-secondary">
          By automating repetitive, time-consuming tasks, organizations can redirect their human capital towards strategic, creative, and high-value initiatives. This shift not only boosts productivity but also enhances employee satisfaction by eliminating mundane work. In marketing, for example, AI automation tools can analyze consumer behavior to deploy hyper-targeted campaigns, optimizing ad spend and maximizing ROI without manual intervention.
        </p>
        <h4 className="fw-semibold mb-16 mt-40">Embracing the AI Revolution</h4>
        <p className="mb-24 text-secondary">
          However, the successful implementation of AI requires a strategic approach. It's not just about adopting new tools, but about fundamentally reimagining how work is done. Companies that embrace AI automation as a core component of their business strategy will not only survive the digital transformation but will lead the charge in defining the future of their respective markets.
        </p>
      </>
    )
  },
  'scalable-web-platforms': {
    title: 'Building Scalable Web Platforms',
    date: 'Sep 10, 2026',
    category: 'Development',
    img: '/assets/images/blog/blog_web_dev.webp',
    content: (
      <>
        <p className="mb-24 text-secondary">
          In an era where digital presence dictates business success, building a web platform that can handle explosive growth without compromising performance is paramount. Scalability is not just about adding more servers; it's about architecture, clean code, and strategic infrastructure choices from day one. A truly scalable web platform is resilient, agile, and capable of adapting to fluctuating traffic demands seamlessly.
        </p>
        <p className="mb-24 text-secondary">
          Modern web development relies heavily on microservices architecture and cloud-native technologies. By decoupling the frontend from the backend and breaking down monolithic applications into smaller, independent services, development teams can deploy updates, fix bugs, and scale specific components independently. This approach drastically reduces downtime and ensures a consistently smooth experience for the end-user, regardless of the load on the system.
        </p>
        <h4 className="fw-semibold mb-16 mt-40">Performance is a Feature</h4>
        <p className="mb-24 text-secondary">
          Furthermore, performance optimization—such as aggressive caching, content delivery networks (CDNs), and optimized database queries—must be treated as a core feature, not an afterthought. A platform that is slow to load will lose users faster than any marketing campaign can acquire them. Building for scale means building for speed, reliability, and continuous iteration.
        </p>
      </>
    )
  }
};

function BlogSingle() {
  const { slug } = useParams();
  const pageRef = useRef(null);
  useScrollFade(pageRef);

  const post = BLOG_DATA[slug];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!post) {
    return <NotFound />;
  }

  return (
    <div ref={pageRef} className="blog-single-wrapper">
      <Helmet>
        <title>{post.title} - FanzCreative</title>
      </Helmet>

      {/* page-title */}
      <div className="section-page-title">
        <div className="container text-center">
          <h1 className="page-title fw-semibold effectFade fadeZoom">FanzCreative</h1>
          <div className="breadcrumbs effectFade fadeUp">
            <Link to="/" className="link1" onClick={playClick} onMouseEnter={playHover}>Home</Link>
            <div>/</div>
            <div>Blog</div>
          </div>
        </div>
      </div>
      {/* /page-title */}

      {/* Blog With Sidebar */}
      <section className="section-blog flat-spacing">
        <div className="container">
          <div className="row justify-content-between">
            <div className="col-lg-7">
              <div className="blog-single-wrap">
                <div className="image effectFade fadeZoom mb-40">
                  <img loading="lazy" width="777" height="548" src={post.img} alt={post.title} style={{ objectFit: 'cover', width: '100%', height: '100%', borderRadius: '24px' }} />
                </div>
                <h2 className="title fw-semibold mb-24">{post.title}</h2>
                <div className="meta-list mb-40">
                  <div className="meta-item">
                    <i className="icon icon-user-solid"></i>
                    <Link to="#" className="link">Admin</Link>
                  </div>
                  <div className="meta-item">
                    <i className="icon icon-clock-solid"></i>
                    <Link to="#" className="link">{post.date}</Link>
                  </div>
                  <div className="meta-item">
                    <i className="icon icon-comments-solid"></i>
                    <span>No Comments</span>
                  </div>
                </div>
                
                <div className="content-body mb-40" style={{ fontSize: '16px', lineHeight: '1.8' }}>
                  {post.content}
                </div>

                <div className="blockquote-wrap mb-40">
                  <h5 className="fw-medium text-white">“ A little universe of inspiration — where passion meets professionalism and creativity knows no bounds. Exceptional service, stunning products that made me go 'wow' at first glance, and prices that make you smile! ”</h5>
                  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M44.375 70.4063V41.0938C44.375 33.0729 47.0729 26.3646 52.4687 20.9688C58.0104 15.4271 65.5208 11.6354 75 9.59375V29.0625C71.3542 30.2292 68.9479 31.6875 67.7812 33.4375C66.6146 35.0417 65.9583 37.0833 65.8125 39.5625H75V70.4063H44.375ZM5 70.4063V41.0938C5 33.0729 7.69792 26.3646 13.0938 20.9688C18.6354 15.4271 26.1458 11.6354 35.625 9.59375V29.0625C32.125 30.2292 29.7187 31.6875 28.4062 33.4375C27.2396 35.0417 26.5833 37.0833 26.4375 39.5625H35.625V70.4063H5Z" fill="#27272A"/>
                  </svg>
                </div>

                <div className="entry-footer">
                  <div className="tags-links">
                    <h6 className="text-body-1">Tags:</h6>
                    <div className="list-tags">
                      <Link to="#" className="tags-item fw-semibold" onClick={(e) => { e.preventDefault(); playClick(); }} onMouseEnter={playHover}>Technology</Link>
                      <Link to="#" className="tags-item fw-semibold" onClick={(e) => { e.preventDefault(); playClick(); }} onMouseEnter={playHover}>Design</Link>
                      <Link to="#" className="tags-item fw-semibold" onClick={(e) => { e.preventDefault(); playClick(); }} onMouseEnter={playHover}>Innovation</Link>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-12">
                    <h6 className="text-body-1">Share:</h6>
                    <div className="tf-social justify-content-center">
                      <a href="https://x.com/" target="_blank" rel="noreferrer" className="social-item" onMouseEnter={playHover}>
                        <i className="icon icon-twitter-x"></i>
                      </a>
                      <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer" className="social-item" onMouseEnter={playHover}>
                        <i className="icon icon-linkedin-in"></i>
                      </a>
                      <a href="https://github.com/" target="_blank" rel="noreferrer" className="social-item" onMouseEnter={playHover}>
                        <i className="icon icon-github"></i>
                      </a>
                    </div>
                  </div>
                </div>

                <div className="comment-wrap">
                  <h4 className="heading fw-semibold">Comments</h4>
                  <div className="author">
                    <div className="image">
                      <img loading="lazy" width="48" height="48" src="/assets/images/section/tes-1.webp" alt="Image" />
                    </div>
                    <div className="content">
                      <div className="info">
                        <h6 className="name fw-semibold text-body-1">
                          <Link className="link1" to="#" onClick={(e) => { e.preventDefault(); playClick(); }} onMouseEnter={playHover}>Davies</Link>
                        </h6>
                        <p className="time text-body-3 text-white-64">July 8, 2026 at 7:35 am</p>
                      </div>
                      <a href="#post-comment" className="reply link1" onClick={playClick} onMouseEnter={playHover}>Reply<i className="icon icon-arrow-top-right"></i></a>
                      <p className="desc">“ Sed vitae velit erat. Pellentesque lobortis felis vel mi congue, in
                          sollicitudin orci tincidunt. Praesent turpis justo, posuere eget justo sit
                          amet, efficitur suscipit elit. “</p>
                    </div>
                  </div>
                </div>

                <div className="post-comment" id="post-comment">
                  <h4 className="heading fw-semibold">Post a Comments</h4>
                  <p className="text text-body-1">Your email address will not be published. Required fields are marked *</p>
                  <form className="form-cta style-2" onSubmit={(e) => e.preventDefault()}>
                    <div className="form-content">
                      <fieldset>
                        <label className="fw-semibold text-body-3 mb-12">Your Name</label>
                        <input type="text" placeholder="Enter your full name" required />
                      </fieldset>
                      <fieldset>
                        <label className="fw-semibold text-body-3 mb-12">Your Email</label>
                        <input type="email" placeholder="Enter your email" required />
                      </fieldset>
                      <fieldset>
                        <label className="fw-semibold text-body-3 mb-12">Message</label>
                        <textarea name="text" className="rounded-0"></textarea>
                      </fieldset>
                    </div>
                    <div className="form-action">
                      <button type="submit" className="tf-btn w-100" onClick={playPop} onMouseEnter={playHover}>Submit Message</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="blog-sidebar m-lg-0">
                <div className="sidebar-item effectFade fadeUp no-div">
                  <h5 className="sidebar-title">Search</h5>
                  <form className="form-search" onSubmit={(e) => e.preventDefault()}>
                    <fieldset className="text">
                      <input type="text" placeholder="Search" name="search" required />
                    </fieldset>
                    <button type="submit" className="link1 text-white" onClick={playClick} onMouseEnter={playHover}>
                      <i className="icon icon-search-solid"></i>
                    </button>
                  </form>
                </div>
                <div className="sidebar-item effectFade fadeUp no-div">
                  <h5 className="sidebar-title">Recent posts</h5>
                  <div className="list-relatest-post">
                    <div className="relatest-post-item">
                      <div className="image">
                        <img loading="lazy" width="80" height="80" src="/assets/images/blog/blog_ui_ux.webp" alt="Recent post" style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                      </div>
                      <div className="content">
                        <h6 className="title text-body-1">
                          <Link to="/blog/single/future-of-ui-ux" className="link1" onClick={playClick} onMouseEnter={playHover}>
                            The Future of UI/UX in E-Commerce
                          </Link>
                        </h6>
                        <p className="time text-body-3 text-white-64">Oct 15, 2026</p>
                      </div>
                    </div>
                    <div className="relatest-post-item">
                      <div className="image">
                        <img loading="lazy" width="80" height="80" src="/assets/images/blog/blog_ai_automation.webp" alt="Recent post" style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                      </div>
                      <div className="content">
                        <h6 className="title text-body-1">
                          <Link to="/blog/single/ai-automation-game-changer" className="link1" onClick={playClick} onMouseEnter={playHover}>
                            Why AI Automation is a Game Changer
                          </Link>
                        </h6>
                        <p className="time text-body-3 text-white-64">Sep 28, 2026</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="sidebar-item effectFade fadeUp no-div">
                  <h5 className="sidebar-title">Category</h5>
                  <div className="sidebar-categories">
                    <div className="item">
                      <Link to="#" className="text-body-1 link1" onClick={(e) => { e.preventDefault(); playClick(); }} onMouseEnter={playHover}>Developer</Link>
                      <span className="text-body-3 text-white-64">(4)</span>
                    </div>
                    <div className="item">
                      <Link to="#" className="text-body-1 link1" onClick={(e) => { e.preventDefault(); playClick(); }} onMouseEnter={playHover}>Design</Link>
                      <span className="text-body-3 text-white-64">(2)</span>
                    </div>
                  </div>
                </div>
                <div className="sidebar-item effectFade fadeUp no-div">
                  <h5 className="sidebar-title">Popular tag</h5>
                  <div className="list-tags">
                    <Link to="#" className="tags-item fw-semibold" onClick={(e) => { e.preventDefault(); playClick(); }} onMouseEnter={playHover}>Stakeholder</Link>
                    <Link to="#" className="tags-item fw-semibold" onClick={(e) => { e.preventDefault(); playClick(); }} onMouseEnter={playHover}>Value model</Link>
                    <Link to="#" className="tags-item fw-semibold" onClick={(e) => { e.preventDefault(); playClick(); }} onMouseEnter={playHover}>Data readiness</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* /Blog With Sidebar */}

      <Contact />
    </div>
  );
}

export default BlogSingle;
