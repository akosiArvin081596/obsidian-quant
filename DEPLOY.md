# Deployment — obsidianquantgroup.com

Static React/Vite SPA, built on the VPS and served by nginx. **Production is
`obsidianquantgroup.com`** (+ `www.`). `obsidian.abedubas.dev` is a preview/staging
alias on the **same VPS**, served from the **same** build in
`/var/www/obsidian-quant/dist`. They are **two separate nginx vhosts**, and each
one must have the `deploy/*.conf` includes wired in — see
[nginx vhosts](#-nginx-vhosts--wire-the-includes-into-both).

## Pipeline

```
push to main ──▶ GitHub Actions ──ssh──▶ VPS forced-command ──▶ deploy-obsidian.sh
                                                                  ├─ git pull (deploy key)
                                                                  ├─ npm ci
                                                                  └─ npm run build → dist/
                                                          nginx serves /var/www/obsidian-quant/dist
```

The deploy script only rebuilds the frontend — it does **not** touch nginx. Every
vhost / include / header / cert change is a manual server step (below), and must
be applied to **each** vhost that serves the app.

## Facts

| Item | Value |
|------|-------|
| Repo | `akosiArvin081596/obsidian-quant` (private) |
| VPS | `76.13.22.110` (root) |
| App dir | `/var/www/obsidian-quant` (built output in `dist/`) |
| Domains | **prod** `obsidianquantgroup.com` + `www.obsidianquantgroup.com`; **preview** `obsidian.abedubas.dev` — all → `76.13.22.110`, same `dist/` |
| Web server | nginx vhosts `/etc/nginx/sites-available/obsidianquantgroup.com` (prod) and `/etc/nginx/sites-available/obsidian.abedubas.dev` (preview) |
| Email | `access@obsidianquantgroup.com` on Google Workspace (MX → Google); the contact form delivers here via FormSubmit |
| Deploy script | `/usr/local/bin/deploy-obsidian.sh` |
| VPS → GitHub | read-only **deploy key** `/root/.ssh/obsidian_deploy` |
| GitHub Actions → VPS | `gha-obsidian-deploy` key, **forced command** (deploy only, no shell) |
| GH secrets | `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_KNOWN_HOSTS` |

`VPS_KNOWN_HOSTS` must contain the VPS host key captured through a trusted
channel. The workflow requires an exact match and will not trust a key learned
during deployment.

## ⚠️ One-time DNS (manual)

Point production at the VPS at the domain's DNS host (apex + `www`):

```
Type: A    Name: @      Value: 76.13.22.110
Type: A    Name: www    Value: 76.13.22.110
```

The preview alias `obsidian.abedubas.dev` (DNS at Hostinger, `dns-parking.com`,
no wildcard) uses `Type: A  Name: obsidian  Value: 76.13.22.110`.

## One-time SSL (after DNS resolves)

```bash
# Production (apex + www)
ssh root@76.13.22.110 \
  "certbot --nginx -d obsidianquantgroup.com -d www.obsidianquantgroup.com --non-interactive --agree-tos -m access@obsidianquantgroup.com --redirect"

# Preview alias
ssh root@76.13.22.110 \
  "certbot --nginx -d obsidian.abedubas.dev --non-interactive --agree-tos -m access@obsidianquantgroup.com --redirect"
```

Certbot rewrites each vhost to add the 443 server block + HTTP→HTTPS redirect.
Auto-renews via the existing certbot timer.

## ⚠️ nginx vhosts — wire the includes into BOTH

The security headers and the Yahoo quotes proxy live in repo-managed snippets
under `deploy/`. They are **not** applied automatically — each vhost's HTTPS
`server { … }` block must `include` them. **This is the step that's easy to
miss:** wiring the preview vhost but not the production one leaves the flagship
live-quotes panel serving seed data and drops CSP/HSTS on the real site.

In **both** `/etc/nginx/sites-available/obsidianquantgroup.com` **and**
`/etc/nginx/sites-available/obsidian.abedubas.dev`, replace any partial inline
`add_header` security headers with these two includes (the security-headers
snippet is a superset — same four headers plus CSP + HSTS):

```nginx
include /var/www/obsidian-quant/deploy/nginx-security-headers.conf;
include /var/www/obsidian-quant/deploy/nginx-yahoo-proxy.conf;
```

The app ships a CSP `<meta>` policy too, as defense in depth. HSTS and
`frame-ancestors` can only be delivered by nginx, not HTML.

### One-time: install the rate-limit zone

The proxy rate-limits per client IP (`limit_req zone=yahoo_proxy burst=10
nodelay;`). `limit_req_zone` is only valid in the `http{}` context, so it lives
in `deploy/nginx-ratelimit.conf` rather than the vhost snippet. Symlink (or copy)
it into `/etc/nginx/conf.d/`, which the stock `nginx.conf` auto-includes inside
`http{}` — one install covers **both** vhosts (they share the zone):

```bash
ln -s /var/www/obsidian-quant/deploy/nginx-ratelimit.conf \
      /etc/nginx/conf.d/obsidian-ratelimit.conf          # or: cp
```

Each vhost `include` of `nginx-yahoo-proxy.conf` **depends** on this zone: if
`nginx-ratelimit.conf` is not in `conf.d/`, `nginx -t` fails with
`unknown limit_req_zone "yahoo_proxy"`. Install it before (or together with) the
reload.

### Validate, reload, and smoke-test

```bash
# After git pull so the include files are on disk
nginx -t && systemctl reload nginx

# Live Yahoo JSON (not the SPA HTML fallback) on BOTH domains:
curl -sS "https://obsidianquantgroup.com/api/yahoo/v8/finance/chart/%5EVIX?range=5d&interval=1d" | head -c 120
curl -sS "https://obsidian.abedubas.dev/api/yahoo/v8/finance/chart/%5EVIX?range=5d&interval=1d"  | head -c 120

# Headers present (CSP + HSTS), single X-Frame-Options:
curl -sI https://obsidianquantgroup.com/ | grep -iE 'content-security-policy|strict-transport|x-frame-options'
```

You should see Yahoo JSON (`{"chart":...}`). Without the proxy include, the app
falls back to cached/seed ticker values (the panel still renders, just not live).

## Contact / CRM pipeline

**No `.env` required for the form to work.** Built-in defaults already route
submissions to `access@obsidianquantgroup.com` via FormSubmit.

| Who | Action |
|-----|--------|
| First-time setup | Submit the form once, then click FormSubmit's **"Activate Form"** email in the `access@obsidianquantgroup.com` inbox — required once before any submission is delivered |
| Repo / VPS owner | Leads also flow **best-effort** to the CRM via the same-origin `/api/lead` proxy — see [CRM lead intake](#crm-lead-intake--same-origin-apilead-proxy-draft) below. `VITE_CRM_WEBHOOK_URL` optionally **overrides** that target (e.g. a Zapier / Make webhook) |

Optional overrides (owner only — CI / VPS env, not needed by contributors):

```bash
VITE_CONTACT_INBOX=access@obsidianquantgroup.com
VITE_CONTACT_ENDPOINT=https://formsubmit.co/ajax/access@obsidianquantgroup.com
VITE_CRM_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/...
```

> **CSP note:** if you set `VITE_CRM_WEBHOOK_URL`, add that webhook's origin (e.g. `https://hooks.zapier.com`) to `connect-src` in both `deploy/nginx-security-headers.conf` and the `index.html` meta CSP, or the CRM fetch is blocked.

Mailbox **passwords must never** be stored in the repo or frontend env.

## CRM lead intake — same-origin `/api/lead` proxy (draft)

> **⚠️ DRAFT — do NOT wire into a vhost yet.** `deploy/nginx-lead-proxy.conf`
> forwards to `https://CRM_HOST_TBD/api/webhooks/leads` — a `TODO(crm-contract)`
> placeholder. Wire it in **only after** the alchemydev-crm engineer hands back the
> confirmed CRM host + final path + request contract (see
> `docs/crm-lead-intake-brief.md`).

Leads are delivered to the inbox by FormSubmit (above) and, **best-effort**, pushed
to the CRM. The site is a static SPA, so the CRM bearer secret must not live in the
browser bundle — nginx injects it server-side, exactly like the Yahoo proxy:

```
browser POST  ->  same-origin /api/lead on obsidianquantgroup.com
                  (nginx adds  Authorization: Bearer <LEAD_INTAKE_SECRET>)
                  ->  proxies to CRM   POST /api/webhooks/leads
```

`src/lib/contact.ts` posts the lead to same-origin `/api/lead` (`CRM_WEBHOOK_URL`,
default) — fire-and-forget: a non-2xx, or the proxy simply not being deployed yet, is
swallowed and never gates the email-confirmed submission. `connect-src` stays
`'self'`, so **no CSP change is needed**.

### One-time: the server-only secret file (never committed)

The repo-managed `deploy/nginx-lead-proxy.conf` references an nginx variable
`$lead_intake_bearer` but **never contains the secret value**. Define it in a
server-only file that is not in the repo, in the `http{}` context (`map` is
http-only), then lock it down:

```bash
# /etc/nginx/conf.d/obsidian-lead-secret.conf   (root:root, chmod 600, NOT in git)
map "" $lead_intake_bearer { default "<LEAD_INTAKE_SECRET>"; }
```

`conf.d/` is auto-included inside `http{}` by the stock `nginx.conf`, so the variable
is defined once and visible to every vhost. Replace `<LEAD_INTAKE_SECRET>` with the
value shared out-of-band by the CRM owner — it lives **only** on the VPS, never in git.

### Wire the include into BOTH vhosts (after the CRM host is confirmed)

Like the other snippets, add to each vhost's HTTPS `server { … }` block:

```nginx
include /var/www/obsidian-quant/deploy/nginx-lead-proxy.conf;
```

The proxy's `limit_req zone=lead_intake …` depends on the `lead_intake` zone in
`deploy/nginx-ratelimit.conf` — already installed in `conf.d/` for the Yahoo proxy, so
one install covers both zones and both vhosts. Then `nginx -t && systemctl reload
nginx`. Smoke test once the CRM endpoint is live:

```bash
# 405 on a GET (POST-only); a POST relays to the CRM (expect the CRM's 2xx/4xx, not SPA HTML):
curl -sI  https://obsidianquantgroup.com/api/lead | head -1
curl -sS -X POST https://obsidianquantgroup.com/api/lead -H 'Content-Type: application/json' -d '{}' | head -c 200
```

## Manual deploy / rollback

```bash
# Deploy current main now
ssh root@76.13.22.110 deploy           # (forced command runs the deploy script)

# or trigger from GitHub
gh workflow run "Deploy to VPS" -R akosiArvin081596/obsidian-quant

# Rollback: reset to a known-good commit, then redeploy
cd /var/www/obsidian-quant && git reset --hard <sha> && npm ci && npm run build
```

## Verify before DNS

```bash
curl -sI --resolve obsidianquantgroup.com:443:76.13.22.110 https://obsidianquantgroup.com/ | head
```
