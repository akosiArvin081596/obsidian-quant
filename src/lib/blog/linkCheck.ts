import { existsSync } from "node:fs";
import path from "node:path";
import { LEGAL, NAV } from "../../content/site";
import { SITE_URL } from "../seo";
import { ensureTrailingSlash } from "./slug";

export type LinkKind = "internal" | "external" | "skipped";

export type LinkIssue = {
  href: string;
  kind: "internal" | "external";
  status: "broken" | "ok" | "unchecked";
  detail: string;
  postId?: string;
  postTitle?: string;
};

export type ExtractedLink = {
  href: string;
  kind: LinkKind;
  pathname?: string;
};

const SKIP_SCHEMES = /^(mailto:|tel:|javascript:|data:)/i;

/** Known static marketing + legal routes (with and without trailing slash). */
export function knownStaticPaths(): Set<string> {
  const paths = new Set<string>(["/", "/blog", "/blog/", "/insights", "/insights/", "/contact", "/contact/"]);
  for (const item of NAV) {
    paths.add(item.to);
    paths.add(ensureTrailingSlash(item.to));
  }
  for (const item of LEGAL) {
    paths.add(item.to);
    paths.add(ensureTrailingSlash(item.to));
  }
  // Investor gateway exists but is gated; still a valid internal path.
  paths.add("/investor");
  paths.add("/investor/");
  return paths;
}

export function extractHrefs(html: string): string[] {
  const found = new Set<string>();
  const re = /href\s*=\s*["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const href = match[1].trim();
    if (href) found.add(href);
  }
  return [...found];
}

export function classifyHref(href: string, siteOrigin = SITE_URL): ExtractedLink {
  const trimmed = href.trim();
  if (!trimmed || trimmed === "#" || trimmed.startsWith("#") || SKIP_SCHEMES.test(trimmed)) {
    return { href: trimmed, kind: "skipped" };
  }

  if (trimmed.startsWith("/")) {
    return { href: trimmed, kind: "internal", pathname: trimmed.split(/[?#]/)[0] || "/" };
  }

  try {
    const url = new URL(trimmed, siteOrigin);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { href: trimmed, kind: "skipped" };
    }
    const origin = new URL(siteOrigin).origin;
    if (url.origin === origin) {
      return {
        href: trimmed,
        kind: "internal",
        pathname: url.pathname || "/",
      };
    }
    return { href: trimmed, kind: "external" };
  } catch {
    return { href: trimmed, kind: "skipped" };
  }
}

export type InternalResolveContext = {
  staticPaths?: Set<string>;
  /** Normalized blog paths like /blog/my-slug/ */
  publishedBlogPaths: Set<string>;
  /** Active redirect source paths (normalized with trailing slash where applicable) */
  redirectSources: Set<string>;
  /** /blog/category/{slug}/ and /blog/tag/{slug}/ that exist */
  taxonomyPaths?: Set<string>;
  uploadsRoot?: string;
};

function normalizeInternalPath(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  // Keep /uploads paths without forcing trailing slash
  if (pathname.startsWith("/uploads/")) return pathname;
  return ensureTrailingSlash(pathname);
}

export function resolveInternalPath(
  pathname: string,
  ctx: InternalResolveContext,
): { ok: boolean; detail: string } {
  const staticPaths = ctx.staticPaths ?? knownStaticPaths();
  const normalized = normalizeInternalPath(pathname);
  const bare = pathname.replace(/\/$/, "") || "/";

  if (staticPaths.has(pathname) || staticPaths.has(normalized) || staticPaths.has(bare)) {
    return { ok: true, detail: "Known site route" };
  }

  if (ctx.publishedBlogPaths.has(normalized) || ctx.publishedBlogPaths.has(pathname)) {
    return { ok: true, detail: "Published blog post" };
  }

  if (ctx.redirectSources.has(normalized) || ctx.redirectSources.has(pathname) || ctx.redirectSources.has(bare)) {
    return { ok: true, detail: "Active redirect" };
  }

  // /insights/ and /blog/ (legacy redirect) index
  if (normalized === "/insights/" || bare === "/insights" || normalized === "/blog/" || bare === "/blog") {
    return { ok: true, detail: "Insights index" };
  }

  // Category / tag archives
  if (ctx.taxonomyPaths?.has(normalized) || ctx.taxonomyPaths?.has(pathname)) {
    return { ok: true, detail: "Taxonomy archive" };
  }
  if (/^\/blog\/(category|tag)\/[^/]+\/?$/.test(normalized)) {
    return { ok: false, detail: "Unknown category or tag archive" };
  }

  if (pathname.startsWith("/uploads/")) {
    const key = pathname.replace(/^\/uploads\//, "");
    if (!key || key.includes("..")) {
      return { ok: false, detail: "Invalid uploads path" };
    }
    const root = ctx.uploadsRoot || path.join(process.cwd(), "uploads");
    const filePath = path.join(root, ...key.split("/"));
    if (existsSync(filePath)) {
      return { ok: true, detail: "Upload file exists" };
    }
    return { ok: false, detail: "Upload file missing" };
  }

  return { ok: false, detail: "No matching published page, redirect, or static route" };
}

const EXTERNAL_TIMEOUT_MS = 5000;

export async function checkExternalHref(href: string): Promise<{ ok: boolean; detail: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), EXTERNAL_TIMEOUT_MS);
  try {
    let res = await fetch(href, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "ObsidianQuant-LinkCheck/1.0" },
    });
    // Some hosts reject HEAD
    if (res.status === 405 || res.status === 501) {
      res = await fetch(href, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: { "User-Agent": "ObsidianQuant-LinkCheck/1.0" },
      });
    }
    if (res.status >= 400) {
      return { ok: false, detail: `HTTP ${res.status}` };
    }
    return { ok: true, detail: `HTTP ${res.status}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error";
    return { ok: false, detail: msg.includes("abort") ? "Timed out" : msg };
  } finally {
    clearTimeout(timer);
  }
}

export type ScanHtmlOptions = {
  checkExternal?: boolean;
  internal: InternalResolveContext;
  siteOrigin?: string;
  postId?: string;
  postTitle?: string;
};

export async function scanHtmlLinks(
  html: string,
  opts: ScanHtmlOptions,
): Promise<LinkIssue[]> {
  const issues: LinkIssue[] = [];
  const hrefs = extractHrefs(html);
  const siteOrigin = opts.siteOrigin ?? SITE_URL;

  for (const href of hrefs) {
    const classified = classifyHref(href, siteOrigin);
    if (classified.kind === "skipped") continue;

    if (classified.kind === "internal" && classified.pathname) {
      const result = resolveInternalPath(classified.pathname, opts.internal);
      issues.push({
        href,
        kind: "internal",
        status: result.ok ? "ok" : "broken",
        detail: result.detail,
        postId: opts.postId,
        postTitle: opts.postTitle,
      });
      continue;
    }

    if (classified.kind === "external") {
      if (!opts.checkExternal) {
        issues.push({
          href,
          kind: "external",
          status: "unchecked",
          detail: "External check skipped",
          postId: opts.postId,
          postTitle: opts.postTitle,
        });
        continue;
      }
      const result = await checkExternalHref(href);
      issues.push({
        href,
        kind: "external",
        status: result.ok ? "ok" : "broken",
        detail: result.detail,
        postId: opts.postId,
        postTitle: opts.postTitle,
      });
    }
  }

  return issues;
}

export function brokenOnly(issues: LinkIssue[]): LinkIssue[] {
  return issues.filter((i) => i.status === "broken");
}
