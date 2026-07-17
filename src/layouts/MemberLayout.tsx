"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import Logo from "../components/Logo";
import { cn } from "../lib/cn";
import { EASE_LUX } from "../lib/motion";
import { useSession } from "../views/investor/session-context";

const MEMBER_NAV = [
  { to: "/investor/dashboard", label: "Dashboard" },
  { to: "/investor/portfolio", label: "Portfolio" },
  { to: "/investor/account", label: "Account" },
] as const;

/**
 * Authenticated shell for the investor member area (mockup). Guards its routes,
 * supplies the minimal member nav + sign-out, and frames each screen. Unsigned
 * visitors are bounced to the sign-in gateway.
 */
const MemberLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { signedIn, memberId, signOut } = useSession();

  useEffect(() => {
    if (!signedIn) router.replace("/investor/login");
  }, [signedIn, router]);

  if (!signedIn) return null;

  const onSignOut = () => {
    signOut();
    router.push("/investor/login");
  };

  return (
    <div className="relative flex min-h-screen flex-col hex-bg">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-40 header-fade" />

      <header className="relative z-10 border-b border-gold/10 bg-obsidian/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4 lg:px-10">
          <Link href="/investor/dashboard" aria-label="Investor area — dashboard">
            <Logo size={32} />
          </Link>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Member area">
            {MEMBER_NAV.map((item) => {
              const isActive = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  href={item.to}
                  className={cn(
                    "group relative text-[0.7rem] font-medium uppercase tracking-[0.2em] transition-colors duration-300",
                    isActive ? "text-ghost" : "text-silver/70 hover:text-ghost",
                  )}
                >
                  {item.label}
                  <span
                    className={cn(
                      "absolute -bottom-1.5 left-0 h-px bg-gold transition-all duration-300",
                      isActive ? "w-full" : "w-0 group-hover:w-full",
                    )}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-4">
            <span className="hidden items-center gap-2 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-silver/45 sm:flex">
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-graph" aria-hidden />
              {memberId || "Member"}
            </span>
            <button
              type="button"
              onClick={onSignOut}
              className="border border-silver/20 px-4 py-2 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-ghost transition-colors hover:border-gold hover:text-gold"
            >
              Sign Out
            </button>
          </div>
        </div>

        <nav
          className="flex items-center gap-6 border-t border-gold/10 px-6 py-3 md:hidden"
          aria-label="Member area"
        >
          {MEMBER_NAV.map((item) => {
            const isActive = pathname === item.to;
            return (
              <Link
                key={item.to}
                href={item.to}
                className={cn(
                  "text-[0.66rem] font-medium uppercase tracking-[0.18em] transition-colors",
                  isActive ? "text-gold" : "text-silver/60 hover:text-ghost",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <motion.main
        key={pathname}
        className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-6 py-12 lg:px-10 lg:py-16"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE_LUX }}
      >
        {children}
      </motion.main>

      <footer className="relative z-10 border-t border-gold/10 px-6 py-6 lg:px-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 text-[0.6rem] uppercase tracking-[0.18em] text-silver/35 sm:flex-row">
          <span>Obsidian Quant Group — Private Member Area</span>
          <span className="font-mono">Mockup · No live data</span>
        </div>
      </footer>
    </div>
  );
};

export default MemberLayout;
