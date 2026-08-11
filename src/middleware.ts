import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resolveRequestOrigin } from "./lib/requestOrigin";

/**
 * Absolute redirect target, built from the host the visitor actually used.
 *
 * Three traps are baked into this helper. All three have shipped as real bugs,
 * so none of this is hypothetical:
 *
 * 1. Not `req.nextUrl.clone()`. `NextURL` re-applies the app's trailing-slash
 *    normalisation when it serialises, so a pathname just set to `/strategy/`
 *    goes back out as `/strategy` — pointing the redirect at the request it
 *    came from, and looping until the browser gives up.
 * 2. Not the host from `req.url` either. pm2 runs this app as
 *    `next start -p 3006 -H 127.0.0.1`, and `req.url` reports that listener —
 *    `localhost:3006` — no matter what Host arrives. Every public redirect
 *    briefly sent real visitors to port 3006 on their own machine.
 * 3. Not a relative `Location`, tempting as it is: Next's middleware runtime
 *    parses the header as an absolute URL and throws ERR_INVALID_URL, which
 *    surfaces as a 500 on every redirecting route.
 *
 * So the origin is rebuilt from the `Host` header — which nginx forwards as
 * `$host` — and `X-Forwarded-Proto`, because the upstream hop is plain http.
 * Both are validated in `resolveRequestOrigin`, which allowlists the scheme and
 * falls back to the canonical host for anything unrecognised: the header is
 * client-supplied, so echoing it into a `Location` unchecked would be a
 * redirect-poisoning primitive the day a cache or CDN appears in front.
 *
 * Assigning `pathname` onto that origin, rather than interpolating it, keeps
 * the *path* from escaping: `//evil.com` lands as `https://<our-host>//evil.com`
 * rather than a protocol-relative jump off-site. The origin's safety comes from
 * the allowlist, not from this assignment.
 */
const redirectTarget = (req: NextRequest, pathname: string) => {
  const url = new URL(
    resolveRequestOrigin(
      req.headers.get("x-forwarded-proto"),
      req.headers.get("host"),
      req.nextUrl.protocol.replace(":", ""),
    ),
  );

  url.pathname = pathname;
  url.search = req.nextUrl.search;
  return url;
};

/** Paths that must not receive a trailing-slash redirect (APIs, Next internals, files). */
const skipTrailingSlash = (pathname: string) =>
  pathname.startsWith("/api") ||
  pathname.startsWith("/_next") ||
  pathname.startsWith("/uploads") ||
  // Every /blog* route is a legacy permanentRedirect into /insights. Adding a
  // slash first would make each one a two-hop chain for no gain.
  pathname.startsWith("/blog") ||
  pathname.includes(".");

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Soft gate for admin UI — API still enforces auth. Login page is public.
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const token = req.cookies.get("oqg_admin_session")?.value;
    if (!token) {
      const url = redirectTarget(req, "/admin/login/");
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url, 307);
    }
  }

  // Canonicalize public pages to trailing-slash URLs (matches next.config + sitemap).
  // skipTrailingSlashRedirect stays true so /api/* is never 308'd by Next itself.
  if (
    pathname.length > 1 &&
    !pathname.endsWith("/") &&
    !skipTrailingSlash(pathname)
  ) {
    return NextResponse.redirect(redirectTarget(req, `${pathname}/`), 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/((?!_next/static|_next/image|favicon.ico|assets/|.*\\..*).*)",
  ],
};
