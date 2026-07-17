import Contact from "@/views/Contact";
import { pageMetadata } from "@/lib/seo";
import { CONTACT } from "@/content/site";

export const metadata = pageMetadata({
  title: "Request Access",
  description: CONTACT.body,
  path: "/contact",
});

export default function ContactPage() {
  return <Contact />;
}
