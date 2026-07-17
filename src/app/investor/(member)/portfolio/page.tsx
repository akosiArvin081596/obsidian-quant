import type { Metadata } from "next";
import Portfolio from "@/views/investor/Portfolio";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Portfolio",
  path: "/investor/portfolio",
  noIndex: true,
});

export default function InvestorPortfolioPage() {
  return <Portfolio />;
}
