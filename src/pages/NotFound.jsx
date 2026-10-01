import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { playClick, playHover } from '../hooks/useSound';

function NotFound() {
  const navigate = useNavigate();

  const handleHomeClick = (e) => {
    e.preventDefault();
    playClick();
    navigate('/');
  };

  return (
    <section className="section-404 flat-spacing">
      <Helmet>
        <title>404 Page Not Found - FanzCreative</title>
        <meta name="description" content="Page not found. Return to FanzCreative homepage." />
      </Helmet>
      <div className="glow-blur-orb"></div>

      <div className="container text-center">
        <h1 className="title fw-semibold text-display-1 text-gradient-1">
          404 Page Not Found
        </h1>
        <p className="desc text-body-1 text-white-64">
          Sorry, we couldn't find the page you were looking for. <br />
          We suggest that you return to the homepage.
        </p>
        <div className="button-wrap">
          <a
            href="/"
            className="tf-btn"
            onClick={handleHomeClick}
            onMouseEnter={playHover}
          >
            <span className="text-body-2 fw-semibold">HOME PAGE</span>
          </a>
        </div>
      </div>

      <style>{`
        .section-404 {
          padding: 240px 0 180px;
          position: relative;
          overflow: hidden;
          background-color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 70vh;
        }
        .section-404 .container {
          position: relative;
          z-index: 2;
        }
        .section-404 .title {
          margin-bottom: 24px;
          font-size: clamp(48px, 6vw, 80px);
          line-height: 1.25;
          letter-spacing: -0.03em;
          opacity: 0;
        }
        .section-404 .desc {
          margin-bottom: 40px;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.6;
          color: #52525b !important;
          opacity: 0;
        }
        .section-404 .button-wrap {
          display: flex;
          justify-content: center;
          opacity: 0;
        }
        .section-404 .tf-btn {
          max-width: 200px;
          width: 100%;
          justify-content: center;
        }
        .glow-blur-orb {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(10, 249, 207, 0.07) 0%, rgba(10, 249, 207, 0) 70%);
          pointer-events: none;
          z-index: 1;
          filter: blur(40px);
          animation: pulseGlow 8s ease-in-out infinite alternate;
        }
        @keyframes pulseGlow {
          0% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.8; }
          100% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
        }
        @keyframes fadeInNotFound {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .section-404 .title,
        .section-404 .desc,
        .section-404 .button-wrap {
          animation: fadeInNotFound 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .section-404 .desc { animation-delay: 0.15s; }
        .section-404 .button-wrap { animation-delay: 0.3s; }
        @media (max-width: 767px) {
          .section-404 { padding: 160px 0 100px; }
        }
      `}</style>
    </section>
  );
}

export default NotFound;
