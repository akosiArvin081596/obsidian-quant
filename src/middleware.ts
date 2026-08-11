import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Redirect target as a plain `URL`, preserving the incoming query string.
 *
 * Deliberately NOT `req.nextUrl.clone()`: `NextURL` re-applies the app's
 * trailing-slash normalisation when it serialises, so a pathname we just set to
 * `/strategy/` goes back out as `/strategy` — which points the redirect at the
 * request it came from and loops until the browser gives up.
 */
const redirectTarget = (req: NextRequest, pathname: string) => {
  const url = new URL(req.url);
  url.pathname = pathname;
  return url;
};

/** Paths that must not receive a trailing-slash redirect (APIs, Next internals, files). */
const skipTrailingSlash = (pathname: string) =>
  pathname.startsWith("/api") ||
  pathname.startsWith("/_next") ||
  pathname.startsWith("/uploads") ||
  pathname.includes(".");

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Soft gate for admin UI — API still enforces auth. Login page is public.
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const token = req.cookies.get("oqg_admin_session")?.value;
    if (!token) {
      const url = redirectTarget(req, "/admin/login/");
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
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
