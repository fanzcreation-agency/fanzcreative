import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { playTick, playWhoosh, playPop, playHomeLink, playAboutLink, playHover, playClose } from '../hooks/useSound';

function Navbar({ is404 = false, currentPage = 'home' }) {
  const headerRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const [scrolledPastHero, setScrolledPastHero] = useState(!isHomePage);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const onScroll = () => {
      const heroThreshold = window.innerHeight * 0.85;

      if (isHomePage) {
        if (window.scrollY >= heroThreshold) {
          setScrolledPastHero(true);
        } else {
          setScrolledPastHero(false);
        }
      } else {
        setScrolledPastHero(true);
      }

      if (window.scrollY > 80) {
        header.classList.add('header-sticky');
      } else {
        header.classList.remove('header-sticky');
      }
    };

    onScroll();

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHomePage]);

  useEffect(() => {
    document.body.classList.toggle('overflow-hidden', menuOpen);
    return () => document.body.classList.remove('overflow-hidden');
  }, [menuOpen]);

  useEffect(() => {
    const offcanvas = document.getElementById('offcanvas-menu');
    if (!offcanvas) return;

    if (menuOpen) {
      offcanvas.classList.add('show');
    } else {
      offcanvas.classList.remove('show');
    }

    const closeBtn = document.getElementById('close-mb-menu');
    const handleClose = () => {
      setMenuOpen(false);
      playClose();
    };
    closeBtn?.addEventListener('click', handleClose);

    const links = offcanvas.querySelectorAll('a');
    const handleLinkClick = () => {
      setMenuOpen(false);
      playClose();
    };
    links.forEach((link) => link.addEventListener('click', handleLinkClick));

    return () => {
      closeBtn?.removeEventListener('click', handleClose);
      links.forEach((link) => link.removeEventListener('click', handleLinkClick));
    };
  }, [menuOpen]);

  return (
    <header
      className="tf-header header2"
      ref={headerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        paddingTop: 16,
        paddingBottom: 14,
        zIndex: 99999,
        background: 'transparent',
        backgroundColor: 'transparent',
        boxShadow: 'none',
        transform: isHomePage && !scrolledPastHero ? 'translateY(-100%)' : 'translateY(0)',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <style>{`
        header,
        header.header-sticky,
        .tf-header,
        .tf-header.header-sticky {
          background: transparent !important;
          background-color: transparent !important;
          box-shadow: none !important;
        }
        .tf-header .header-inner,
        .tf-header.header2 .header-inner,
        header.header-sticky .header-inner {
          background: #000000 !important;
          background-color: #000000 !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(10, 249, 207, 0.12) !important;
          backdrop-filter: blur(20px) !important;
          border-radius: 999px !important;
        }
        .tf-header .header-inner .item-link {
          color: rgba(255, 255, 255, 0.9) !important;
          transition: color 0.25s ease;
          font-weight: 600 !important;
        }
        .tf-header .header-inner .item-link::before,
        .tf-header .header-inner .item-link::after {
          background-color: #0af9cf !important;
          background: linear-gradient(90deg, #0af9cf 0%, #7ef716 100%) !important;
          height: 2px !important;
        }
        .tf-header .header-inner .item-link.active,
        .tf-header .header-inner .item-link:hover {
          color: #0af9cf !important;
        }
        .tf-header .header-inner .start-project-btn {
          background: #ffffff !important;
          color: #000000 !important;
          border: 1px solid #ffffff !important;
          border-radius: 999px !important;
          font-weight: 700 !important;
          transition: all 0.3s ease !important;
        }
        .tf-header .header-inner .start-project-btn:hover {
          background: linear-gradient(135deg, #0af9cf 0%, #7ef716 100%) !important;
          color: #000000 !important;
          border-color: #0af9cf !important;
          box-shadow: 0 4px 15px rgba(10, 249, 207, 0.4) !important;
          transform: translateY(-1px);
        }
      `}</style>
      <div className="header-inner">

        <Link to="/" className="logo-site" aria-label="FanzCreative home" onClick={playHomeLink} onMouseEnter={playHover}>
          <img
            src="/assets/images/logo/fanz-logo.webp"
            alt="FanzCreative"
            style={{
              height: 40,
              width: 'auto',
              objectFit: 'contain',
              filter: 'none',
              display: 'block',
            }}
          />
        </Link>

        <nav className="box-navigation">
          <ul className="nav-menu-main">
            <li className="menu-item">
              <Link to="/" className={`item-link link1 ${currentPage === 'home' ? 'active' : ''}`} aria-current={currentPage === 'home' ? 'page' : undefined} onClick={playHomeLink} onMouseEnter={playHover}>Home</Link>
            </li>
            <li className="menu-item">
              <Link to="/about" className={`item-link link1 ${currentPage === 'about' ? 'active' : ''}`} aria-current={currentPage === 'about' ? 'page' : undefined} onClick={playAboutLink} onMouseEnter={playHover}>About</Link>
            </li>
            <li className="menu-item">
              <Link to="/services" className={`item-link link1 ${currentPage === 'services' ? 'active' : ''}`} aria-current={currentPage === 'services' ? 'page' : undefined} onClick={playTick} onMouseEnter={playHover}>Services</Link>
            </li>
            <li className="menu-item">
              <Link to="/works" className={`item-link link1 ${currentPage === 'works' ? 'active' : ''}`} aria-current={currentPage === 'works' ? 'page' : undefined} onClick={playTick} onMouseEnter={playHover}>Works</Link>
            </li>
            <li className="menu-item">
              <Link to="/blog" className={`item-link link1 ${location.pathname.startsWith('/blog') ? 'active' : ''}`} aria-current={location.pathname.startsWith('/blog') ? 'page' : undefined} onClick={playTick} onMouseEnter={playHover}>Blog</Link>
            </li>
            <li className="menu-item">
              <Link to="/contact" className={`item-link link1 ${location.pathname === '/contact' ? 'active' : ''}`} onClick={playTick} onMouseEnter={playHover}>Contact</Link>
            </li>
          </ul>
        </nav>

        <Link
          to="/contact"
          className="tf-btn start-project-btn d-lg-flex d-none"
          aria-label="Start a Project"
          onClick={playPop}
          onMouseEnter={playHover}
        >
          Start a Project
        </Link>

        <button
          className="tf-btn open-mb-menu mobile-menu d-lg-none d-flex"
          onClick={() => { setMenuOpen(true); playWhoosh(); }}
          aria-label="Open menu"
          style={{
            color: '#ffffff',
            borderColor: 'rgba(255, 255, 255, 0.2)'
          }}
        >
          <i className="icon icon-grip-lines-solid"></i>
        </button>

      </div>
    </header>
  );
}

export default Navbar;
