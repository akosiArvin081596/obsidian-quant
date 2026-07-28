import Link from "next/link";
import { redirect } from "next/navigation";
import Logo from "@/components/Logo";
import AdminLogoutButton from "@/components/admin/LogoutButton";
import { getCurrentUser } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";

export default async function AdminShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login/");

  const can = (perm: string) => user.permissions.includes(perm as (typeof user.permissions)[number]);

  const links = [
    { href: "/admin/blog/", label: "Posts", show: true },
    { href: "/admin/blog/links/", label: "Link health", show: true },
    { href: "/admin/blog/comments/", label: "Comments", show: can(PERMISSIONS.postsRead) },
    { href: "/admin/blog/newsletter/", label: "Newsletter", show: can(PERMISSIONS.settingsManage) },
    { href: "/admin/blog/import-export/", label: "Import/Export", show: can(PERMISSIONS.postsRead) },
    { href: "/admin/users/", label: "Users", show: can(PERMISSIONS.usersManage) },
    { href: "/admin/analytics/", label: "Analytics", show: can(PERMISSIONS.settingsManage) },
  ].filter((l) => l.show);

  return (
    <div className="min-h-screen bg-obsidian text-silver">
      <header className="border-b border-gold/10 bg-ink/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-10">
          <div className="flex items-center gap-4">
            <Link href="/admin/blog/">
              <Logo size={36} />
            </Link>
            <div>
              <p className="text-[.6rem] uppercase tracking-[.2em] text-gold">Back office</p>
              <p className="text-sm text-silver/80">Blog CMS</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-xs text-silver/60">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-gold">
                {link.label}
              </Link>
            ))}
            <span>{user.name}</span>
            <span className="hidden text-silver/35 sm:inline">{user.roles.join(", ")}</span>
            <AdminLogoutButton />
            <Link href="/blog/" className="text-gold hover:underline">
              View blog
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8 lg:px-10">{children}</main>
    </div>
  );
}
