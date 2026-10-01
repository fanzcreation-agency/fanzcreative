import { Helmet } from 'react-helmet-async';
import Hero from '../components/Hero';
import Partner from '../components/Partner';
import Services from '../components/Services';
import RecentWorks from '../components/RecentWorks';
import FeaturedWorks from '../components/FeaturedWorks';
import Process from '../components/Process';
import Benefits from '../components/Benefits';
import Features from '../components/Features';
import Statistic from '../components/Statistic';
import Awards from '../components/Awards';
import Testimonials from '../components/Testimonials';
import Pricing from '../components/Pricing';
import FAQs from '../components/FAQs';
import Contact from '../components/Contact';

function HomePage() {
  return (
    <>
      <Helmet>
        <title>FanzCreative - Creative & Design Agency</title>
        <meta name="description" content="FanzCreative is a premium creative design and development agency crafting pixel-perfect interfaces, brands, and digital experiences." />
      </Helmet>
      <Hero />
      <Partner />

      <div className="box-white">
        <Services />
        <RecentWorks />
        <FeaturedWorks />
        <Process />
        <Benefits />
        <Features />
      </div>

      <div className="box-black">
        <div className="light-box"></div>
        <img loading="lazy" className="light-top" src="/assets/images/item/light-top.webp" alt="" />
        <img loading="lazy" className="light-bot" src="/assets/images/item/light-bot.webp" alt="" style={{ display: 'block', marginBottom: '-4px' }} />
        <Statistic />
        <Awards />
        <Testimonials />
      </div>

      <Pricing />
      <FAQs />
      <Contact />
    </>
  );
}

export default HomePage;
