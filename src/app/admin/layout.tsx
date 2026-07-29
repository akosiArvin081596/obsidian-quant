import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Blog Admin",
  path: "/admin",
  noIndex: true,
});

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
