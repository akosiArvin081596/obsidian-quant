import AdminShell from "@/layouts/AdminShell";

export const dynamic = "force-dynamic";

export default function AdminUsersLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
