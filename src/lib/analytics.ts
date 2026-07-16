/** Google Analytics 4 measurement ID (gtag.js). */
export const GA_MEASUREMENT_ID = "G-VSGHTHYWHD";

const SCRIPT_ID = "ga-gtag-js";
let lastTrackedPath: string | null = null;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

/**
 * Installs gtag.js once and configures the measurement ID.
 * Safe to call from both Header and Footer — subsequent calls are no-ops.
 */
export const ensureGoogleAnalytics = () => {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== "function") {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    };
    window.gtag("js", new Date());
    window.gtag("config", GA_MEASUREMENT_ID);
  }

  if (document.getElementById(SCRIPT_ID)) return;

  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);
};

/** SPA route change → GA4 page_view (deduped across Header + Footer mounts). */
export const trackPageview = (path: string) => {
  if (typeof window.gtag !== "function") return;
  if (lastTrackedPath === path) return;
  lastTrackedPath = path;
  window.gtag("config", GA_MEASUREMENT_ID, {
    page_path: path,
  });
};
