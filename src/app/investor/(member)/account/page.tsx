import type { Metadata } from "next";
import Account from "@/views/investor/Account";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Account",
  path: "/investor/account",
  noIndex: true,
});

export default function InvestorAccountPage() {
  return <Account />;
}
