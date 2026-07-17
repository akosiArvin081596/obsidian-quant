"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AuroraRibbon from "../components/AuroraRibbon";
import { useSession } from "../views/investor/session-context";

/**
 * Chrome for the sign-in gateway — full-bleed obsidian field, no marketing nav.
 * Already signed in? Skip the form and drop straight into the member area.
 */
const GatewayLayout = ({ children }: { children: React.ReactNode }) => {
  const { signedIn, hydrated } = useSession();
  const router = useRouter();

  // hydrated gate: the session is read from sessionStorage post-mount; before
  // that, signedIn is always false and this effect must not (non-)fire early.
  useEffect(() => {
    if (hydrated && signedIn) router.replace("/investor/dashboard");
  }, [hydrated, signedIn, router]);

  if (signedIn) return null;

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden hex-bg gold-grid">
      <AuroraRibbon intensity={0.35} className="opacity-50" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-obsidian/40 to-obsidian" />

      <header className="relative z-10 flex items-center justify-end px-6 py-6 lg:px-16">
        <Link
          href="/"
          className="text-[0.66rem] uppercase tracking-[0.24em] text-silver/55 transition-colors hover:text-gold"
        >
          ← Return to site
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-10">
        {children}
      </main>
    </div>
  );
};

export default GatewayLayout;
