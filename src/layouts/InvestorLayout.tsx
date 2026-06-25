import { Outlet } from "react-router-dom";
import ScrollToTop from "./ScrollToTop";
import { SessionProvider } from "../pages/investor/session";

/**
 * Root of the investor experience (mockup). Owns the mock session so both the
 * sign-in gateway and the member-area shell beneath it share one source of
 * truth. Renders no chrome of its own — each child layout supplies that.
 */
const InvestorLayout = () => (
  <SessionProvider>
    <ScrollToTop />
    <Outlet />
  </SessionProvider>
);

export default InvestorLayout;
