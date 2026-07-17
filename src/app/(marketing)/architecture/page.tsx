import Architecture from "@/views/Architecture";
import { pageMetadata } from "@/lib/seo";
import { ARCHITECTURE } from "@/content/site";

export const metadata = pageMetadata({
  title: "Architecture",
  description: ARCHITECTURE.body,
  path: "/architecture",
});

export default function ArchitecturePage() {
  return <Architecture />;
}
