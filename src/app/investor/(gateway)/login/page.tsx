import type { Metadata } from "next";
import Login from "@/views/investor/Login";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Member Sign In",
  description: "Private member gateway for Obsidian Quant Group counterparties.",
  path: "/investor/login",
  noIndex: true,
});

export default function InvestorLoginPage() {
  return <Login />;
}
