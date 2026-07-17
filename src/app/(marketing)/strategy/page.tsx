import Strategy from "@/views/Strategy";
import { pageMetadata } from "@/lib/seo";
import { STRATEGY } from "@/content/site";

export const metadata = pageMetadata({
  title: "Strategy",
  description: STRATEGY.hero.body,
  path: "/strategy",
});

export default function StrategyPage() {
  return <Strategy />;
}
