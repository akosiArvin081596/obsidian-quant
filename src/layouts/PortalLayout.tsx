import { Link, Outlet } from "react-router-dom";
import Logo from "../components/Logo";
import ScrollToTop from "./ScrollToTop";

/** Minimal chrome for the gated portal — no marketing nav. */
const PortalLayout = () => (
  <>
    <ScrollToTop />
    <div className="relative flex min-h-screen flex-col hex-bg">
      <div className="flex items-center justify-between px-6 py-6 lg:px-16">
        <Link to="/" aria-label="Obsidian Quant Group — home">
          <Logo size={34} />
        </Link>
        <Link
          to="/"
          className="text-[0.66rem] uppercase tracking-[0.24em] text-silver/55 transition-colors hover:text-gold"
        >
          ← Return to site
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <Outlet />
      </div>
    </div>
  </>
);

export default PortalLayout;
