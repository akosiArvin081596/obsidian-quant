/**
 * Route smoke test — point it at an already-running `next start`.
 *   node scripts/smoke-routes.mjs [baseUrl]
 *
 * This exists because lint, typecheck, the unit suite and `next build` were all
 * green while the trailing-slash middleware served every public URL a 308 back
 * to itself. Nothing that inspects source can see that; only a real request
 * over the wire can. Every check below is one HTTP round trip against the
 * production build, and none of them need a database.
 */

const BASE = (process.argv[2] || process.env.SMOKE_BASE_URL || "http://127.0.0.1:4399").replace(
  /\/+$/,
  "",
);
const MAX_HOPS = 5;
// Derived from the base argument, never hardcoded: this script is pointed at
// 127.0.0.1 in CI and at the public host in production.
const ORIGIN = new URL(BASE).origin;

let failures = 0;
const record = (ok, name, detail = "") => {
  if (!ok) failures += 1;
  console.log(`${ok ? "  ok  " : "FAIL  "}${name}${detail ? ` — ${detail}` : ""}`);
};

/**
 * Walk redirects by hand rather than letting fetch follow them, so each hop is
 * visible and a self-referential Location is reported as the loop it is instead
 * of surfacing as a generic "too many redirects".
 *
 * Each hop is judged on its fully resolved URL, origin included. An earlier
 * version kept only `pathname + search`, which made a Location pointing at a
 * completely different host look identical to a local one — and that is exactly
 * how a production build that 308'd every bare URL to `https://localhost:3006/`
 * sailed through this script green while no browser could follow it. Two shapes
 * of the same class of bug are caught here: a proxy leaking its upstream host
 * into an absolute Location, and a relative Location beginning `//` (which is
 * protocol-relative, resolves to a foreign host, and is an open redirect).
 */
async function trace(path) {
  const hops = [];
  let current = path;

  for (let i = 0; i <= MAX_HOPS; i += 1) {
    const res = await fetch(`${BASE}${current}`, { redirect: "manual" });
    const location = res.headers.get("location");

    if (res.status >= 300 && res.status < 400 && location) {
      const resolved = new URL(location, `${BASE}${current}`);
      const next = `${resolved.pathname}${resolved.search}`;
      const offOrigin = resolved.origin !== ORIGIN;
      // Show the whole URL for an off-origin hop so the foreign host is visible
      // in the failure line; same-origin hops stay path-only as before.
      hops.push({ from: current, status: res.status, to: offOrigin ? resolved.href : next });

      // Checked before the self-reference test on purpose: a redirect to the
      // same path on another host would otherwise be misreported as a loop.
      if (offOrigin) {
        return { hops, final: resolved.href, status: res.status, escaped: resolved.origin };
      }
      if (next === current) return { hops, final: current, status: res.status, loop: true };
      current = next;
      continue;
    }

    return { hops, final: current, status: res.status, loop: false };
  }

  return { hops, final: current, status: null, loop: true, exhausted: true };
}

const describeHops = (t) =>
  t.hops.length ? t.hops.map((h) => `${h.from} -${h.status}-> ${h.to}`).join(" | ") : "no redirect";

/**
 * Report an off-origin redirect once, in one voice, ahead of every other
 * verdict — a check that leaves the origin has already failed in the only way
 * that matters, and any further assertion about it would just bury the cause.
 */
const escaped = (t, name) => {
  if (!t.escaped) return false;
  record(false, name, `escapes to ${t.escaped} — ${describeHops(t)}`);
  return true;
};

/** A path without its trailing slash must reach the slashed form in one 308. */
async function checkCanonical(path) {
  const bare = path.replace(/\/$/, "");
  const t = await trace(bare);
  const name = `canonical ${bare}`;

  if (escaped(t, name)) return;
  if (t.loop) {
    record(false, name, t.exhausted ? `>${MAX_HOPS} hops: ${describeHops(t)}` : `redirects to itself (${describeHops(t)})`);
    return;
  }
  if (t.hops.length !== 1 || t.hops[0].status !== 308) {
    record(false, name, `expected exactly one 308, got: ${describeHops(t)}`);
    return;
  }
  if (t.final !== path) {
    record(false, name, `landed on ${t.final}, expected ${path}`);
    return;
  }
  record(t.status === 200, name, t.status === 200 ? `308 -> ${path} -> 200` : `final status ${t.status}`);
}

/** Paths that must be served as-is: no redirect, whatever the status body is. */
async function checkNoRedirect(path, { expectStatus } = {}) {
  const t = await trace(path);
  const name = `untouched ${path}`;
  if (escaped(t, name)) return;
  if (t.hops.length) {
    record(false, name, `was redirected: ${describeHops(t)}`);
    return;
  }
  if (expectStatus && t.status !== expectStatus) {
    record(false, name, `status ${t.status}, expected ${expectStatus}`);
    return;
  }
  record(true, name, `status ${t.status}`);
}

/** A redirect that must land somewhere specific, in at most `maxHops`. */
async function checkLandsOn(path, expected, maxHops) {
  const t = await trace(path);
  const name = `${path} -> ${expected}`;
  if (escaped(t, name)) return;
  if (t.loop) {
    record(false, name, `redirect loop: ${describeHops(t)}`);
    return;
  }
  if (t.final !== expected) {
    record(false, name, `landed on ${t.final} (${describeHops(t)})`);
    return;
  }
  if (t.hops.length > maxHops) {
    record(false, name, `${t.hops.length} hops, expected <= ${maxHops}: ${describeHops(t)}`);
    return;
  }
  record(t.status === 200, name, `${t.hops.length} hop(s), status ${t.status}`);
}

/** The admin gate must bounce an anonymous request to the login page. */
async function checkAdminGate() {
  const t = await trace("/admin/dashboard");
  const name = "admin gate /admin/dashboard";
  if (escaped(t, name)) return;
  if (t.loop) {
    record(false, name, `redirect loop: ${describeHops(t)}`);
    return;
  }
  const landsOnLogin = t.final.startsWith("/admin/login/");
  const carriesNext = t.final.includes("next=");
  record(
    landsOnLogin && carriesNext && t.status === 200,
    name,
    `${t.final} (status ${t.status})`,
  );
}

const CANONICAL = [
  "/firm/",
  "/strategy/",
  "/architecture/",
  "/contact/",
  "/legal/regulatory-disclosure/",
  "/legal/data-cryptography/",
];

/**
 * The investor area, which had no automated coverage at all until now and is the
 * one route family whose guard is client-side: MemberLayout reads a
 * sessionStorage flag after mount and renders nothing until it hydrates, so the
 * server hands back a 200 shell for every screen here. That makes a regression
 * in these routes invisible to every other check in the repo.
 *
 * Status and redirect shape are all we assert. Deliberately NOT asserted:
 * anything about authentication. There is none by design — the area is a mock
 * demo and every screen carries a SampleDataBadge — so an auth assertion here
 * would encode an expectation the product does not hold. Nothing under
 * /investor touches the database either, which is what keeps these checks valid
 * in CI against a build with a dummy DATABASE_URL and nothing connected.
 */
const INVESTOR = [
  "/investor/",
  "/investor/login/",
  "/investor/dashboard/",
  "/investor/portfolio/",
  "/investor/account/",
];

const UNTOUCHED = [
  ["/", { expectStatus: 200 }],
  ["/robots.txt", { expectStatus: 200 }],
  ["/sitemap.xml", { expectStatus: 200 }],
  ["/assets/obsidian-gem.webp", { expectStatus: 200 }],
  // Status is irrelevant without a database; what matters is that middleware
  // never 308s an API path, which would break POSTs behind nginx.
  ["/api/public/tags", {}],
];

async function main() {
  console.log(`smoke: ${BASE}\n`);

  for (const path of CANONICAL) await checkCanonical(path);
  for (const path of INVESTOR) await checkCanonical(path);
  for (const [path, opts] of UNTOUCHED) await checkNoRedirect(path, opts);

  // Legacy blog URLs are permanentRedirects into /insights and must not pick up
  // an extra trailing-slash hop on the way.
  await checkLandsOn("/blog", "/insights/", 1);
  await checkAdminGate();

  console.log(`\n${failures ? `${failures} check(s) failed` : "all checks passed"}`);
  process.exit(failures ? 1 : 0);
}

main().catch((err) => {
  console.error(`smoke run failed: ${err.stack || err.message}`);
  process.exit(1);
});
