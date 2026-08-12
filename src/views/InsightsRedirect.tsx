"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/** Public insights hub is paused — send visitors home. */
export default function InsightsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-obsidian px-6 text-center text-silver">
      <p className="text-sm font-light text-silver/65">Redirecting home…</p>
      <Link href="/" className="text-[0.7rem] uppercase tracking-[0.2em] text-gold">
        Continue to Obsidian Quant
      </Link>
    </main>
  );
}
