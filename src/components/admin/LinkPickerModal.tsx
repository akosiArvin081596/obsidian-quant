"use client";

import { useEffect, useId, useRef, useState } from "react";

export type LinkTarget = {
  id: string;
  title: string;
  slug: string | null;
  status: string;
  excerpt: string | null;
  href: string;
};

function isDirectLinkQuery(q: string) {
  return /^https?:\/\//i.test(q) || q.startsWith("/") || q.startsWith("mailto:");
}

type ContentProps = {
  initialUrl: string;
  onClose: () => void;
  onApply: (href: string, openInNewTab: boolean) => void;
  onRemove?: () => void;
  canRemove?: boolean;
};

function LinkPickerModalContent({
  initialUrl,
  onClose,
  onApply,
  onRemove,
  canRemove = false,
}: ContentProps) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimerRef = useRef<number | null>(null);
  const [url, setUrl] = useState(initialUrl);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LinkTarget[]>([]);
  const [searching, setSearching] = useState(false);
  const [openInNewTab, setOpenInNewTab] = useState(initialUrl.startsWith("http"));
  const [error, setError] = useState<string | null>(null);

  const trimmedQuery = query.trim();
  const showSearchHint = trimmedQuery.length < 2;

  useEffect(() => {
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);
    };
  }, []);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);

    const q = value.trim();
    if (q.length < 2 || isDirectLinkQuery(q)) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchTimerRef.current = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/link-targets/?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error?.message || "Search failed");
        setResults(data.items ?? []);
        setError(null);
      } catch (err) {
        setResults([]);
        setError(err instanceof Error ? err.message : "Search failed");
      } finally {
        setSearching(false);
      }
    }, 250);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function applyHref(href: string) {
    const trimmed = href.trim();
    if (!trimmed) {
      setError("Enter a URL or pick an internal post.");
      return;
    }
    onApply(trimmed, openInNewTab);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/80 px-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-lg border border-gold/20 bg-ink shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
      >
        <div className="border-b border-gold/10 px-5 py-4">
          <p className="text-[.6rem] uppercase tracking-[.2em] text-gold">Editor</p>
          <h2 id={titleId} className="mt-1 font-serif text-2xl text-silver">
            Insert link
          </h2>
        </div>

        <div className="space-y-5 px-5 py-5">
          <label className="block space-y-2">
            <span className="text-[.66rem] uppercase tracking-[.18em] text-gold">URL</span>
            <input
              ref={inputRef}
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyHref(url);
                }
              }}
              placeholder="https://… or /blog/…"
              className="w-full border border-gold/20 bg-midnight/60 px-4 py-3 text-sm text-silver outline-none focus:border-gold/50"
            />
          </label>

          <label className="flex items-center gap-3 text-sm text-silver/70">
            <input
              type="checkbox"
              checked={openInNewTab}
              onChange={(e) => setOpenInNewTab(e.target.checked)}
            />
            Open in new tab
          </label>

          <div className="space-y-2">
            <label className="block space-y-2">
              <span className="text-[.66rem] uppercase tracking-[.18em] text-gold">
                Search internal posts
              </span>
              <input
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Type a title or slug…"
                className="w-full border border-gold/15 bg-midnight/50 px-4 py-2.5 text-sm text-silver outline-none focus:border-gold/40"
              />
            </label>

            <div className="max-h-52 overflow-y-auto border border-gold/10 bg-midnight/30">
              {showSearchHint ? (
                <p className="px-4 py-3 text-sm text-silver/40">
                  Type at least 2 characters to find published posts.
                </p>
              ) : searching ? (
                <p className="px-4 py-3 text-sm text-silver/45">Searching…</p>
              ) : results.length === 0 ? (
                <p className="px-4 py-3 text-sm text-silver/45">No matching posts.</p>
              ) : (
                <ul>
                  {results.map((item) => (
                    <li key={item.id} className="border-b border-gold/10 last:border-b-0">
                      <button
                        type="button"
                        className="flex w-full flex-col gap-1 px-4 py-3 text-left hover:bg-gold/5"
                        onClick={() => {
                          setUrl(item.href);
                          setOpenInNewTab(false);
                          setError(null);
                        }}
                      >
                        <span className="text-sm text-silver">{item.title}</span>
                        <span className="text-[.7rem] text-silver/40">{item.href}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {error ? <p className="text-sm text-loss">{error}</p> : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gold/10 px-5 py-4">
          <div>
            {canRemove && onRemove ? (
              <button
                type="button"
                onClick={onRemove}
                className="min-h-10 text-[.65rem] uppercase tracking-[.14em] text-silver/45 hover:text-loss"
              >
                Remove link
              </button>
            ) : null}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-10 border border-gold/20 px-4 text-[.65rem] uppercase tracking-[.14em] text-silver/70 hover:text-gold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => applyHref(url)}
              className="min-h-10 bg-gold px-4 text-[.65rem] uppercase tracking-[.14em] text-obsidian"
            >
              Apply link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type Props = {
  open: boolean;
  initialUrl?: string;
  onClose: () => void;
  onApply: (href: string, openInNewTab: boolean) => void;
  onRemove?: () => void;
  canRemove?: boolean;
};

export default function LinkPickerModal({
  open,
  initialUrl = "",
  onClose,
  onApply,
  onRemove,
  canRemove = false,
}: Props) {
  if (!open) return null;

  return (
    <LinkPickerModalContent
      key={initialUrl}
      initialUrl={initialUrl}
      onClose={onClose}
      onApply={onApply}
      onRemove={onRemove}
      canRemove={canRemove}
    />
  );
}
