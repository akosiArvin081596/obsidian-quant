import Strategy from "@/views/Strategy";
import { seoFor } from "@/lib/seo";

export const metadata = seoFor("strategy");

export default function StrategyPage() {
  return <Strategy />;
}
