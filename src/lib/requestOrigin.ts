/**
 * Derives the origin a middleware redirect should point at, from proxy headers.
 *
 * Split out of `src/middleware.ts` so it can be unit-tested: the middleware
 * bundle runs in the edge runtime, and every previous attempt to get this right
 * asserted its safety in a comment instead of a test — twice while shipping a
 * production outage.
 *
 * Deliberately does NOT import `SITE_URL` from `src/lib/seo.ts`. That module
 * pulls in `content/site` and `content/seoData`, which would land the whole
 * marketing copy in the edge bundle. `requestOrigin.test.ts` asserts
 * `CANONICAL_HOST` still equals `SITE_URL`'s host, so the duplication is
 * enforced by a failing test rather than by hoping someone reads a comment.
 */

/** Must match the host of `SITE_URL` in `src/lib/seo.ts` — pinned by the test. */
export const CANONICAL_HOST = "obsidianquantgroup.com";

/** Hosts this app legitimately answers on. Anything else is not ours. */
const KNOWN_HOSTS = new Set([
  CANONICAL_HOST,
  `www.${CANONICAL_HOST}`,
  "obsidian.abedubas.dev",
]);

/** CI (`next start` on 127.0.0.1:4399) and local dev, on any port. */
const isLoopbackHost = (host: string) =>
  /^(localhost|127\.0\.0\.1|\[::1\])(:\d{1,5})?$/.test(host);

/**
 * `X-Forwarded-Proto` is a list header: add a second proxy in front and it
 * becomes `"https, http"`. Take the client-most value, then allowlist it —
 * the result is interpolated into a URL string, so an unvalidated value like
 * `https://evil.com/#` moves the origin off-site entirely, and `javascript:`
 * parses as a scheme too.
 */
export const resolveProto = (header: string | null, fallback: string) => {
  const first = (header ?? fallback).split(",")[0]?.trim().toLowerCase();
  return first === "https" ? "https" : "http";
};

/**
 * The `Host` header is whatever the client sent (nginx forwards it verbatim as
 * `$host`). An unrecognised value is therefore attacker-supplied, so it falls
 * back to the canonical host rather than being echoed into a `Location` — that
 * is what stops this being a redirect-poisoning primitive if a cache or CDN
 * ever lands in front.
 */
export const resolveHost = (header: string | null) => {
  const host = header?.trim().toLowerCase() ?? "";
  if (!host) return CANONICAL_HOST;
  return KNOWN_HOSTS.has(host) || isLoopbackHost(host) ? host : CANONICAL_HOST;
};

/** `scheme://host` for a redirect target. Never throws. */
export const resolveRequestOrigin = (
  protoHeader: string | null,
  hostHeader: string | null,
  fallbackProto: string,
) => `${resolveProto(protoHeader, fallbackProto)}://${resolveHost(hostHeader)}`;
