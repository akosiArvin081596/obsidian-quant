import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Header from "./Header";
import Footer from "./Footer";
import Preloader from "./Preloader";
import BackToTop from "./BackToTop";
import ScrollToTop from "./ScrollToTop";

gsap.registerPlugin(ScrollTrigger);

const RootLayout = () => {
  // Recompute ScrollTrigger start/end points once fonts load and the preloader
  // lifts, so late layout shifts don't throw off the scroll-linked reveals.
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(refresh);
    }
    const t = window.setTimeout(refresh, 1800);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <>
      <Preloader />
      <ScrollToTop />
      <Header />
      <main className="min-h-screen">
        <Outlet />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
};

export default RootLayout;
