"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ensureGoogleAnalytics, trackPageview } from "../lib/analytics";

/**
 * Loads GA4 (once) and records client navigations.
 * Mounted in the marketing layout and investor root layout.
 */
const GoogleAnalytics = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString();

  useEffect(() => {
    ensureGoogleAnalytics();
  }, []);

  useEffect(() => {
    trackPageview(search ? `${pathname}?${search}` : pathname);
  }, [pathname, search]);

  return null;
};

export default GoogleAnalytics;
