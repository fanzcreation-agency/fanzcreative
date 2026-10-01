import { useNavigate } from 'react-router-dom';
import { playClose, playAboutLink } from '../hooks/useSound';

function MobileMenu() {
  const navigate = useNavigate();

  return (
    <div className="offcanvas-menu" id="offcanvas-menu">
      <div className="offcanvas-content">
        <div className="container h-100">
          <div className="offcanvas-content_wrapin">

            <div className="canvas_head">
              <a href="/" className="logo-site">
                <img src="/assets/images/logo/fanz-logo.webp" alt="FanzCreative" style={{ height: 36, width: 'auto' }} />
              </a>
              <button
                type="button"
                className="btn-mobile-menu close-mb-menu mobile-close-button text-caption"
                id="close-mb-menu"
                aria-label="Close navigation menu"
                onClick={playClose}
              >
                <i className="icon icon-close"></i>
                Close Menu
              </button>
            </div>

            <div className="canvas_center">
              <ul className="nav-ul-mb" id="mobile-menu">
                <li>
                  <div className="item">
                    <div className="has-sub-menu">
                      <a href="#dropdown-menu-index" className="mb-menu-link text-display-1 collapsed"
                        data-bs-toggle="collapse" aria-expanded="false" aria-controls="dropdown-menu-index">
                        <span className="text">Home</span>
                      </a>
                      <div id="dropdown-menu-index" className="collapse" data-bs-parent="#mobile-menu">
                        <ul className="sub-nav-menu">
                          <li><a href="#" className="sub-nav-link text-white">Home Gradient</a></li>
                          <li><a href="#" className="sub-nav-link text-white">Home Animated</a></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </li>

                <li>
                  <div className="item">
                    <a href="/about" className="mb-menu-link text-display-1" onClick={(e) => {
                      e.preventDefault();
                      playAboutLink();
                      navigate('/about');
                    }}>
                      <span className="text">About</span>
                    </a>
                  </div>
                </li>
                <li>
                  <div className="item">
                    <div className="has-sub-menu">
                      <a href="#dropdown-menu-1" className="mb-menu-link text-display-1 collapsed"
                        data-bs-toggle="collapse" aria-expanded="false" aria-controls="dropdown-menu-1">
                        <span className="text">Works</span>
                      </a>
                      <div id="dropdown-menu-1" className="collapse" data-bs-parent="#mobile-menu">
                        <ul className="sub-nav-menu">
                          <li><a href="/works" className="sub-nav-link text-white" onClick={(e) => {
                            e.preventDefault();
                            navigate('/works');
                          }}>Works</a></li>
                          <li><a href="/project/support-copilot" className="sub-nav-link text-white" onClick={(e) => {
                            e.preventDefault();
                            navigate('/project/support-copilot');
                          }}>Works Single</a></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="item">
                    <div className="has-sub-menu">
                      <a href="#dropdown-menu-2" className="mb-menu-link text-display-1 collapsed"
                        data-bs-toggle="collapse" aria-expanded="false" aria-controls="dropdown-menu-2">
                        <span className="text">Services</span>
                      </a>
                      <div id="dropdown-menu-2" className="collapse" data-bs-parent="#mobile-menu">
                        <ul className="sub-nav-menu">
                          <li><a href="/services" className="sub-nav-link text-white" onClick={(e) => {
                            e.preventDefault();
                            navigate('/services');
                          }}>Services</a></li>
                          <li><a href="/services-single" className="sub-nav-link text-white" onClick={(e) => {
                            e.preventDefault();
                            navigate('/services-single');
                          }}>Services Single</a></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="item">
                    <a href="/blog" className="mb-menu-link text-display-1" onClick={(e) => {
                      e.preventDefault();
                      navigate('/blog');
                    }}>
                      <span className="text">Blog</span>
                    </a>
                  </div>
                </li>
                <li>
                  <div className="item">
                    <a href="/contact" className="mb-menu-link text-display-1" onClick={(e) => {
                      e.preventDefault();
                      navigate('/contact');
                    }}>
                      <span className="text">Contact</span>
                    </a>
                  </div>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </div>
      <style>{`
        .offcanvas-menu .mobile-close-button {
          appearance: none;
          border: 1px solid rgba(255, 255, 255, 0.22);
          border-radius: 999px;
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          cursor: pointer;
          font-weight: 700;
          letter-spacing: 0;
          line-height: 1;
        }
        .offcanvas-menu .mobile-close-button .icon {
          font-size: 18px;
        }
        .offcanvas-menu .mobile-close-button:hover,
        .offcanvas-menu .mobile-close-button:focus-visible {
          background: #ffffff;
          color: #18181b;
          outline: none;
        }
      `}</style>
    </div>
  );
}

export default MobileMenu;
