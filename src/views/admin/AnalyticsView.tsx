"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type AnalyticsData = {
  gaMeasurementId: string;
  gscSiteUrl: string;
  ga4Connected: boolean;
  ga4: { sessions: number; pageviews: number; users: number; periodDays: number } | null;
  onSite: { publishedPosts: number; pendingComments: number; newsletterActive: number };
  groqConfigured: boolean;
};

export default function AnalyticsView() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [gaId, setGaId] = useState("");
  const [gscUrl, setGscUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/analytics/");
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message || "Failed to load");
      setData(json);
      setGaId(json.gaMeasurementId ?? "");
      setGscUrl(json.gscSiteUrl ?? "");
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

  const save = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/analytics/", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gaMeasurementId: gaId, gscSiteUrl: gscUrl }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message || "Save failed");
      setMessage("Settings saved.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-silver/50">Loading analytics…</p>;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/blog/"
          className="text-[.65rem] uppercase tracking-[.16em] text-silver/45 hover:text-gold"
        >
          ← Dashboard
        </Link>
        <h1 className="mt-2 font-serif text-3xl text-silver">Analytics</h1>
        <p className="mt-2 max-w-xl text-sm text-silver/55">
          GA4 measurement ID and Search Console property URL. Optional GA4 Data API metrics when{" "}
          <code className="text-gold/80">GA4_PROPERTY_ID</code> and{" "}
          <code className="text-gold/80">GA_SERVICE_ACCOUNT_JSON</code> are set on the server.
        </p>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Published posts" value={data?.onSite.publishedPosts ?? 0} />
        <StatCard label="Pending comments" value={data?.onSite.pendingComments ?? 0} />
        <StatCard label="Newsletter subscribers" value={data?.onSite.newsletterActive ?? 0} />
      </div>

      {data?.ga4 ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label={`Sessions (${data.ga4.periodDays}d)`} value={data.ga4.sessions} />
          <StatCard label="Pageviews" value={data.ga4.pageviews} />
          <StatCard label="Users" value={data.ga4.users} />
        </div>
      ) : (
        <p className="text-sm text-silver/50">
          GA4 Data API not connected — configure service account env vars for live traffic metrics.
        </p>
      )}

      <div className="border border-gold/10 bg-ink/40 p-6 space-y-4 max-w-xl">
        <h2 className="text-[.65rem] uppercase tracking-[.16em] text-gold">Measurement settings</h2>
        <label className="block text-xs text-silver/55">
          GA4 Measurement ID
          <input
            value={gaId}
            onChange={(e) => setGaId(e.target.value)}
            className="mt-1 w-full border border-gold/15 bg-obsidian px-3 py-2 text-sm text-silver"
          />
        </label>
        <label className="block text-xs text-silver/55">
          Search Console property URL
          <input
            value={gscUrl}
            onChange={(e) => setGscUrl(e.target.value)}
            placeholder="https://obsidianquantgroup.com/"
            className="mt-1 w-full border border-gold/15 bg-obsidian px-3 py-2 text-sm text-silver"
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="bg-gold px-4 py-2 text-[.65rem] uppercase tracking-[.14em] text-obsidian disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          {gscUrl && (
            <a
              href="https://search.google.com/search-console"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-gold/20 px-4 py-2 text-[.65rem] uppercase tracking-[.14em] text-silver/70"
            >
              Open GSC
            </a>
          )}
          <a
            href="https://analytics.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-gold/20 px-4 py-2 text-[.65rem] uppercase tracking-[.14em] text-silver/70"
          >
            Open GA4
          </a>
        </div>
        {message && <p className="text-sm text-emerald-400">{message}</p>}
        <p className="text-xs text-silver/40">
          AI assists: {data?.groqConfigured ? "Groq configured" : "GROQ_API_KEY not set"}
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-gold/10 bg-ink/40 p-4">
      <p className="text-[.65rem] uppercase tracking-[.14em] text-silver/45">{label}</p>
      <p className="mt-2 font-serif text-3xl text-gold">{value.toLocaleString()}</p>
    </div>
  );
}
