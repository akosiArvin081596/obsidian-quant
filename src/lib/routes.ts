/**
 * Pathname helpers. With `trailingSlash: true`,
 * `usePathname()` reports `/x/` on hard loads but `/x` after
 * client-side navigation — every comparison must go through one normalizer so
 * no component ever hand-rolls (and forgets) the slash handling.
 */
export const normalizePathname = (pathname: string) =>
  pathname.length > 1 && pathname.endsWith("/") ? pathname.replace(/\/+$/, "") : pathname;

/** True when `pathname` addresses the route `to`, slash form notwithstanding. */
export const isActivePath = (pathname: string, to: string) =>
  normalizePathname(pathname) === normalizePathname(to);

/**
 * Public page href with trailing slash (and optional hash), matching Next
 * `trailingSlash: true` + sitemap/canonical URLs. Leave `/`, externals, and
 * API paths untouched.
 */
export const toPublicHref = (path: string) => {
  if (!path || path === "/" || path.startsWith("http") || path.startsWith("mailto:") || path.startsWith("#")) {
    return path;
  }
  if (path.startsWith("/api/") || path.startsWith("/_next/")) return path;

  const hashIndex = path.indexOf("#");
  const pathname = hashIndex === -1 ? path : path.slice(0, hashIndex);
  const hash = hashIndex === -1 ? "" : path.slice(hashIndex);
  if (!pathname || pathname === "/") return `/${hash}`;

  const base = pathname.endsWith("/") ? pathname : `${pathname}/`;
  return `${base}${hash}`;
};
