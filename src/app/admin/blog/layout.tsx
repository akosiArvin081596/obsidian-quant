import AdminShell from "@/layouts/AdminShell";

export const dynamic = "force-dynamic";

export default function AdminBlogLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
