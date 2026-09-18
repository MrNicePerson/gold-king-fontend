// pages/HomePage.jsx
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// import Navbar from '../../components/HomePage/Navbar';
import HeroSection from '../../components/HomePage/HeroSection';
import CurrencyTicker from '../../components/HomePage/CurrencyTicker';
// import MarketRatesSection from '../../components/HomePage/MarketRatesSection';
import ShopsSection from '../../components/HomePage/ShopsSection';
import Footer from '../../components/HomePage/Footer';
import HomePageSkeleton from '../../components/HomePage/HomePageSkeleton';
import SmoothScrollProvider from '../../components/HomePage/fx/SmoothScrollProvider';
import HomeCursor from '../../components/HomePage/fx/HomeCursor';
import { publicAPI } from '../../services/publicApi';
import PublicPicture from '../../components/HomePage/PublicPicture';
// import LanguageSwitcher from '../../components/HomePage/LanguageSwitcher';
// import LanguageSwitcher from '../../components/LanguageSwitcher';

const REFRESH_INTERVAL = 60 * 1000; // refresh live prices every 60s

const HomePage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchData = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const res = await publicAPI.getHomePage();
      console.log("HOme Page data :", res);
      setData(res.data);
      setLastFetch(new Date());
      setError(null);
    } catch (err) {
      console.error('Failed to fetch home page data:', err);
      setError(err.response?.data?.message || 'Failed to load market data. Please try again.');
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => fetchData(false), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) return <HomePageSkeleton />;

  if (error && !data) {
    return (
      <div className="bg-[#030201] min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 relative overflow-hidden">
        {/* Ambient background glow for error state */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] sm:w-[500px] h-[280px] sm:h-[500px] bg-[#d4af37]/5 blur-[80px] sm:blur-[120px] rounded-full pointer-events-none" />

        {/* <Navbar /> */}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mt-24 z-10 w-full max-w-md p-6 sm:p-8 rounded-2xl border border-[#d4af37]/10 bg-[#0a0805]/90 backdrop-blur-md shadow-2xl"
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-5 flex items-center justify-center rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20 text-[#d4af37] text-xl sm:text-2xl">
            ⚠️
          </div>
          <h2
            className="text-xl sm:text-2xl font-semibold tracking-wide text-white mb-2"
            style={{ fontFamily: '"Playfair Display", serif' }}
          >
            Connection Error
          </h2>
          <p className="text-[#a19574] text-xs sm:text-sm leading-relaxed mb-6 sm:mb-8 px-2">{error}</p>
          <motion.button
            whileHover={{ scale: 1.01, boxShadow: '0 0 20px rgba(212, 175, 55, 0.25)' }}
            whileTap={{ scale: 0.99 }}
            onClick={() => fetchData(true)}
            className="w-full py-3 sm:py-3.5 rounded-xl font-medium tracking-wide text-[#030201] text-sm sm:text-base transition-all duration-300 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #e6c667, #b88e2f)' }}
          >
            Retry Connection
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <SmoothScrollProvider>
      <div className="bg-[#030201] min-h-screen text-[#f5f2eb] antialiased selection:bg-[#d4af37]/30 selection:text-white overflow-x-hidden relative">
        <HomeCursor />
        {/* Premium Typography Configuration */}
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
        html { font-family: 'Plus Jakarta Sans', sans-serif; scroll-behavior: smooth; }
      `}</style>

        {/* Responsive Visual Gradients & Mesh Glow Backdrops */}
        <div className="absolute top-0 left-0 w-full h-[100vh] bg-gradient-to-b from-[#141008]/80 via-[#030201] to-transparent opacity-70 pointer-events-none" />
        <div className="absolute top-[10vh] left-[-20vw] lg:left-[-10vw] w-[60vw] lg:w-[40vw] h-[60vw] lg:h-[40vw] bg-[#b88e2f]/5 blur-[100px] lg:blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute top-[50vh] right-[-20vw] lg:right-[-10vw] w-[55vw] lg:w-[35vw] h-[55vw] lg:h-[35vw] bg-[#d4af37]/4 blur-[90px] lg:blur-[130px] rounded-full pointer-events-none" />

        {/* <Navbar />   */}
        {/* <LanguageSwitcher /> */}

        {/* Hero Section Container */}
        <motion.div
          id="hero"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 w-full"
        >
          <HeroSection
            marketPrices={data?.marketPrices}
            shops={data?.shops || []}
          />
        </motion.div>

        {/* Ultra-Responsive Floating Currency Ticker Wrapper */}
        <div id="currencies" className="relative z-20 -mt-6 sm:-mt-10 md:-mt-12 px-4 sm:px-6 max-w-7xl mx-auto w-full overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-xl sm:rounded-2xl border border-[#d4af37]/15 bg-[#0a0805]/95 backdrop-blur-xl shadow-[0_15px_35px_rgba(0,0,0,0.6)] overflow-hidden"
          >
            <CurrencyTicker currencies={data?.marketPrices?.currencies} />
          </motion.div>
        </div>

        {/* Main Structural Layout Content */}
        <main className="relative z-10 w-full">

          {/* Market Rates Breakdown Section */}
          <motion.section
            id="rates"
            className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 max-w-7xl mx-auto w-full"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Header Layout: Stacks neatly on mobile, spreads on desktop */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-2 md:mb-4 gap-4 border-b border-[#d4af37]/10 pb-2 md:pb-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-2 md:mb-4 gap-4 border-b border-[#d4af37]/10 pb-2 md:pb-4">
                <div className="space-y-1 sm:space-y-2">
                  <span className="text-[#d4af37] text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] block">
                    Premium Jewelry Collection
                  </span>

                  <h2
                    className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-white tracking-tight"
                    style={{ fontFamily: '"Playfair Display", serif' }}
                  >
                    Featured <span className="italic font-normal text-[#c9a84c]">Products</span>
                  </h2>
                </div>
              </div>

              {lastFetch && (
                <div className="text-[10px] sm:text-xs text-[#a19574] font-mono bg-[#14110a] px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md border border-[#d4af37]/10 self-start md:self-auto shadow-inner">
                  Synced: {lastFetch.toLocaleTimeString()}
                </div>
              )}
            </div>

            {/* Outer container protecting underlying components on small viewports */}
            <div className="w-full overflow-hidden rounded-xl sm:rounded-2xl transition-all duration-500 hover:shadow-[0_0_40px_rgba(212,175,55,0.02)]">
              {/* <MarketRatesSection marketPrices={data?.marketPrices} /> */}
              <PublicPicture />

            </div>

          </motion.section>

          {/* Premium Shops & Partners Grid Section */}
          <motion.section
            id="shops"
            className="py-4 sm:py-6 md:py-8 bg-gradient-to-b from-transparent via-[#090704]/70 to-transparent w-full"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8 }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
              <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12">
                <span className="text-[#d4af37] text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] block mb-1 sm:mb-2">
                  Verified Access
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-white tracking-tight mb-3 sm:mb-4" style={{ fontFamily: '"Playfair Display", serif' }}>
                  Premium Partners & Shops
                </h2>
                <div className="w-10 sm:w-14 h-[1px] bg-[#d4af37]/30 mx-auto" />
              </div>

              <div className="w-full">
                <ShopsSection shops={data?.shops || []} currencies={data?.marketPrices?.currencies} />
              </div>
            </div>
          </motion.section>

        </main>

        {/* Elegant, Non-Intrusive Stale Data Notification (Mobile and Desktop Adaptive) */}
        <AnimatePresence>
          {error && data && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 px-4 py-3.5 rounded-xl border border-amber-500/20 text-amber-300 text-xs max-w-full sm:max-w-sm shadow-[0_20px_40px_rgba(0,0,0,0.6)] backdrop-blur-lg flex items-start gap-3"
              style={{ background: 'linear-gradient(135deg, rgba(18,14,8,0.96), rgba(8,6,3,0.98))' }}
            >
              <span className="text-sm sm:text-base mt-0.5 flex-shrink-0">⚠️</span>
              <div className="flex-1">
                <p className="font-semibold text-white mb-0.5">Network Sync Interrupted</p>
                <p className="text-[#a19574] leading-relaxed text-[11px] sm:text-xs">
                  Displaying cached valuations. Attempting automatic reconnection...
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Footer />
      </div>
    </SmoothScrollProvider>
  );
};

export default HomePage;