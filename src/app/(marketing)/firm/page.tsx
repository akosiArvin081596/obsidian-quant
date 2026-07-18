import Firm from "@/views/Firm";
import { seoFor } from "@/lib/seo";

export const metadata = seoFor("firm");

export default function FirmPage() {
  return <Firm />;
}
