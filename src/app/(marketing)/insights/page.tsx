import InsightsRedirect from "@/views/InsightsRedirect";
import { seoFor } from "@/lib/seo";

// noIndex: the paused hub exports a thin 200 redirect page — without noindex,
// crawlers would index it as a competing document for the homepage.
export const metadata = seoFor("insights");

export default function InsightsPage() {
  return <InsightsRedirect />;
}
