import type { Metadata } from "next";
import Login from "@/views/investor/Login";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Member Access",
  description: "Private member gateway for Obsidian Quant Group counterparties.",
  path: "/investor",
  noIndex: true,
});

export default function InvestorIndexPage() {
  return <Login />;
}
