"use client";

import { useState } from "react";
import Link from "next/link";

export default function ImportExportView() {
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const exportBundle = () => {
    window.location.href = "/api/admin/export/";
  };

  const onFile = async (file: File) => {
    setImporting(true);
    setMessage(null);
    setError(null);
    try {
      const text = await file.text();
      const bundle = JSON.parse(text) as unknown;
      const res = await fetch("/api/admin/import/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bundle),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Import failed");
      setMessage(
        `Imported ${data.postsCreated} posts (${data.postsSkipped} skipped as duplicates).`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
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
        <h1 className="mt-2 font-serif text-3xl text-silver">Import / Export</h1>
        <p className="mt-2 max-w-xl text-sm text-silver/55">
          Download a JSON backup of posts, tags, categories, and redirects. Import creates new
          drafts and skips posts whose slug already exists.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="border border-gold/10 bg-ink/40 p-6">
          <h2 className="text-[.65rem] uppercase tracking-[.16em] text-gold">Export</h2>
          <p className="mt-3 text-sm text-silver/60">
            Media files are not included — only post content and taxonomy references.
          </p>
          <button
            type="button"
            onClick={exportBundle}
            className="mt-4 bg-gold px-4 py-2 text-[.65rem] uppercase tracking-[.14em] text-obsidian"
          >
            Download JSON
          </button>
        </div>

        <div className="border border-gold/10 bg-ink/40 p-6">
          <h2 className="text-[.65rem] uppercase tracking-[.16em] text-gold">Import</h2>
          <p className="mt-3 text-sm text-silver/60">
            Upload a bundle exported from this CMS. Existing slugs are left unchanged.
          </p>
          <label className="mt-4 inline-block cursor-pointer border border-gold/20 px-4 py-2 text-[.65rem] uppercase tracking-[.14em] text-silver/80">
            {importing ? "Importing…" : "Choose JSON file"}
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              disabled={importing}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onFile(file);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </div>

      {message && <p className="text-sm text-emerald-400">{message}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
