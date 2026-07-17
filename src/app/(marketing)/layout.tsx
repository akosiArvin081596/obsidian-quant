"use client";

import { Suspense } from "react";
import Header from "@/layouts/Header";
import Footer from "@/layouts/Footer";
import Preloader from "@/layouts/Preloader";
import BackToTop from "@/layouts/BackToTop";
import ScrollToTop from "@/layouts/ScrollToTop";
import GrainVignette from "@/components/GrainVignette";
import ScrollChoreography from "@/components/ScrollChoreography";
import CursorGlow from "@/components/CursorGlow";
import GoogleAnalytics from "@/components/GoogleAnalytics";

/** Public marketing chrome — same shell as the former RootLayout. */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Preloader />
      <GrainVignette />
      <CursorGlow />
      <ScrollToTop />
      <Suspense fallback={null}>
        <GoogleAnalytics />
      </Suspense>
      <Header />
      <main className="relative isolate min-h-screen">
        <ScrollChoreography />
        {children}
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
