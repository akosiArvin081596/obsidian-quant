import Home from "@/views/Home";
import { seoFor } from "@/lib/seo";

export const metadata = seoFor("home");

export default function HomePage() {
  return <Home />;
}
