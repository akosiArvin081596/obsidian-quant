import { Suspense } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import AdminLoginForm from "@/views/admin/LoginForm";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Admin Login",
  path: "/admin/login",
  noIndex: true,
});

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-obsidian px-5 py-16">
      <Link href="/" className="mb-10">
        <Logo size={48} />
      </Link>
      <h1 className="mb-2 font-serif text-3xl text-silver">Blog Admin</h1>
      <p className="mb-10 text-sm text-silver/55">Sign in to manage publications.</p>
      <Suspense fallback={<p className="text-silver/50">Loading…</p>}>
        <AdminLoginForm />
      </Suspense>
    </div>
  );
}
