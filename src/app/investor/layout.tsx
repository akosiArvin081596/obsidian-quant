"use client";

import { Suspense } from "react";
import ScrollToTop from "@/layouts/ScrollToTop";
import { SessionProvider } from "@/views/investor/session";
import GrainVignette from "@/components/GrainVignette";
import GoogleAnalytics from "@/components/GoogleAnalytics";

/** Investor mockup root — session + shared chrome hooks. */
export default function InvestorRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <GrainVignette />
      <ScrollToTop />
      <Suspense fallback={null}>
        <GoogleAnalytics />
      </Suspense>
      {children}
    </SessionProvider>
  );
}
