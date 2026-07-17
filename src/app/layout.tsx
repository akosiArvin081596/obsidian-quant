import type { Metadata } from "next";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import { BRAND } from "@/content/site";
import { SITE_URL } from "@/lib/seo";
import MotionProvider from "@/components/MotionProvider";
import "../index.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

const isDev = process.env.NODE_ENV === "development";

/** Prod stays tight; Next Fast Refresh needs `unsafe-eval` + HMR websockets in dev only.
 *  Fonts are self-hosted via `next/font` — no Google Fonts CDN required. */
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self' https://formsubmit.co",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com https://www.google-analytics.com`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com",
  "media-src 'self'",
  `connect-src 'self'${isDev ? " ws: wss:" : ""} https://formsubmit.co https://www.google-analytics.com https://analytics.google.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com`,
].join("; ");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${BRAND.name} | Profit from Market Dislocation`,
  description: BRAND.intro,
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
  },
  other: {
    "theme-color": "#0B0D12",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`scroll-smooth ${cormorant.variable} ${montserrat.variable}`}>
      <head>
        <meta httpEquiv="Content-Security-Policy" content={CSP} />
        <link rel="preload" as="image" href="/assets/obsidian-gem.webp" type="image/webp" />
      </head>
      <body>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
