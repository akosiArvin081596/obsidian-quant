"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Subscriber = {
  id: string;
  email: string;
  status: string;
  source: string | null;
  createdAt: string;
};

export default function NewsletterView() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [summary, setSummary] = useState<{ active: number; unsubscribed: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/newsletter/");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Failed to load");
      setSubscribers(data.subscribers);
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(t);
  }, [load]);

  const exportCsv = () => {
    const rows = [["email", "status", "source", "createdAt"], ...subscribers.map((s) => [s.email, s.status, s.source ?? "", s.createdAt])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href="/admin/blog/"
            className="text-[.65rem] uppercase tracking-[.16em] text-silver/45 hover:text-gold"
          >
            ← Dashboard
          </Link>
          <h1 className="mt-2 font-serif text-3xl text-silver">Newsletter</h1>
          <p className="mt-2 text-sm text-silver/55">
            Subscribers from the site footer signup form.
            {summary && (
              <span className="ml-2 text-gold">
                {summary.active} active · {summary.unsubscribed} unsubscribed
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={!subscribers.length}
          className="border border-gold/20 px-4 py-2 text-[.65rem] uppercase tracking-[.14em] text-silver/70 disabled:opacity-50"
        >
          Export CSV
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {loading ? (
        <p className="text-sm text-silver/50">Loading…</p>
      ) : (
        <div className="overflow-x-auto border border-gold/10">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gold/10 text-[.65rem] uppercase tracking-[.14em] text-silver/45">
              <tr>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2">Subscribed</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s) => (
                <tr key={s.id} className="border-b border-gold/5 text-silver/80">
                  <td className="px-3 py-2">{s.email}</td>
                  <td className="px-3 py-2 capitalize">{s.status}</td>
                  <td className="px-3 py-2">{s.source ?? "—"}</td>
                  <td className="px-3 py-2">{new Date(s.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
