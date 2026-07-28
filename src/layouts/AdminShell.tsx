import Link from "next/link";
import { redirect } from "next/navigation";
import Logo from "@/components/Logo";
import AdminLogoutButton from "@/components/admin/LogoutButton";
import { getCurrentUser } from "@/lib/auth/session";

export default async function AdminShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login/");

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
          <div className="flex items-center gap-4 text-xs text-silver/60">
            <Link href="/admin/blog/" className="hover:text-gold">
              Posts
            </Link>
            <Link href="/admin/blog/links/" className="hover:text-gold">
              Link health
            </Link>
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
