import type { Metadata } from "next";
import Dashboard from "@/views/investor/Dashboard";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Dashboard",
  path: "/investor/dashboard",
  noIndex: true,
});

export default function InvestorDashboardPage() {
  return <Dashboard />;
}
