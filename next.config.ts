import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static HTML per route — nginx keeps serving dist/ unchanged.
  output: "export",
  images: { unoptimized: true },
  // Directory indexes (firm/index.html) so existing nginx
  // `try_files $uri $uri/ /index.html` keeps serving deep links.
  trailingSlash: true,
  // Keep page URLs with trailing slash via Link; don't 308-redirect /api/* fetches.
  skipTrailingSlashRedirect: true,
  // Dev-only proxies (mirror deploy/nginx-*.conf).
  // Ignored for static `next build` / `out/` — production uses nginx.
  async rewrites() {
    const rewrites = [
      {
        source: "/api/yahoo/v8/finance/chart/:path*",
        destination: "https://query1.finance.yahoo.com/v8/finance/chart/:path*",
      },
    ];

    // CRM lead intake. Opt-in per developer via LEAD_DEV_PROXY_TARGET, with NO
    // default destination on purpose: production's /api/lead is nginx injecting
    // the bearer secret (deploy/nginx-lead-proxy.conf), and a rewrite cannot add
    // headers — so a hardcoded upstream would only trade a dev 404 for a 401,
    // and aiming it at prod would write real leads from a dev machine.
    const leadProxyTarget = process.env.LEAD_DEV_PROXY_TARGET?.trim();
    if (leadProxyTarget) {
      rewrites.push({ source: "/api/lead", destination: leadProxyTarget });
    }

    return rewrites;
  },
};

export default nextConfig;
