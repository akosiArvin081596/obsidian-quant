import InsightsRedirect from "@/views/InsightsRedirect";
import { pageMetadata } from "@/lib/seo";

// noIndex: the paused hub exports a thin 200 redirect page — without noindex,
// crawlers would index it as a competing document for the homepage.
export const metadata = pageMetadata({
  title: "Insights",
  path: "/insights",
  noIndex: true,
});

export default function InsightsPage() {
  return <InsightsRedirect />;
}
