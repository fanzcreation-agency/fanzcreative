import { Link } from 'react-router-dom';
import { playClick, playHover } from '../hooks/useSound';
import { useProjectCollection } from '../hooks/useProjectCollection';

function RecentWorks() {
  const { featuredProjects } = useProjectCollection();
  const caseStudies = featuredProjects.map((project) => ({
      id: project.slug,
      title: project.title,
      image: project.img,
      link: `/project/${project.slug}`,
      category: project.projectType || project.industry || 'Project',
    }));
  if (!caseStudies.length) return null;
  return (
    <section className="recent-works-section" style={{ backgroundColor: '#09090b', color: '#ffffff', padding: '90px 0 100px', overflow: 'hidden' }}>
      <style>{`
        .recent-works-section,
        .recent-works-section h3,
        .recent-works-section h5 {
          color: #ffffff !important;
        }
        .rw-card-wrapper {
          display: block;
          position: relative;
          border-radius: 24px;
          overflow: hidden;
          background: #18181b;
          height: 380px;
          min-width: 295px;
          flex: 0 0 calc(25% - 16px);
          transition: box-shadow 0.45s ease, border-color 0.45s ease;
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #ffffff;
          text-decoration: none;
        }
        @media (max-width: 1200px) {
          .rw-card-wrapper {
            flex: 0 0 calc(33.33% - 16px);
            min-width: 270px;
          }
        }
        @media (max-width: 768px) {
          .rw-card-wrapper {
            flex: 0 0 calc(50% - 12px);
            height: 310px;
            min-width: 240px;
          }
        }
        @media (max-width: 480px) {
          .rw-card-wrapper {
            flex: 0 0 88%;
            height: 300px;
          }
        }
        .rw-card-wrapper:hover {
          box-shadow: 0 22px 46px -22px rgba(0, 0, 0, 0.85);
          border-color: rgba(255, 255, 255, 0.18);
          color: #ffffff;
        }
        .rw-scroll-container.d-flex.gap-4 {
          gap: 20px !important;
        }
        .rw-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.75s cubic-bezier(0.16, 1, 0.3, 1), filter 0.75s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .rw-card-image-link {
          display: block;
          width: 100%;
          height: 100%;
        }
        .rw-card-wrapper:hover .rw-card-img {
          transform: scale(1.045);
          filter: saturate(1.05) contrast(1.04);
        }
        .rw-card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.88) 0%, rgba(0, 0, 0, 0.2) 60%, transparent 100%);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 24px;
          z-index: 2;
          pointer-events: none;
        }
        .rw-card-overlay a {
          pointer-events: auto;
        }
        .rw-card-category {
          color: rgba(255, 255, 255, 0.68);
          font-size: 12px;
          letter-spacing: 0.06em;
          line-height: 1.3;
          margin-bottom: 8px;
          text-transform: uppercase;
        }
        .rw-card-title {
          color: #ffffff !important;
          font-size: 18px;
          font-weight: 600;
          line-height: 1.28;
          margin: 0 0 16px;
        }
        .rw-card-title a {
          color: inherit;
          text-decoration: none;
        }
        .rw-casestudy-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 14px 20px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: #ffffff;
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.01em;
          text-decoration: none;
          transition: all 0.3s ease;
        }
        .rw-card-wrapper:hover .rw-casestudy-btn,
        .rw-casestudy-btn:focus-visible {
          background: #0af9cf;
          border-color: #0af9cf;
          box-shadow: 0 6px 20px rgba(10, 249, 207, 0.45);
          color: #ffffff;
        }
        .rw-scroll-container::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <div className="container">
        {/* Section Heading */}
        <div className="d-flex justify-content-between align-items-center" style={{ marginBottom: '52px' }}>
          <h3 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '14px', color: '#ffffff' }}>
            Recent Works
            <span style={{ display: 'inline-flex', width: '38px', height: '38px', borderRadius: '50%', border: '1.5px solid rgba(255, 255, 255, 0.4)', alignItems: 'center', justifyContent: 'center', color: '#ffffff', backgroundColor: 'rgba(255, 255, 255, 0.06)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <polyline points="19 12 12 19 5 12"></polyline>
              </svg>
            </span>
          </h3>

        </div>

        {/* Horizontal Carousel Track */}
        <div
          className="rw-scroll-container d-flex gap-4"
          style={{
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
            paddingBottom: '15px',
          }}
        >
          {caseStudies.map((item) => (
            <div key={item.id} className="rw-card-wrapper" style={{ scrollSnapAlign: 'start' }} onMouseEnter={playHover}>
              <Link to={item.link} className="rw-card-image-link" onClick={playClick} aria-label={`View ${item.title} project`}>
                <img src={item.image} alt={item.title} className="rw-card-img" loading="lazy" />
              </Link>
              <div className="rw-card-overlay">
                <span className="rw-card-category">
                  {item.category}
                </span>
                <h5 className="rw-card-title">
                  <Link to={item.link} onClick={playClick}>{item.title}</Link>
                </h5>
                <Link to={item.link} className="rw-casestudy-btn" onClick={playClick}>
                  View Casestudy <span style={{ fontSize: '14px' }}>↗</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default RecentWorks;
