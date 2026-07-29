"use client";

import { useCallback, useEffect, useMemo, useRef, useState, startTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TipTapEditor from "@/components/admin/TipTapEditor";
import PublishMenu from "@/components/admin/PublishMenu";
import { PERMISSIONS } from "@/lib/auth/permissions";

type Media = {
  id: string;
  storageKey: string;
  altText: string | null;
  originalName: string;
  mimeType?: string;
};

type Tag = { id: string; name: string; slug: string };
type Category = { id: string; name: string; slug: string };

type Post = {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string | null;
  excerpt: string | null;
  status: string;
  contentJson: unknown;
  contentHtml: string;
  featuredMediaId: string | null;
  primaryCategoryId: string | null;
  focusKeyword: string | null;
  scheduledAt: string | null;
  canonicalUrl: string | null;
  robotsIndex: boolean;
  robotsFollow: boolean;
  version: number;
  featuredMedia: Media | null;
  seo: {
    metaTitle: string | null;
    metaDescription: string | null;
    socialTitle: string | null;
    socialDescription: string | null;
    socialMediaId: string | null;
  } | null;
  tags: { tag: Tag }[];
  categories: { category: Category }[];
};

type SaveState = "idle" | "saving" | "saved" | "failed";

export default function PostEditor({ postId }: { postId: string }) {
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [screen, setScreen] = useState<"write" | "publish" | "preview">("write");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [words, setWords] = useState(0);
  const [seoScore, setSeoScore] = useState<number | null>(null);
  const [newTag, setNewTag] = useState("");
  const [previewWidth, setPreviewWidth] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [draftHtml, setDraftHtml] = useState("");
  const [draftJson, setDraftJson] = useState<unknown>(null);
  const [canPublish, setCanPublish] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [linkChecking, setLinkChecking] = useState(false);
  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const [linkBroken, setLinkBroken] = useState<
    { href: string; kind: string; detail: string }[] | null
  >(null);
  const dirty = useRef(false);
  const versionRef = useRef(1);

  const selectedTagIds = useMemo(() => new Set(post?.tags.map((t) => t.tag.id) ?? []), [post]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [postRes, tagsRes, catsRes, mediaRes, authRes] = await Promise.all([
          fetch(`/api/admin/posts/${postId}/`),
          fetch("/api/admin/tags/"),
          fetch("/api/admin/categories/"),
          fetch("/api/admin/media/"),
          fetch("/api/admin/auth/"),
        ]);
        const postData = await postRes.json();
        if (!postRes.ok) throw new Error(postData?.error?.message || "Failed to load post");
        if (cancelled) return;
        startTransition(() => {
          setPost(postData.post);
          versionRef.current = postData.post.version;
          setSeoScore(postData.seoScore?.score ?? null);
          setDraftHtml(postData.post.contentHtml || "");
          setDraftJson(postData.post.contentJson);
        });
        const tagsData = await tagsRes.json();
        const catsData = await catsRes.json();
        const mediaData = await mediaRes.json();
        const authData = await authRes.json();
        if (cancelled) return;
        startTransition(() => {
          if (tagsRes.ok) setTags(tagsData.tags);
          if (catsRes.ok) setCategories(catsData.categories);
          if (mediaRes.ok) setMedia(mediaData.media);
          if (authRes.ok) {
            const perms: string[] = authData.user?.permissions ?? [];
            setCanPublish(perms.includes(PERMISSIONS.postsPublish));
            setCanDelete(perms.includes(PERMISSIONS.postsDelete));
          }
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Load failed");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [postId]);

  const save = useCallback(
    async (opts?: { createRevision?: boolean; reason?: string; publishFields?: boolean }) => {
      if (!post) return null;
      setSaveState("saving");
      setError(null);
      try {
        const body: Record<string, unknown> = {
          title: post.title,
          subtitle: post.subtitle,
          excerpt: post.excerpt,
          version: versionRef.current,
          createRevision: opts?.createRevision ?? false,
          revisionReason: opts?.reason,
          contentJson: draftJson ?? post.contentJson,
          contentHtml: draftHtml || post.contentHtml,
        };
        if (opts?.publishFields) {
          body.slug = post.slug;
          body.featuredMediaId = post.featuredMediaId;
          body.primaryCategoryId = post.primaryCategoryId;
          body.focusKeyword = post.focusKeyword;
          body.canonicalUrl = post.canonicalUrl;
          body.robotsIndex = post.robotsIndex;
          body.robotsFollow = post.robotsFollow;
          body.tagIds = [...selectedTagIds];
          body.categoryIds = post.primaryCategoryId ? [post.primaryCategoryId] : [];
          body.seo = post.seo ?? {};
        }

        const res = await fetch(`/api/admin/posts/${postId}/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error?.message || "Save failed");
        setPost(data.post);
        versionRef.current = data.post.version;
        dirty.current = false;
        setSaveState("saved");
        return data.post as Post;
      } catch (err) {
        setSaveState("failed");
        setError(err instanceof Error ? err.message : "Save failed");
        return null;
      }
    },
    [post, postId, selectedTagIds, draftHtml, draftJson],
  );

  useEffect(() => {
    if (!post) return;
    const id = window.setInterval(() => {
      if (dirty.current) void save();
    }, 12000);
    return () => window.clearInterval(id);
  }, [post, save]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void save({ createRevision: true, reason: "manual_save" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

  async function publish() {
    setActionBusy(true);
    setError(null);
    try {
      const saved = await save({ createRevision: true, reason: "pre_publish", publishFields: true });
      if (!saved) return;
      const res = await fetch(`/api/admin/posts/${postId}/publish/`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message || "Publish failed");
        return;
      }
      setPost(data.post);
      versionRef.current = data.post.version;
      dirty.current = false;
      router.push("/admin/blog/");
    } finally {
      setActionBusy(false);
    }
  }

  async function schedule(iso: string) {
    setActionBusy(true);
    setError(null);
    try {
      const saved = await save({ createRevision: true, reason: "pre_schedule", publishFields: true });
      if (!saved) return;
      const res = await fetch(`/api/admin/posts/${postId}/schedule/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt: iso }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message || "Schedule failed");
        return;
      }
      setPost(data.post);
      versionRef.current = data.post.version;
      dirty.current = false;
      router.push("/admin/blog/");
    } finally {
      setActionBusy(false);
    }
  }

  async function submitReview() {
    setActionBusy(true);
    setError(null);
    try {
      const saved = await save({
        createRevision: true,
        reason: "pre_submit_review",
        publishFields: true,
      });
      if (!saved) return;
      const res = await fetch(`/api/admin/posts/${postId}/submit-review/`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message || "Submit for review failed");
        return;
      }
      setPost(data.post);
      versionRef.current = data.post.version;
      dirty.current = false;
      router.push("/admin/blog/");
    } finally {
      setActionBusy(false);
    }
  }

  async function unschedule() {
    setActionBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/posts/${postId}/unschedule/`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message || "Could not cancel schedule");
        return;
      }
      setPost(data.post);
      versionRef.current = data.post.version;
      setMessage("Schedule cancelled. Post returned to draft.");
    } finally {
      setActionBusy(false);
    }
  }

  async function unpublish() {
    setActionBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/posts/${postId}/unpublish/`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message || "Unpublish failed");
        return;
      }
      setPost(data.post);
      setMessage("Post unpublished.");
    } finally {
      setActionBusy(false);
    }
  }

  async function moveToTrash() {
    if (!post) return;
    const label = post.title.trim() || "Untitled draft";
    if (!window.confirm(`Move “${label}” to Trash?`)) return;
    setActionBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/posts/${postId}/`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message || "Could not move to Trash");
        return;
      }
      router.push("/admin/blog/");
    } finally {
      setActionBusy(false);
    }
  }

  async function checkLinks() {
    setLinkChecking(true);
    setError(null);
    try {
      // Persist latest HTML before scanning
      const saved = await save({ createRevision: false, publishFields: true });
      if (!saved && dirty.current) {
        // Still try scan against last saved content
      }
      const res = await fetch(`/api/admin/posts/${postId}/link-check/`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Link check failed");
      setLinkBroken(data.broken ?? []);
      if ((data.broken?.length ?? 0) === 0) {
        setMessage("No broken links found.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Link check failed");
    } finally {
      setLinkChecking(false);
    }
  }

  async function uploadMedia(file: File) {
    const form = new FormData();
    form.set("file", file);
    form.set("altText", file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
    const res = await fetch("/api/admin/media/", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || "Upload failed");
    setMedia((m) => [data.media, ...m]);
    return data.media as Media;
  }

  async function updateFeaturedAlt(altText: string) {
    if (!post?.featuredMediaId) return;
    const res = await fetch(`/api/admin/media/${post.featuredMediaId}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ altText: altText || null }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error?.message || "Could not update alt text");
      return;
    }
    const updated = data.media as Media;
    setMedia((list) => list.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)));
    setPost({
      ...post,
      featuredMedia: post.featuredMedia ? { ...post.featuredMedia, ...updated } : updated,
    });
  }

  async function runAiAssist(
    action: "meta_title" | "meta_description" | "excerpt" | "outline",
    apply: (text: string) => void,
  ) {
    if (!post) return;
    setAiBusy(action);
    setError(null);
    try {
      const res = await fetch("/api/admin/ai/assist/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          title: post.title,
          contentHtml: draftHtml || post.contentHtml,
          focusKeyword: post.focusKeyword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "AI assist failed");
      apply(data.result);
      dirty.current = true;
      setMessage("AI suggestion applied — review before saving.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI assist failed");
    } finally {
      setAiBusy(null);
    }
  }

  async function createTag() {
    if (!newTag.trim() || !post) return;
    const res = await fetch("/api/admin/tags/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTag.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error?.message || "Could not create tag");
      return;
    }
    setTags((t) => [...t, data.tag]);
    setPost({
      ...post,
      tags: [...post.tags, { tag: data.tag }],
    });
    dirty.current = true;
    setNewTag("");
  }

  if (!post) {
    return <p className="text-silver/50">{error || "Loading editor…"}</p>;
  }

  const previewClass =
    previewWidth === "mobile" ? "max-w-sm" : previewWidth === "tablet" ? "max-w-2xl" : "max-w-3xl";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link href="/admin/blog/" className="text-[.65rem] uppercase tracking-[.16em] text-silver/45 hover:text-gold">
            ← Dashboard
          </Link>
          <h1 className="mt-2 font-serif text-3xl text-silver">
            {post.title.trim() || "Untitled draft"}
          </h1>
          <p className="mt-1 text-xs text-silver/45">
            Status: <span className="capitalize text-silver/70">{post.status.replace("_", " ")}</span>
            {" · "}
            Save:{" "}
            <span className="text-silver/70">
              {saveState === "saving"
                ? "Saving…"
                : saveState === "saved"
                  ? "Saved"
                  : saveState === "failed"
                    ? "Save failed"
                    : "Idle"}
            </span>
            {" · "}
            {words} words · ~{Math.max(1, Math.round(words / 200))} min read
            {seoScore !== null ? ` · SEO ${seoScore}%` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setScreen("write")}
            className={`min-h-10 px-3 text-[.65rem] uppercase tracking-[.14em] ${screen === "write" ? "text-gold" : "text-silver/50"}`}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setScreen("publish")}
            className={`min-h-10 px-3 text-[.65rem] uppercase tracking-[.14em] ${screen === "publish" ? "text-gold" : "text-silver/50"}`}
          >
            Publish settings
          </button>
          <button
            type="button"
            onClick={() => setScreen("preview")}
            className={`min-h-10 px-3 text-[.65rem] uppercase tracking-[.14em] ${screen === "preview" ? "text-gold" : "text-silver/50"}`}
          >
            Preview
          </button>
          <button
            type="button"
            onClick={() => void save({ createRevision: true, reason: "manual_save", publishFields: true })}
            className="min-h-10 border border-gold/30 px-4 text-[.65rem] uppercase tracking-[.14em] text-gold"
          >
            Save Draft
          </button>
          <PublishMenu
            status={post.status}
            scheduledAt={post.scheduledAt}
            canPublish={canPublish}
            busy={actionBusy || saveState === "saving"}
            onPublishNow={() => void publish()}
            onSchedule={(iso) => void schedule(iso)}
            onSubmitReview={() => void submitReview()}
            onUnschedule={() => void unschedule()}
            onUnpublish={() => void unpublish()}
          />
          {canDelete && post.status !== "trash" ? (
            <button
              type="button"
              disabled={actionBusy || saveState === "saving"}
              onClick={() => void moveToTrash()}
              className="min-h-10 border border-loss/30 px-4 text-[.65rem] uppercase tracking-[.14em] text-loss/80 hover:border-loss hover:text-loss disabled:opacity-50"
            >
              Delete
            </button>
          ) : null}
        </div>
      </div>

      {error ? <p className="text-sm text-loss">{error}</p> : null}
      {message ? <p className="text-sm text-graph">{message}</p> : null}

      {screen === "write" ? (
        <div className="space-y-4">
          <input
            value={post.title}
            onChange={(e) => {
              dirty.current = true;
              setPost({ ...post, title: e.target.value });
            }}
            placeholder="Title"
            className="w-full border-b border-gold/20 bg-transparent py-3 font-serif text-4xl text-silver outline-none placeholder:text-silver/25"
          />
          <input
            value={post.subtitle ?? ""}
            onChange={(e) => {
              dirty.current = true;
              setPost({ ...post, subtitle: e.target.value || null });
            }}
            placeholder="Subtitle (optional)"
            className="w-full border-b border-gold/10 bg-transparent py-2 text-lg italic text-silver/70 outline-none placeholder:text-silver/25"
          />
          <TipTapEditor
            initialJson={post.contentJson}
            onChange={({ json, html, words: w }) => {
              dirty.current = true;
              setDraftJson(json);
              setDraftHtml(html);
              setWords(w);
            }}
          />
        </div>
      ) : null}

      {screen === "publish" ? (
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <Field label="URL slug">
              <input
                value={post.slug ?? ""}
                onChange={(e) => {
                  dirty.current = true;
                  setPost({ ...post, slug: e.target.value || null });
                }}
                className="field"
              />
            </Field>
            <Field label="Excerpt">
              <div className="space-y-2">
                <textarea
                  value={post.excerpt ?? ""}
                  onChange={(e) => {
                    dirty.current = true;
                    setPost({ ...post, excerpt: e.target.value || null });
                  }}
                  rows={3}
                  className="field"
                />
                <AiAssistButton
                  label="Suggest excerpt"
                  busy={aiBusy === "excerpt"}
                  onClick={() =>
                    void runAiAssist("excerpt", (text) =>
                      setPost({ ...post, excerpt: text }),
                    )
                  }
                />
              </div>
            </Field>
            <Field label="Focus keyword (internal)">
              <input
                value={post.focusKeyword ?? ""}
                onChange={(e) => {
                  dirty.current = true;
                  setPost({ ...post, focusKeyword: e.target.value || null });
                }}
                className="field"
              />
            </Field>
            <Field label="Primary category">
              <select
                value={post.primaryCategoryId ?? ""}
                onChange={(e) => {
                  dirty.current = true;
                  setPost({ ...post, primaryCategoryId: e.target.value || null });
                }}
                className="field"
              >
                <option value="">Select…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tags">
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => {
                  const on = selectedTagIds.has(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        dirty.current = true;
                        setPost({
                          ...post,
                          tags: on
                            ? post.tags.filter((x) => x.tag.id !== t.id)
                            : [...post.tags, { tag: t }],
                        });
                      }}
                      className={`min-h-9 px-3 text-[.65rem] uppercase tracking-[.12em] ${
                        on ? "border border-gold/40 text-gold" : "border border-gold/10 text-silver/50"
                      }`}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="New tag"
                  className="field"
                />
                <button
                  type="button"
                  onClick={() => void createTag()}
                  className="min-h-10 border border-gold/30 px-3 text-[.65rem] uppercase tracking-[.12em] text-gold"
                >
                  Add
                </button>
              </div>
            </Field>
            <Field label="Featured image">
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const uploaded = await uploadMedia(file);
                      dirty.current = true;
                      setPost({ ...post, featuredMediaId: uploaded.id, featuredMedia: uploaded });
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Upload failed");
                    }
                  }}
                />
                {post.featuredMediaId ? (
                  <div className="group relative w-fit max-w-xs border border-gold/25 p-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/uploads/${
                        post.featuredMedia?.storageKey ??
                        media.find((m) => m.id === post.featuredMediaId)?.storageKey ??
                        ""
                      }`}
                      alt={
                        post.featuredMedia?.altText ??
                        media.find((m) => m.id === post.featuredMediaId)?.altText ??
                        "Featured image"
                      }
                      className="block max-h-40 max-w-xs object-cover"
                    />
                    <button
                      type="button"
                      aria-label="Remove featured image"
                      title="Remove featured image"
                      className="absolute top-1.5 right-1.5 z-10 flex h-6 w-6 items-center justify-center border border-gold/30 bg-obsidian/90 text-sm leading-none text-silver opacity-0 transition-opacity hover:border-loss/50 hover:text-loss group-hover:opacity-100 focus-visible:opacity-100"
                      onClick={() => {
                        dirty.current = true;
                        setPost({ ...post, featuredMediaId: null, featuredMedia: null });
                      }}
                    >
                      ×
                    </button>
                  </div>
                ) : null}
                <div className="grid max-h-48 grid-cols-3 gap-2 overflow-y-auto">
                  {media
                    .filter((m) => !m.mimeType || m.mimeType.startsWith("image/"))
                    .map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        dirty.current = true;
                        setPost({ ...post, featuredMediaId: m.id, featuredMedia: m });
                      }}
                      className={`border p-1 ${
                        post.featuredMediaId === m.id ? "border-gold" : "border-gold/10"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/uploads/${m.storageKey}`}
                        alt={m.altText || m.originalName}
                        className="h-20 w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
                {post.featuredMediaId ? (
                  <label className="block space-y-1">
                    <span className="text-[.65rem] uppercase tracking-[.12em] text-silver/45">
                      Featured image alt text
                    </span>
                    <input
                      key={post.featuredMediaId}
                      defaultValue={
                        post.featuredMedia?.altText ??
                        media.find((m) => m.id === post.featuredMediaId)?.altText ??
                        ""
                      }
                      onBlur={(e) => void updateFeaturedAlt(e.target.value.trim())}
                      placeholder="Describe the featured image"
                      className="field"
                    />
                  </label>
                ) : null}
              </div>
            </Field>
          </div>
          <div className="space-y-4">
            <Field label="Meta title">
              <div className="space-y-2">
                <input
                  value={post.seo?.metaTitle ?? ""}
                  onChange={(e) => {
                    dirty.current = true;
                    setPost({
                      ...post,
                      seo: { ...(post.seo ?? blankSeo()), metaTitle: e.target.value || null },
                    });
                  }}
                  className="field"
                />
                <AiAssistButton
                  label="Suggest title"
                  busy={aiBusy === "meta_title"}
                  onClick={() =>
                    void runAiAssist("meta_title", (text) =>
                      setPost({
                        ...post,
                        seo: { ...(post.seo ?? blankSeo()), metaTitle: text },
                      }),
                    )
                  }
                />
              </div>
            </Field>
            <Field label="Meta description">
              <div className="space-y-2">
                <textarea
                  value={post.seo?.metaDescription ?? ""}
                  onChange={(e) => {
                    dirty.current = true;
                    setPost({
                      ...post,
                      seo: { ...(post.seo ?? blankSeo()), metaDescription: e.target.value || null },
                    });
                  }}
                  rows={3}
                  className="field"
                />
                <AiAssistButton
                  label="Suggest description"
                  busy={aiBusy === "meta_description"}
                  onClick={() =>
                    void runAiAssist("meta_description", (text) =>
                      setPost({
                        ...post,
                        seo: { ...(post.seo ?? blankSeo()), metaDescription: text },
                      }),
                    )
                  }
                />
              </div>
            </Field>
            <Field label="Social title">
              <input
                value={post.seo?.socialTitle ?? ""}
                onChange={(e) => {
                  dirty.current = true;
                  setPost({
                    ...post,
                    seo: { ...(post.seo ?? blankSeo()), socialTitle: e.target.value || null },
                  });
                }}
                className="field"
              />
            </Field>
            <Field label="Social description">
              <textarea
                value={post.seo?.socialDescription ?? ""}
                onChange={(e) => {
                  dirty.current = true;
                  setPost({
                    ...post,
                    seo: {
                      ...(post.seo ?? blankSeo()),
                      socialDescription: e.target.value || null,
                    },
                  });
                }}
                rows={3}
                className="field"
              />
            </Field>
            <Field label="Canonical URL">
              <input
                value={post.canonicalUrl ?? ""}
                onChange={(e) => {
                  dirty.current = true;
                  setPost({ ...post, canonicalUrl: e.target.value || null });
                }}
                className="field"
              />
            </Field>
            <label className="flex items-center gap-3 text-sm text-silver/70">
              <input
                type="checkbox"
                checked={post.robotsIndex}
                onChange={(e) => {
                  dirty.current = true;
                  setPost({ ...post, robotsIndex: e.target.checked });
                }}
              />
              Allow indexing (robots index)
            </label>
            <label className="flex items-center gap-3 text-sm text-silver/70">
              <input
                type="checkbox"
                checked={post.robotsFollow}
                onChange={(e) => {
                  dirty.current = true;
                  setPost({ ...post, robotsFollow: e.target.checked });
                }}
              />
              Allow following links (robots follow)
            </label>
            <div className="border-t border-gold/10 pt-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[.66rem] uppercase tracking-[.18em] text-gold">Link health</p>
                  <p className="mt-1 text-xs text-silver/50">
                    Scan this post for broken internal and external links.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void checkLinks()}
                  disabled={linkChecking}
                  className="min-h-10 border border-gold/30 px-4 text-[.65rem] uppercase tracking-[.14em] text-gold disabled:opacity-50"
                >
                  {linkChecking ? "Checking…" : "Check links"}
                </button>
              </div>
              {linkBroken !== null ? (
                linkBroken.length === 0 ? (
                  <p className="mt-3 text-sm text-graph">No broken links found.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {linkBroken.map((issue) => (
                      <li
                        key={`${issue.href}-${issue.detail}`}
                        className="border border-loss/20 bg-midnight/50 px-3 py-2 text-sm"
                      >
                        <p className="break-all text-silver">{issue.href}</p>
                        <p className="mt-1 text-[.7rem] uppercase tracking-[.12em] text-loss/80">
                          {issue.kind} · {issue.detail}
                        </p>
                      </li>
                    ))}
                  </ul>
                )
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {screen === "preview" ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            {(["desktop", "tablet", "mobile"] as const).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setPreviewWidth(w)}
                className={`min-h-9 px-3 text-[.65rem] uppercase tracking-[.14em] ${
                  previewWidth === w ? "text-gold" : "text-silver/45"
                }`}
              >
                {w}
              </button>
            ))}
          </div>
          <article className={`mx-auto border border-gold/10 bg-midnight/40 p-8 ${previewClass}`}>
            <p className="text-[.65rem] uppercase tracking-[.2em] text-gold">Preview</p>
            <h1 className="mt-3 font-serif text-4xl text-silver">{post.title || "Untitled"}</h1>
            {post.subtitle ? <p className="mt-3 text-lg italic text-silver/65">{post.subtitle}</p> : null}
            <div
              className="prose-blog mt-8"
              dangerouslySetInnerHTML={{ __html: draftHtml || post.contentHtml }}
            />
          </article>
        </div>
      ) : null}
    </div>
  );
}

function blankSeo() {
  return {
    metaTitle: null,
    metaDescription: null,
    socialTitle: null,
    socialDescription: null,
    socialMediaId: null,
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-[.66rem] uppercase tracking-[.18em] text-gold">{label}</span>
      {children}
    </label>
  );
}

function AiAssistButton({
  label,
  busy,
  onClick,
}: {
  label: string;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="text-[.62rem] uppercase tracking-[.14em] text-gold/80 hover:text-gold disabled:opacity-50"
    >
      {busy ? "Generating…" : `✦ ${label}`}
    </button>
  );
}
