import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import Preloader from "./Preloader";
import BackToTop from "./BackToTop";
import ScrollToTop from "./ScrollToTop";
import GrainVignette from "../components/GrainVignette";

const RootLayout = () => (
  <>
    <Preloader />
    <GrainVignette />
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
