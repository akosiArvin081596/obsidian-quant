import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { INSIGHTS_VISIBLE } from "./content/site";
import { isInsightsRoute } from "./lib/routes";

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
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login/";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Insights hub is paused — send visitors home before trailing-slash canonicalization.
  if (!INSIGHTS_VISIBLE && isInsightsRoute(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url, 307);
  }

  // Canonicalize public pages to trailing-slash URLs (matches next.config + sitemap).
  // skipTrailingSlashRedirect stays true so /api/* is never 308'd by Next itself.
  if (
    pathname.length > 1 &&
    !pathname.endsWith("/") &&
    !skipTrailingSlash(pathname)
  ) {
    const url = req.nextUrl.clone();
    url.pathname = `${pathname}/`;
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/((?!_next/static|_next/image|favicon.ico|assets/|.*\\..*).*)",
  ],
};
