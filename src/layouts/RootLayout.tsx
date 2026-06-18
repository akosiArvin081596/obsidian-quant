import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import Preloader from "./Preloader";
import BackToTop from "./BackToTop";
import ScrollToTop from "./ScrollToTop";

const RootLayout = () => (
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

export default RootLayout;
