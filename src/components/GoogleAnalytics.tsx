"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ensureGoogleAnalytics, setGaMeasurementId, trackPageview } from "../lib/analytics";

/**
 * Loads GA4 (once) and records client navigations.
 * Mounted in the marketing layout and investor root layout.
 */
const GoogleAnalytics = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString();

  useEffect(() => {
    void fetch("/api/public/config/ga/")
      .then((r) => r.json())
      .then((data: { gaMeasurementId?: string }) => {
        if (data.gaMeasurementId) setGaMeasurementId(data.gaMeasurementId);
        ensureGoogleAnalytics();
      })
      .catch(() => ensureGoogleAnalytics());
  }, []);

  useEffect(() => {
    trackPageview(search ? `${pathname}?${search}` : pathname);
  }, [pathname, search]);

  return null;
};

export default GoogleAnalytics;
