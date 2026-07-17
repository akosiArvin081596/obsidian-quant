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
  // Dev-only Yahoo proxy (mirrors deploy/nginx-yahoo-proxy.conf).
  // Ignored for static `next build` / `out/` — production uses nginx.
  async rewrites() {
    return [
      {
        source: "/api/yahoo/v8/finance/chart/:path*",
        destination: "https://query1.finance.yahoo.com/v8/finance/chart/:path*",
      },
    ];
  },
};

export default nextConfig;
