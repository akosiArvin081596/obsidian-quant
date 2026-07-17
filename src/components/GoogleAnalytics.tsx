import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ensureGoogleAnalytics, trackPageview } from "../lib/analytics";

/**
 * Loads GA4 (once) and records SPA navigations.
 * Mounted exactly once per router tree: RootLayout (public) and InvestorLayout.
 */
const GoogleAnalytics = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    ensureGoogleAnalytics();
  }, []);

  useEffect(() => {
    trackPageview(`${pathname}${search}`);
  }, [pathname, search]);

  return null;
};

export default GoogleAnalytics;
