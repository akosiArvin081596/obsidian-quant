"use client";

import { FormEvent, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { safeAdminNext } from "@/lib/routes";

function subscribe() {
  return () => undefined;
}

/**
 * Password managers / form helpers often inject attributes like `fdprocessedid`
 * before hydration, which trips React's SSR mismatch check. Mount the real
 * controls only on the client so those extension attrs are not compared.
 */
export default function AdminLoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/auth/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || "Login failed");
      }
      router.replace(safeAdminNext(search.get("next")));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return (
      <div className="mx-auto w-full max-w-md space-y-5" aria-hidden>
        <div className="h-[4.75rem] border border-gold/10 bg-midnight/40" />
        <div className="h-[4.75rem] border border-gold/10 bg-midnight/40" />
        <div className="h-11 bg-gold/40" />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto w-full max-w-md space-y-5">
      <div>
        <label className="mb-2 block text-[.66rem] uppercase tracking-[.2em] text-gold" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gold/20 bg-midnight/60 px-4 py-3 text-sm text-silver outline-none focus:border-gold/50"
        />
      </div>
      <div>
        <label className="mb-2 block text-[.66rem] uppercase tracking-[.2em] text-gold" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gold/20 bg-midnight/60 px-4 py-3 text-sm text-silver outline-none focus:border-gold/50"
        />
      </div>
      {error ? <p className="text-sm text-loss">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="inline-flex min-h-11 w-full items-center justify-center bg-gold px-5 text-[.7rem] uppercase tracking-[.2em] text-obsidian disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
