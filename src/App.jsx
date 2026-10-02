import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Layout from './components/Layout';
import MobileMenu from './components/MobileMenu';
import SoundToggle from './components/SoundToggle';
import PageLoader from './components/PageLoader';
import ErrorBoundary from './components/ErrorBoundary';

const HomePage = lazy(() => import('./pages/HomePage'));

const AboutPage = lazy(() => import('./pages/AboutPage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const ServiceSinglePage = lazy(() => import('./pages/ServiceSinglePage'));
const WorkSingle = lazy(() => import('./pages/WorkSingle'));
const WorksPage = lazy(() => import('./pages/WorksPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const BlogSingle = lazy(() => import('./pages/BlogSingle'));
const BlogPreview = lazy(() => import('./pages/BlogPreview'));
const ContactPage = lazy(() => import('./pages/ContactPage'));

const NotFound = lazy(() => import('./pages/NotFound'));
const AdminApp = lazy(() => import('./admin/AdminApp'));

const PAGE_ROUTES = [
  { path: 'web-design', element: <ServiceSinglePage /> },
  { path: 'branding', element: <ServiceSinglePage /> },
  { path: 'motion-design', element: <ServiceSinglePage /> },
  { path: 'website-development', element: <ServiceSinglePage /> },
];

function AppRoutes() {
  const isAdminRoute = useLocation().pathname.startsWith('/admin');

  return (
    <ErrorBoundary>
      <Routes>
            <Route element={<Layout />}>
              <Route index element={<Suspense fallback={<PageLoader />}><HomePage /></Suspense>} />
              <Route path="about" element={<Suspense fallback={<PageLoader />}><AboutPage /></Suspense>} />
              <Route path="services" element={<Suspense fallback={<PageLoader />}><ServicesPage /></Suspense>} />
              <Route path="services-single" element={<Suspense fallback={<PageLoader />}><ServiceSinglePage /></Suspense>} />
              {PAGE_ROUTES.map(r => (
                <Route key={r.path} path={r.path} element={<Suspense fallback={<PageLoader />}>{r.element}</Suspense>} />
              ))}
              <Route path="works" element={<Suspense fallback={<PageLoader />}><WorksPage /></Suspense>} />
              <Route path="blog" element={<Suspense fallback={<PageLoader />}><BlogPage /></Suspense>} />
              <Route path="blog/single/:slug" element={<Suspense fallback={<PageLoader />}><BlogSingle /></Suspense>} />
              <Route path="blog/preview/:token" element={<Suspense fallback={<PageLoader />}><BlogPreview /></Suspense>} />
              <Route path="contact" element={<Suspense fallback={<PageLoader />}><ContactPage /></Suspense>} />
              <Route path="project/:slug" element={<Suspense fallback={<PageLoader />}><WorkSingle /></Suspense>} />
              <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFound /></Suspense>} />
            </Route>
        <Route path="admin/*" element={<Suspense fallback={null}><AdminApp /></Suspense>} />
      </Routes>
      {!isAdminRoute && <><MobileMenu /><SoundToggle /></>}
    </ErrorBoundary>
  );
}

function App() {
  return <HelmetProvider><BrowserRouter><AppRoutes /></BrowserRouter></HelmetProvider>;
}

export default App;
