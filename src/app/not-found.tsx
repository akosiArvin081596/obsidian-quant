import type { Metadata } from "next";
import MarketingLayout from "@/app/(marketing)/layout";
import NotFound from "@/views/NotFound";

// The root not-found renders outside the (marketing) route group, so it must
// pull the chrome in itself — otherwise the exported 404.html is a bare page
// with no nav/footer (and no GA pageview for 404 hits).
export const metadata: Metadata = {
  title: "Page Not Found | Obsidian Quant Group",
  robots: { index: false, follow: false },
};

export default function NotFoundPage() {
  return (
    <MarketingLayout>
      <NotFound />
    </MarketingLayout>
  );
}
