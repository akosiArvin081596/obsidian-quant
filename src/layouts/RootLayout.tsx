import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import Preloader from "./Preloader";
import BackToTop from "./BackToTop";
import ScrollToTop from "./ScrollToTop";
import GrainVignette from "../components/GrainVignette";
import ScrollChoreography from "../components/ScrollChoreography";
import CursorGlow from "../components/CursorGlow";
import GoogleAnalytics from "../components/GoogleAnalytics";

const RootLayout = () => (
  <>
    <Preloader />
    <GrainVignette />
    <CursorGlow />
    <ScrollToTop />
    <GoogleAnalytics />
    <Header />
    <main className="relative isolate min-h-screen">
      <ScrollChoreography />
      <Outlet />
    </main>
    <Footer />
    <BackToTop />
  </>
);

export default RootLayout;
