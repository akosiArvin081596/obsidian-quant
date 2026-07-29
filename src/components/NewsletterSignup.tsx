"use client";

import { useState } from "react";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);
    try {
      const res = await fetch("/api/public/newsletter/subscribe/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "footer" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Subscription failed");
      setStatus("done");
      setMessage("Thank you — you're subscribed.");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Subscription failed");
    }
  };

  return (
    <form onSubmit={(e) => void submit(e)} className="mt-8 max-w-md">
      <h4 className="mb-3 text-[.66rem] uppercase tracking-[.2em] text-gold">Newsletter</h4>
      <p className="mb-3 text-xs text-silver/55">Market notes and firm updates — no spam.</p>
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          suppressHydrationWarning
          className="min-h-11 flex-1 border border-gold/15 bg-obsidian px-3 text-xs text-silver"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          suppressHydrationWarning
          className="min-h-11 bg-gold px-4 text-[.65rem] uppercase tracking-[.14em] text-obsidian disabled:opacity-50"
        >
          {status === "loading" ? "…" : "Subscribe"}
        </button>
      </div>
      {message && (
        <p className={`mt-2 text-xs ${status === "error" ? "text-red-400" : "text-emerald-400"}`}>
          {message}
        </p>
      )}
    </form>
  );
}
