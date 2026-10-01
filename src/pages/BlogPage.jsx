import { useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useScrollFade } from '../hooks/useScrollFade';
import Contact from '../components/Contact';
import { playClick, playHover } from '../hooks/useSound';

import AnimatedTitleIcon from '../components/AnimatedTitleIcon';

const BLOG_POSTS = [
  {
    id: 1,
    slug: 'future-of-ui-ux',
    title: 'The Future of UI/UX in E-Commerce',
    excerpt: 'Discover how emerging design trends and smart automation are redefining the way customers interact with online stores.',
    date: 'Sep 30, 2026',
    category: 'Design',
    img: '/assets/images/blog/blog_ui_ux.webp'
  },
  {
    id: 2,
    slug: 'ai-automation-game-changer',
    title: 'Why AI Automation is a Game Changer',
    excerpt: 'Learn how integrating artificial intelligence into your daily workflows can save thousands of hours and boost revenue.',
    date: 'Sep 28, 2026',
    category: 'Technology',
    img: '/assets/images/blog/blog_ai_automation.webp'
  },
  {
    id: 3,
    slug: 'scalable-web-platforms',
    title: 'Building Scalable Web Platforms',
    excerpt: 'A deep dive into modern web development practices, focusing on performance, accessibility, and robust architecture.',
    date: 'Sep 10, 2026',
    category: 'Development',
    img: '/assets/images/blog/blog_web_dev.webp'
  },
  {
    id: 4,
    slug: 'brand-identity-that-scales',
    title: 'Building a Brand Identity That Scales',
    excerpt: 'A practical guide to creating a visual system that stays recognizable across packaging, social media, and the web.',
    date: 'Aug 27, 2026',
    category: 'Branding',
    img: '/assets/images/blog/blog_brand_identity.webp'
  },
  {
    id: 5,
    slug: 'website-performance-design',
    title: 'Why Website Performance Is a Design Decision',
    excerpt: 'How image choices, layout stability, and thoughtful interactions shape a faster experience for every visitor.',
    date: 'Aug 13, 2026',
    category: 'Development',
    img: '/assets/images/blog/blog_web_performance.webp'
  },
  {
    id: 6,
    slug: 'motion-design-with-purpose',
    title: 'Motion Design With a Purpose',
    excerpt: 'Use movement to guide attention, clarify feedback, and give digital products a more confident rhythm.',
    date: 'Jul 30, 2026',
    category: 'Motion',
    img: '/assets/images/blog/blog_motion_design.webp'
  }
];

function BlogPage() {
  const pageRef = useRef(null);
  useScrollFade(pageRef);

  return (
    <div ref={pageRef} className="blog-page-wrapper">
      <Helmet>
        <title>Blog - FanzCreative</title>
      </Helmet>

      {/* Hero Banner */}
      <div className="section-hero v1">
        <div className="hero-image"></div>
        <div className="container">
          <div className="content-wrap text-center">
            <div className="title text-display-2 effectFade fadeZoom">
              <span className="title1 fw-semibold text-gradient-1">Our Latest</span>
              <br />
              <div className="title2 d-flex gap-20 justify-content-center flex-wrap align-items-center">
                <span className="fw-semibold text-gradient-1">Blog Posts</span>
                <AnimatedTitleIcon />
              </div>
            </div>
            <p className="text effectFade fadeUp">
              Discover insights, strategies, and trends shaping the future <br /> of digital experiences.
            </p>
          </div>
        </div>
      </div>
      {/* /Hero Banner */}

      {/* Blog Grid */}
      <section className="section-blog flat-spacing">
        <style>{`
          .blog-page-wrapper .blog-posts-grid .article-blog {
            display: flex;
            flex-direction: column;
            height: 100%;
          }
          .blog-page-wrapper .blog-posts-grid .blog-image {
            display: block;
            width: 100%;
            aspect-ratio: 4 / 3;
            overflow: hidden;
          }
          .blog-page-wrapper .blog-posts-grid .blog-image img {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .blog-page-wrapper .blog-posts-grid .blog-content {
            flex: 1;
            gap: 20px;
            padding: 24px;
          }
          .blog-page-wrapper .blog-posts-grid .infor_name {
            -webkit-line-clamp: 2;
            line-height: 1.3;
          }
          .blog-page-wrapper .blog-posts-grid .blog-excerpt {
            margin-top: 12px;
            line-height: 1.55;
          }
        `}</style>
        <div className="container">
          <div className="tf-grid-layout sm-col-2 lg-col-3 blog-posts-grid">
            {BLOG_POSTS.map((post, i) => (
              <div key={post.id} className="article-blog hover-img effectFade fadeUp no-div" data-delay={(i * 0.1).toString()}>
                <Link to={`/blog/single/${post.slug}`} className="blog-image img-style" onClick={playClick} onMouseEnter={playHover}>
                  <img loading="lazy" width="426" height="320" src={post.img} alt={post.title} />
                </Link>
                <div className="blog-content">
                  <div className="infor">
                    <p className="infor_sub text-secondary">
                      {post.category} · {post.date}
                    </p>
                    <h6 className="fw-semibold">
                      <Link to={`/blog/single/${post.slug}`} className="link1 infor_name" onClick={playClick} onMouseEnter={playHover}>
                        {post.title}
                      </Link>
                    </h6>
                    <p className="blog-excerpt text-secondary">{post.excerpt}</p>
                  </div>
                  <Link to={`/blog/single/${post.slug}`} className="tf-btn-2" onClick={playClick} onMouseEnter={playHover}>
                    Read article
                    <i className="icon icon-arrow-top-right"></i>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* /Blog Grid */}

      <Contact />
    </div>
  );
}

export default BlogPage;
