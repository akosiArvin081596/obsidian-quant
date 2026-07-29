import { describe, expect, it } from "vitest";
import { LEGAL_PAGES, NAV } from "./site";
import { seoData } from "./seoData";
import { seoFor, SITE_URL } from "../lib/seo";

/**
 * seoData is the single source of SEO copy, but it is a hand-maintained object
 * sitting alongside the content it describes — nothing in the type system ties
 * a legal slug or a nav route to an entry here. A page whose key is missing
 * still exports fine; it just silently ships with no title, canonical, or
 * robots directive, which is exactly the failure SEO work is meant to prevent.
 * These tests are that missing link.
 */
describe("seoData coverage", () => {
  it("has an entry for every legal page slug", () => {
    for (const slug of Object.keys(LEGAL_PAGES)) {
      expect(seoData, `LEGAL_PAGES."${slug}" has no seoData entry`).toHaveProperty(slug);
    }
  });

  it("has an entry for every public nav destination", () => {
    const paths = new Set(Object.values(seoData).map((e) => e.path));
    for (const { to } of NAV) {
      expect(paths, `NAV route "${to}" has no seoData entry`).toContain(to);
    }
  });
});

describe("seoData entries", () => {
  const entries = Object.entries(seoData);

  it("gives every entry a non-empty title and description", () => {
    for (const [key, entry] of entries) {
      expect(entry.title.trim(), `${key}.title`).not.toBe("");
      expect(entry.description.trim(), `${key}.description`).not.toBe("");
    }
  });

  it("uses root-relative, non-trailing-slash paths", () => {
    for (const [key, entry] of entries) {
      expect(entry.path.startsWith("/"), `${key}.path must be root-relative`).toBe(true);
      if (entry.path !== "/") {
        expect(entry.path.endsWith("/"), `${key}.path must not end in "/"`).toBe(false);
      }
    }
  });

  it("builds a unique absolute trailing-slash canonical per page", () => {
    const seen = new Map<string, string>();
    for (const [key] of entries) {
      const canonical = seoFor(key as keyof typeof seoData).alternates?.canonical;
      expect(typeof canonical, `${key} canonical`).toBe("string");
      const url = String(canonical);
      expect(url.startsWith(`${SITE_URL}/`), `${key} canonical must be absolute`).toBe(true);
      expect(url.endsWith("/"), `${key} canonical must end in "/"`).toBe(true);
      expect(seen.has(url), `${key} duplicates the canonical of ${seen.get(url)}`).toBe(false);
      seen.set(url, key);
    }
  });

  it("indexes the public insights hub", () => {
    expect(seoData.insights.noIndex ?? false).toBe(false);
    expect(seoData.insights.path).toBe("/insights");
  });

  it("keeps the legacy /blog route noindex", () => {
    expect(seoData.blog.noIndex).toBe(true);
    expect(seoFor("blog").robots).toMatchObject({ index: false, follow: false });
  });

  it("leaves every other page indexable", () => {
    for (const [key, entry] of entries) {
      if (key === "blog") continue;
      expect(entry.noIndex ?? false, `${key} must stay indexable`).toBe(false);
    }
  });
});
