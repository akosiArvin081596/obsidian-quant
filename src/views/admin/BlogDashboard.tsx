"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PERMISSIONS } from "@/lib/auth/permissions";

type Summary = {
  published: number;
  draft: number;
  scheduled: number;
  pending_review: number;
  archived: number;
  unpublished: number;
  trash: number;
  total: number;
};

type PostRow = {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
  publishedAt: string | null;
  scheduledAt: string | null;
  slug: string | null;
  focusKeyword: string | null;
  seoScore: number;
  author: { name: string };
  primaryCategory: { name: string } | null;
};

const TABS = [
  { key: "", label: "All" },
  { key: "mine", label: "Mine" },
  { key: "draft", label: "Draft" },
  { key: "pending_review", label: "Pending" },
  { key: "scheduled", label: "Scheduled" },
  { key: "published", label: "Published" },
  { key: "unpublished", label: "Unpublished" },
  { key: "archived", label: "Archived" },
  { key: "trash", label: "Trash" },
] as const;

export default function BlogDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState("");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<PostRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [canDelete, setCanDelete] = useState(false);
  const [canRestore, setCanRestore] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (tab === "mine") params.set("mine", "1");
    else if (tab) params.set("status", tab);
    if (q.trim()) params.set("q", q.trim());
    return params.toString();
  }, [tab, q]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [postsRes, authRes] = await Promise.all([
        fetch(`/api/admin/posts/?${query}`),
        fetch("/api/admin/auth/"),
      ]);
      const data = await postsRes.json();
      if (!postsRes.ok) throw new Error(data?.error?.message || "Failed to load posts");
      setItems(data.items);
      setSummary(data.summary);
      if (authRes.ok) {
        const authData = await authRes.json();
        const perms: string[] = authData.user?.permissions ?? [];
        const roles: string[] = authData.user?.roles ?? [];
        setCanDelete(perms.includes(PERMISSIONS.postsDelete));
        setCanRestore(perms.includes(PERMISSIONS.postsRestore));
        setIsAdmin(roles.includes("Administrator"));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  async function writeBlog() {
    setCreating(true);
    try {
      const res = await fetch("/api/admin/posts/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Could not create draft");
      router.push(`/admin/blog/${data.post.id}/`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create draft");
      setCreating(false);
    }
  }

  async function trashPost(post: PostRow) {
    if (!canDelete) return;
    const label = post.title.trim() || "Untitled draft";
    if (!window.confirm(`Move “${label}” to Trash?`)) return;
    setBusyId(post.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/posts/${post.id}/`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Could not move to Trash");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not move to Trash");
    } finally {
      setBusyId(null);
    }
  }

  async function restorePost(post: PostRow) {
    if (!canRestore) return;
    setBusyId(post.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/posts/${post.id}/restore/`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Could not restore post");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not restore post");
    } finally {
      setBusyId(null);
    }
  }

  async function purgePost(post: PostRow) {
    if (!isAdmin || !canDelete) return;
    const label = post.title.trim() || "Untitled draft";
    if (
      !window.confirm(
        `Permanently delete “${label}”? This cannot be undone.`,
      )
    ) {
      return;
    }
    setBusyId(post.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/posts/${post.id}/purge/`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Could not permanently delete");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not permanently delete");
    } finally {
      setBusyId(null);
    }
  }

  const inTrash = tab === "trash";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[.66rem] uppercase tracking-[.2em] text-gold">Content</p>
          <h1 className="font-serif text-3xl text-silver">Blog Dashboard</h1>
        </div>
        <button
          type="button"
          onClick={writeBlog}
          disabled={creating}
          className="inline-flex min-h-11 items-center justify-center bg-gold px-5 text-[.7rem] uppercase tracking-[.2em] text-obsidian disabled:opacity-60"
        >
          {creating ? "Creating…" : "Write a Blog"}
        </button>
      </div>

      <div className="flex flex-wrap gap-3 text-[.65rem] uppercase tracking-[.16em]">
        <Link href="/admin/blog/links/" className="border border-gold/25 px-3 py-2 text-gold hover:bg-gold/5">
          Link health
        </Link>
      </div>

      {summary ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            ["Published", summary.published],
            ["Drafts", summary.draft],
            ["Scheduled", summary.scheduled],
            ["Pending", summary.pending_review],
            ["Archived", summary.archived],
            ["Total", summary.total],
          ].map(([label, value]) => (
            <div key={label} className="border border-gold/10 bg-midnight/40 px-4 py-3">
              <p className="text-[.6rem] uppercase tracking-[.18em] text-silver/45">{label}</p>
              <p className="mt-1 font-serif text-2xl text-silver">{value}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key || "all"}
              type="button"
              onClick={() => setTab(t.key)}
              className={`min-h-10 px-3 text-[.65rem] uppercase tracking-[.16em] ${
                tab === t.key ? "border border-gold/40 text-gold" : "text-silver/50 hover:text-gold"
              }`}
            >
              {t.label}
              {t.key === "trash" && summary?.trash ? ` (${summary.trash})` : ""}
            </button>
          ))}
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search title, slug, author…"
          className="w-full border border-gold/15 bg-midnight/50 px-4 py-2.5 text-sm text-silver outline-none focus:border-gold/40 lg:max-w-sm"
        />
      </div>

      {error ? <p className="text-sm text-loss">{error}</p> : null}

      <div className="overflow-x-auto border border-gold/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-ink text-[.6rem] uppercase tracking-[.16em] text-silver/45">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Author</th>
              <th className="px-4 py-3 font-medium">Updated</th>
              <th className="px-4 py-3 font-medium">SEO</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-silver/50">
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-silver/50">
                  {inTrash ? (
                    "Trash is empty."
                  ) : (
                    <>
                      No posts yet. Click <span className="text-gold">Write a Blog</span> to create the
                      first draft.
                    </>
                  )}
                </td>
              </tr>
            ) : (
              items.map((post) => {
                const busy = busyId === post.id;
                const isTrashed = post.status === "trash";
                return (
                  <tr key={post.id} className="border-t border-gold/10">
                    <td className="px-4 py-3">
                      {isTrashed ? (
                        <span className="text-silver/70">{post.title.trim() || "Untitled draft"}</span>
                      ) : (
                        <Link href={`/admin/blog/${post.id}/`} className="text-silver hover:text-gold">
                          {post.title.trim() || "Untitled draft"}
                        </Link>
                      )}
                      {post.primaryCategory ? (
                        <p className="mt-1 text-[.65rem] text-silver/40">{post.primaryCategory.name}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-silver/65">
                      <span className="capitalize">{post.status.replace("_", " ")}</span>
                      {post.status === "scheduled" && post.scheduledAt ? (
                        <p className="mt-1 text-[.65rem] text-gold/70">
                          {new Date(post.scheduledAt).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-silver/65">{post.author.name}</td>
                    <td className="px-4 py-3 text-silver/55">
                      {new Date(post.updatedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-silver/65">{post.seoScore}%</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex flex-nowrap items-center gap-x-2">
                        {!isTrashed ? (
                          <>
                            <Link
                              href={`/admin/blog/${post.id}/`}
                              className="text-gold hover:underline"
                            >
                              Edit
                            </Link>
                            <span className="text-silver/25">·</span>
                            <button
                              type="button"
                              disabled={busy}
                              className="text-silver/50 hover:text-gold disabled:opacity-50"
                              onClick={async () => {
                                setBusyId(post.id);
                                const res = await fetch(`/api/admin/posts/${post.id}/duplicate/`, {
                                  method: "POST",
                                });
                                const data = await res.json();
                                setBusyId(null);
                                if (!res.ok) {
                                  setError(data?.error?.message || "Duplicate failed");
                                  return;
                                }
                                router.push(`/admin/blog/${data.post.id}/`);
                              }}
                            >
                              Duplicate
                            </button>
                            {post.slug && post.status === "published" ? (
                              <>
                                <span className="text-silver/25">·</span>
                                <Link
                                  href={`/blog/${post.slug}/`}
                                  className="text-silver/50 hover:text-gold"
                                >
                                  View
                                </Link>
                              </>
                            ) : null}
                            {canDelete ? (
                              <>
                                <span className="text-silver/25">·</span>
                                <button
                                  type="button"
                                  disabled={busy}
                                  className="text-silver/50 hover:text-loss disabled:opacity-50"
                                  onClick={() => void trashPost(post)}
                                >
                                  {busy ? "…" : "Delete"}
                                </button>
                              </>
                            ) : null}
                          </>
                        ) : (
                          <>
                            {canRestore ? (
                              <button
                                type="button"
                                disabled={busy}
                                className="text-gold hover:underline disabled:opacity-50"
                                onClick={() => void restorePost(post)}
                              >
                                {busy ? "…" : "Restore"}
                              </button>
                            ) : null}
                            {isAdmin && canDelete ? (
                              <>
                                {canRestore ? <span className="text-silver/25">·</span> : null}
                                <button
                                  type="button"
                                  disabled={busy}
                                  className="text-silver/50 hover:text-loss disabled:opacity-50"
                                  onClick={() => void purgePost(post)}
                                >
                                  {busy ? "…" : "Delete forever"}
                                </button>
                              </>
                            ) : null}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
