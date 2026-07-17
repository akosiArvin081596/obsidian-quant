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
 * Idempotent — StrictMode double-effects and repeat calls are no-ops.
 */
export const ensureGoogleAnalytics = () => {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== "function") {
    // gtag.js only executes dataLayer entries that are `arguments` objects —
    // a rest-param array is silently ignored, so no hits would ever be sent.
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    // send_page_view off: trackPageview() below owns every page_view,
    // including the landing page — otherwise the first page is double-counted.
    window.gtag("config", GA_MEASUREMENT_ID, { send_page_view: false });
  }

  if (document.getElementById(SCRIPT_ID)) return;

  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);
};

/** SPA route change → GA4 page_view (guard absorbs StrictMode double-effects). */
export const trackPageview = (path: string) => {
  if (typeof window.gtag !== "function") return;
  if (lastTrackedPath === path) return;
  lastTrackedPath = path;
  window.gtag("config", GA_MEASUREMENT_ID, {
    page_path: path,
  });
};
