import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ensureGoogleAnalytics, trackPageview } from "../lib/analytics";

/**
 * Loads GA4 (once) and records SPA navigations.
 * Mounted from Header and Footer per integration request.
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
