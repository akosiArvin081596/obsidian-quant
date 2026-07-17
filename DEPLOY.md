# Deployment — obsidianquantgroup.com

Static Next.js export (App Router), built on the VPS and served by nginx. **Production is
`obsidianquantgroup.com`** (+ `www.`). `obsidian.abedubas.dev` is a preview/staging
alias on the **same VPS**, served from the **same** build in
`/var/www/obsidian-quant/dist`. They are **two separate nginx vhosts**, and each
one must have the `deploy/*.conf` includes wired in — see
[nginx vhosts](#-nginx-vhosts--wire-the-includes-into-both).

`npm run build` runs `next build` (static export to `out/`) then copies `out/` → `dist/`
so the nginx root path stays unchanged.

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
# Lead intake → CRM (see "Contact / CRM pipeline"). The secret include is
# root-only and NOT in the repo; it MUST precede the lead-proxy include.
include /etc/nginx/snippets/obsidian-lead-secret.conf;
include /var/www/obsidian-quant/deploy/nginx-lead-proxy.conf;
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

Each vhost `include` of `nginx-yahoo-proxy.conf` and `nginx-lead-proxy.conf`
**depends** on this file — it declares BOTH the `yahoo_proxy` and `lead_proxy`
zones. If `nginx-ratelimit.conf` is not in `conf.d/`, `nginx -t` fails with
`unknown limit_req_zone "yahoo_proxy"` (or `"lead_proxy"`). Install it before (or
together with) the reload.

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
| Repo / VPS owner (optional) | Set `NEXT_PUBLIC_CRM_WEBHOOK_URL` at build time to push leads into Zapier / Make / HubSpot |

Optional overrides (owner only — CI / VPS env, not needed by contributors):

```bash
NEXT_PUBLIC_CONTACT_INBOX=access@obsidianquantgroup.com
NEXT_PUBLIC_CONTACT_ENDPOINT=https://formsubmit.co/ajax/access@obsidianquantgroup.com
NEXT_PUBLIC_CRM_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/...
```

> **CSP note:** the default lead intake is same-origin (`/api/lead`) — **no CSP change needed.** Only if you override `NEXT_PUBLIC_CRM_WEBHOOK_URL` to a DIFFERENT origin (e.g. `https://hooks.zapier.com`) must you add that origin to `connect-src` in both `deploy/nginx-security-headers.conf` and the root layout CSP meta, or the CRM fetch is blocked.

### Lead intake → alchemydev-crm ("Leads" tab)

Every submission is also POSTed to the CRM as a **project-scoped lead**, shown on
the project's **Leads** tab in alchemydev-crm — a structured store alongside the
FormSubmit email. The browser posts **same-origin** `/api/lead` (the default
`CRM_WEBHOOK_URL`); nginx forwards it to the CRM and **injects the shared bearer
secret server-side**, so the secret is never in the client bundle. Best-effort: a
CRM failure never blocks or double-sends the email (the sole source of truth).

One-time wire-up on the VPS (both vhosts):

1. **Secret file** — root-only, NOT committed. Defines the nginx variable the
   lead-proxy reads (`$lead_intake_secret`). Its value is `LEAD_INTAKE_SECRET`,
   shared out-of-band with the CRM:
   ```bash
   printf 'set $lead_intake_secret "%s";\n' "$LEAD_INTAKE_SECRET" \
     > /etc/nginx/snippets/obsidian-lead-secret.conf
   chmod 600 /etc/nginx/snippets/obsidian-lead-secret.conf
   ```
2. **Includes** — already in the vhost block above (secret include first, then
   `nginx-lead-proxy.conf`), plus the `lead_proxy` zone via `nginx-ratelimit.conf`
   in `conf.d/`. If `$lead_intake_secret` is undefined, `nginx -t` fails loudly
   (fail-closed — no empty bearer is ever sent).
3. **CRM host** — `nginx-lead-proxy.conf` proxies to
   `https://ups.alchemydev.io/api/webhooks/leads`; change it there if the CRM
   moves. On the CRM side, set the same `LEAD_INTAKE_SECRET` and the target
   project's `leadSourceKey = "obsidian-quant-web"`.

Smoke-test the wiring WITHOUT creating a lead — an unknown `source` returns `422`
after passing the secret check, proving the proxy + bearer work end-to-end:
```bash
curl -sS -o /dev/null -w '%{http_code}\n' -X POST \
  https://obsidianquantgroup.com/api/lead \
  -H 'content-type: application/json' \
  -d '{"source":"__wiring_probe__","companyName":"Wiring Probe"}'
# 422 = proxy + secret OK (source just doesn't map to a project — no lead created)
# 401 = secret mismatch · 503 = CRM's LEAD_INTAKE_SECRET unset · 000 = proxy not wired
```

Mailbox **passwords must never** be stored in the repo or frontend env.

## Market Intelligence proxy (Yahoo quotes)

The hero Market Intelligence panel fetches live index quotes through
same-origin `/api/yahoo/...`. On the VPS, nginx must proxy that path — include the snippet
inside the HTTPS server block (alongside the security headers):

```nginx
include /var/www/obsidian-quant/deploy/nginx-security-headers.conf;
include /var/www/obsidian-quant/deploy/nginx-yahoo-proxy.conf;
```

Then validate, reload, and smoke-test the proxy:

```bash
# After git pull so the new include file is on disk
nginx -t && systemctl reload nginx

curl -sS "https://obsidian.abedubas.dev/api/yahoo/v8/finance/chart/%5EVIX?range=5d&interval=1d" \
  | head -c 200
```

You should see Yahoo JSON (`{"chart":...}`). Without this include, production
falls back to cached/seed ticker values. CSP already allows `connect-src 'self'`,
so no header change is required for the proxy.

## Contact / CRM pipeline

**No `.env` required for the form to work.** Built-in defaults already route
submissions to `access@obsidianquantgroup.com` via FormSubmit.

| Who | Action |
|-----|--------|
| Anyone testing locally | Submit the form; confirm FormSubmit’s first-time activation email to the inbox |
| Repo / VPS owner (optional) | Set `NEXT_PUBLIC_CRM_WEBHOOK_URL` at build time to push leads into Zapier / Make / HubSpot |

Optional overrides (owner only — CI / VPS env, not needed by contributors):

```bash
NEXT_PUBLIC_CONTACT_INBOX=access@obsidianquantgroup.com
NEXT_PUBLIC_CONTACT_ENDPOINT=https://formsubmit.co/ajax/access@obsidianquantgroup.com
NEXT_PUBLIC_CRM_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/...
```

Mailbox **passwords must never** be stored in the repo or frontend env.

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
