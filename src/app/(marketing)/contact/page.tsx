import Contact from "@/views/Contact";
import { seoFor } from "@/lib/seo";

export const metadata = seoFor("contact");

export default function ContactPage() {
  return <Contact />;
}
