function PageLoader() {
  return (
    <div className="page-loader">
      <div className="loader-content">
        <img src="/assets/images/logo/fanz-logo.webp" alt="FanzCreative" className="loader-logo" />
        <div className="loader-bar-track">
          <div className="loader-bar-fill"></div>
        </div>
      </div>
      <style>{`
        .page-loader {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #09090b;
        }
        .loader-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 32px;
        }
        .loader-logo {
          height: 48px;
          width: auto;
          object-fit: contain;
          filter: none;
          animation: loaderPulse 1.4s ease-in-out infinite alternate;
        }
        .loader-bar-track {
          width: 180px;
          height: 3px;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.1);
          overflow: hidden;
        }
        .loader-bar-fill {
          height: 100%;
          width: 40%;
          border-radius: 99px;
          background: linear-gradient(135deg, #0af9cf 0%, #7ef716 100%);
          animation: loaderSlide 1s ease-in-out infinite alternate;
        }
        @keyframes loaderPulse {
          from { opacity: 0.5; }
          to { opacity: 1; }
        }
        @keyframes loaderSlide {
          from { transform: translateX(-20%); width: 30%; }
          to { transform: translateX(120%); width: 50%; }
        }
      `}</style>
    </div>
  );
}

export default PageLoader;
