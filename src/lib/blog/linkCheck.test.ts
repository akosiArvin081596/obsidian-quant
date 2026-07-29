import { describe, expect, it } from "vitest";
import {
  classifyHref,
  extractHrefs,
  knownStaticPaths,
  resolveInternalPath,
  brokenOnly,
  type LinkIssue,
} from "./linkCheck";

describe("extractHrefs", () => {
  it("collects unique hrefs from html", () => {
    const html = `<p><a href="/blog/a/">A</a><a href='https://x.com'>X</a><a href="/blog/a/">dup</a></p>`;
    expect(extractHrefs(html).sort()).toEqual(["/blog/a/", "https://x.com"].sort());
  });
});

describe("classifyHref", () => {
  it("skips mailto anchors and hash", () => {
    expect(classifyHref("mailto:a@b.com").kind).toBe("skipped");
    expect(classifyHref("#section").kind).toBe("skipped");
    expect(classifyHref("tel:+1").kind).toBe("skipped");
  });

  it("classifies relative paths as internal", () => {
    const c = classifyHref("/firm/");
    expect(c.kind).toBe("internal");
    expect(c.pathname).toBe("/firm/");
  });

  it("classifies same-origin absolute URLs as internal", () => {
    const c = classifyHref("https://obsidianquantgroup.com/strategy/", "https://obsidianquantgroup.com");
    expect(c.kind).toBe("internal");
    expect(c.pathname).toBe("/strategy/");
  });

  it("classifies other origins as external", () => {
    expect(classifyHref("https://example.com/x").kind).toBe("external");
  });
});

describe("resolveInternalPath", () => {
  const ctx = {
    staticPaths: knownStaticPaths(),
    publishedBlogPaths: new Set(["/insights/hello-world/"]),
    redirectSources: new Set(["/insights/old-slug/"]),
  };

  it("accepts known static routes", () => {
    expect(resolveInternalPath("/firm", ctx).ok).toBe(true);
    expect(resolveInternalPath("/contact/", ctx).ok).toBe(true);
  });

  it("accepts published insights slugs", () => {
    expect(resolveInternalPath("/insights/hello-world/", ctx).ok).toBe(true);
  });

  it("accepts active redirects", () => {
    expect(resolveInternalPath("/insights/old-slug/", ctx).ok).toBe(true);
  });

  it("flags missing insights slugs as broken", () => {
    const r = resolveInternalPath("/insights/missing/", ctx);
    expect(r.ok).toBe(false);
  });
});

describe("brokenOnly", () => {
  it("filters to broken status", () => {
    const issues: LinkIssue[] = [
      { href: "/a", kind: "internal", status: "ok", detail: "" },
      { href: "/b", kind: "internal", status: "broken", detail: "x" },
    ];
    expect(brokenOnly(issues)).toHaveLength(1);
  });
});
