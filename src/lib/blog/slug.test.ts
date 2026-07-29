import { describe, expect, it } from "vitest";
import { slugify, blogPostPath } from "./slug";
import { sanitizeContentHtml } from "./sanitize";
import { computeSeoCompleteness, validateForPublish, readingTimeMinutes } from "./seoScore";

describe("slugify", () => {
  it("normalizes titles into hyphenated slugs", () => {
    expect(slugify("  Hello, World!  ")).toBe("hello-world");
    expect(slugify("Alpha — Beta")).toBe("alpha-beta");
  });

  it("builds trailing-slash blog paths", () => {
    expect(blogPostPath("market-notes")).toBe("/insights/market-notes/");
  });
});

describe("sanitizeContentHtml", () => {
  it("strips script tags and event handlers", () => {
    const html = sanitizeContentHtml(
      `<p onclick="alert(1)">Safe</p><script>alert(1)</script><a href="javascript:alert(1)">x</a>`,
    );
    expect(html).not.toContain("script");
    expect(html).not.toContain("onclick");
    expect(html).not.toContain("javascript:");
    expect(html).toContain("Safe");
  });

  it("adds noopener on target blank links", () => {
    const html = sanitizeContentHtml(`<a href="https://example.com" target="_blank">Go</a>`);
    expect(html).toContain("noopener");
    expect(html).toContain("noreferrer");
  });
});

describe("seo helpers", () => {
  it("scores incomplete posts low", () => {
    const result = computeSeoCompleteness({
      title: "",
      slug: null,
      excerpt: null,
      contentHtml: "<p>Hi</p>",
      focusKeyword: null,
      featuredMedia: null,
      seo: null,
      canonicalUrl: null,
      robotsIndex: true,
      primaryCategoryId: null,
      tags: [],
      categories: [],
    });
    expect(result.score).toBeLessThan(40);
  });

  it("blocks publish without title or body", () => {
    const v = validateForPublish({
      title: "",
      slug: null,
      contentHtml: "",
      authorId: "u1",
      featuredMediaId: null,
      excerpt: null,
      canonicalUrl: null,
      robotsIndex: true,
    });
    expect(v.errors.length).toBeGreaterThan(0);
  });

  it("estimates reading time", () => {
    expect(readingTimeMinutes("<p>" + "word ".repeat(400) + "</p>")).toBe(2);
  });
});
