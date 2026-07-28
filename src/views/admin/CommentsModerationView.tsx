"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type CommentRow = {
  id: string;
  authorName: string;
  authorEmail: string | null;
  body: string;
  status: string;
  createdAt: string;
  post: { id: string; title: string; slug: string | null };
};

const TABS = ["pending", "approved", "rejected", "spam", "all"] as const;

export default function CommentsModerationView() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("pending");
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [summary, setSummary] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/comments/?status=${tab}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Failed to load");
      setComments(data.comments);
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(t);
  }, [load]);

  const moderate = async (id: string, status: string) => {
    const res = await fetch(`/api/admin/comments/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) await load();
  };

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/blog/"
          className="text-[.65rem] uppercase tracking-[.16em] text-silver/45 hover:text-gold"
        >
          ← Dashboard
        </Link>
        <h1 className="mt-2 font-serif text-3xl text-silver">Comments</h1>
        <p className="mt-2 text-sm text-silver/55">Moderate public comments before they appear on articles.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-1 text-[.65rem] uppercase tracking-[.14em] ${
              tab === t ? "bg-gold text-obsidian" : "border border-gold/20 text-silver/60"
            }`}
          >
            {t}
            {summary && t !== "all" ? ` (${summary[t] ?? 0})` : ""}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {loading ? (
        <p className="text-sm text-silver/50">Loading…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-silver/50">No comments in this queue.</p>
      ) : (
        <div className="space-y-4">
          {comments.map((c) => (
            <article key={c.id} className="border border-gold/10 bg-ink/40 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-silver">{c.authorName}</p>
                  <p className="text-xs text-silver/45">
                    on{" "}
                    <Link href={`/admin/blog/${c.post.id}/`} className="text-gold hover:underline">
                      {c.post.title}
                    </Link>{" "}
                    · {new Date(c.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className="text-[.65rem] uppercase tracking-[.14em] text-silver/40">{c.status}</span>
              </div>
              <p className="mt-3 text-sm text-silver/75 whitespace-pre-wrap">{c.body}</p>
              {tab === "pending" && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void moderate(c.id, "approved")}
                    className="bg-gold px-3 py-1 text-[.65rem] uppercase tracking-[.14em] text-obsidian"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => void moderate(c.id, "rejected")}
                    className="border border-gold/20 px-3 py-1 text-[.65rem] uppercase tracking-[.14em] text-silver/70"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => void moderate(c.id, "spam")}
                    className="border border-red-500/30 px-3 py-1 text-[.65rem] uppercase tracking-[.14em] text-red-300/80"
                  >
                    Spam
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
