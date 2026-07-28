"use client";

import { useCallback, useEffect, useState } from "react";

type Comment = {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
};

export default function ArticleComments({ slug }: { slug: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/public/posts/${slug}/comments/`);
    const data = await res.json();
    if (res.ok) setComments(data.comments ?? []);
  }, [slug]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(t);
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`/api/public/posts/${slug}/comments/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorName, authorEmail, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Failed to submit");
      setMessage(data.message ?? "Comment submitted.");
      setBody("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-16 border-t border-gold/10 pt-10">
      <h2 className="font-serif text-2xl text-silver">Comments</h2>
      {comments.length > 0 && (
        <ul className="mt-6 space-y-4">
          {comments.map((c) => (
            <li key={c.id} className="border border-gold/10 bg-ink/30 p-4">
              <p className="text-sm font-medium text-gold">{c.authorName}</p>
              <p className="mt-1 text-xs text-silver/40">{new Date(c.createdAt).toLocaleDateString()}</p>
              <p className="mt-2 text-sm text-silver/75 whitespace-pre-wrap">{c.body}</p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={(e) => void submit(e)} className="mt-8 space-y-3 max-w-xl">
        <p className="text-sm text-silver/55">Comments are moderated before publication.</p>
        <input
          required
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder="Name"
          className="w-full border border-gold/15 bg-obsidian px-3 py-2 text-sm text-silver"
        />
        <input
          type="email"
          value={authorEmail}
          onChange={(e) => setAuthorEmail(e.target.value)}
          placeholder="Email (optional)"
          className="w-full border border-gold/15 bg-obsidian px-3 py-2 text-sm text-silver"
        />
        <textarea
          required
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Your comment"
          className="w-full border border-gold/15 bg-obsidian px-3 py-2 text-sm text-silver"
        />
        <button
          type="submit"
          disabled={submitting}
          className="bg-gold px-4 py-2 text-[.65rem] uppercase tracking-[.14em] text-obsidian disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit comment"}
        </button>
        {message && <p className="text-sm text-emerald-400">{message}</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
      </form>
    </section>
  );
}
