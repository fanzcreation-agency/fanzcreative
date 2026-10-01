import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import Navbar from './Navbar';
import Footer from './Footer';
import PageLoader from './PageLoader';
import ScrollProgress from './ScrollProgress';
import CustomCursor from './CustomCursor';
import { playSpiral } from '../hooks/useSound';

const is404Page = (pathname) => {
  const validPrefixes = ['/about', '/services', '/services-single', '/web-design', '/branding', '/motion-design', '/website-development', '/project/'];
  if (pathname === '/') return false;
  return !validPrefixes.some(p => pathname.startsWith(p));
};

function Layout() {
  const location = useLocation();
  const lenisRef = useRef(null);
  const [navigating, setNavigating] = useState(false);
  const prevPath = useRef(location.pathname);

  useLayoutEffect(() => {
    if (prevPath.current !== location.pathname) {
      setNavigating(true);
      prevPath.current = location.pathname;
    }
  }, [location.pathname]);

  useEffect(() => {
    if (navigating) {
      const timer = setTimeout(() => setNavigating(false), 400);
      return () => clearTimeout(timer);
    }
  }, [navigating]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    playSpiral();
    const lenis = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      gestureDirection: 'vertical',
      smooth: true,
      wheelMultiplier: 1,
    });
    lenisRef.current = lenis;

    let rafId;
    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    const handleAnchorClick = (e) => {
      if (e.defaultPrevented) return;
      const target = e.target.closest('a');
      if (!target) return;
      const href = target.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        if (href === '#') {
          lenis.scrollTo(0);
        } else {
          const element = document.querySelector(href);
          if (element) {
            lenis.scrollTo(element);
          }
        }
      }
    };
    document.addEventListener('click', handleAnchorClick);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      document.removeEventListener('click', handleAnchorClick);
      lenis.destroy();
    };
  }, [location.pathname]);

  useEffect(() => {
    if (location.hash) {
      setTimeout(() => {
        const element = document.querySelector(location.hash);
        if (element && lenisRef.current) {
          lenisRef.current.scrollTo(element);
        }
      }, 150);
    }
  }, [location]);

  return (
    <>
      {navigating && <PageLoader />}
      <ScrollProgress />
      <CustomCursor />

      <canvas className="cursor-trail" id="trail" style={{ display: 'none' }} />

      <main id="wrapper">
        <Navbar is404={is404Page(location.pathname)} currentPage={location.pathname === '/' ? 'home' : location.pathname.slice(1)} />
        <Outlet />
        <Footer />
      </main>
    </>
  );
}

export default Layout;
