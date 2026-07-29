"use client";

import { useCallback, useState } from "react";
import Link from "next/link";

type Broken = {
  href: string;
  kind: string;
  detail: string;
  postId?: string;
  postTitle?: string;
};

type ByPost = {
  postId: string;
  title: string;
  broken: Broken[];
};

export default function LinkHealthView() {
  const [loading, setLoading] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanned, setScanned] = useState(0);
  const [brokenCount, setBrokenCount] = useState(0);
  const [byPost, setByPost] = useState<ByPost[]>([]);
  const [checkExternal, setCheckExternal] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/link-check/?external=${checkExternal ? "1" : "0"}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Scan failed");
      setScanned(data.scanned ?? 0);
      setBrokenCount(data.brokenCount ?? 0);
      setByPost(data.byPost ?? []);
      setHasScanned(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setLoading(false);
    }
  }, [checkExternal]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/admin/blog/"
            className="text-[.65rem] uppercase tracking-[.16em] text-silver/45 hover:text-gold"
          >
            ← Dashboard
          </Link>
          <h1 className="mt-2 font-serif text-3xl text-silver">Link health</h1>
          <p className="mt-2 max-w-xl text-sm text-silver/55">
            On-demand scan of post HTML for broken internal paths and unreachable external URLs.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-silver/60">
            <input
              type="checkbox"
              checked={checkExternal}
              onChange={(e) => setCheckExternal(e.target.checked)}
            />
            Check external links
          </label>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="min-h-10 bg-gold px-4 text-[.65rem] uppercase tracking-[.16em] text-obsidian disabled:opacity-50"
          >
            {loading ? "Scanning…" : hasScanned ? "Rescan" : "Scan posts"}
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-loss">{error}</p> : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="border border-gold/10 bg-midnight/40 px-4 py-3">
          <p className="text-[.6rem] uppercase tracking-[.18em] text-silver/45">Posts scanned</p>
          <p className="mt-1 font-serif text-2xl text-silver">{hasScanned ? scanned : "—"}</p>
        </div>
        <div className="border border-gold/10 bg-midnight/40 px-4 py-3">
          <p className="text-[.6rem] uppercase tracking-[.18em] text-silver/45">Broken links</p>
          <p className="mt-1 font-serif text-2xl text-silver">{hasScanned ? brokenCount : "—"}</p>
        </div>
        <div className="border border-gold/10 bg-midnight/40 px-4 py-3">
          <p className="text-[.6rem] uppercase tracking-[.18em] text-silver/45">Posts affected</p>
          <p className="mt-1 font-serif text-2xl text-silver">{hasScanned ? byPost.length : "—"}</p>
        </div>
      </div>

      {!hasScanned && !loading ? (
        <p className="border border-gold/10 bg-midnight/30 px-5 py-10 text-center text-silver/50">
          Click <span className="text-gold">Scan posts</span> to run a site-wide link check.
        </p>
      ) : null}

      {hasScanned && !loading && brokenCount === 0 ? (
        <p className="border border-gold/10 bg-midnight/30 px-5 py-10 text-center text-silver/50">
          No broken links found in scanned posts.
        </p>
      ) : null}

      <div className="space-y-4">
        {byPost.map((row) => (
          <article key={row.postId} className="border border-gold/10 bg-obsidian/40 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-serif text-xl text-ghost">{row.title}</h2>
              <Link
                href={`/admin/blog/${row.postId}/`}
                className="text-[.65rem] uppercase tracking-[.14em] text-gold hover:underline"
              >
                Edit post
              </Link>
            </div>
            <ul className="mt-4 space-y-2">
              {row.broken.map((issue) => (
                <li
                  key={`${issue.href}-${issue.detail}`}
                  className="border border-loss/20 bg-midnight/40 px-3 py-2 text-sm"
                >
                  <p className="break-all text-silver">{issue.href}</p>
                  <p className="mt-1 text-[.7rem] uppercase tracking-[.12em] text-loss/80">
                    {issue.kind} · {issue.detail}
                  </p>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
