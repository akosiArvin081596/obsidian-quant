import Architecture from "@/views/Architecture";
import { seoFor } from "@/lib/seo";

export const metadata = seoFor("architecture");

export default function ArchitecturePage() {
  return <Architecture />;
}
