/**
 * Pathname helpers for the static export. With `trailingSlash: true`,
 * `usePathname()` reports `/x/` on hard loads of exported pages but `/x` after
 * client-side navigation — every comparison must go through one normalizer so
 * no component ever hand-rolls (and forgets) the slash handling.
 */
export const normalizePathname = (pathname: string) =>
  pathname.length > 1 && pathname.endsWith("/") ? pathname.replace(/\/+$/, "") : pathname;

/** True when `pathname` addresses the route `to`, slash form notwithstanding. */
export const isActivePath = (pathname: string, to: string) =>
  normalizePathname(pathname) === normalizePathname(to);
