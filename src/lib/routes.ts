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

/** Where the admin login sends a user when `?next=` is missing or untrustworthy. */
export const ADMIN_HOME = "/admin/blog/";

/**
 * Post-login destination from the gate's `?next=` parameter.
 *
 * The value is attacker-supplied — anyone can hand a victim
 * `/admin/login/?next=https://evil.com` — so it is only honoured when it is a
 * same-origin admin path. Rejected: absolute URLs, the protocol-relative
 * `//host`, and `/\host` (browsers read the backslash as a second slash, so it
 * resolves off-origin too). Everything else falls back to the admin home.
 */
export const safeAdminNext = (raw: string | null | undefined) => {
  if (!raw || !raw.startsWith("/")) return ADMIN_HOME;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return ADMIN_HOME;
  return raw === "/admin" || raw.startsWith("/admin/") ? raw : ADMIN_HOME;
};
