import Firm from "@/views/Firm";
import { pageMetadata } from "@/lib/seo";
import { FIRM } from "@/content/site";

export const metadata = pageMetadata({
  title: "The Firm",
  description: FIRM.hero.body,
  path: "/firm",
});

export default function FirmPage() {
  return <Firm />;
}
