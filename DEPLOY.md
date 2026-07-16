# Deployment — obsidian.abedubas.dev

Static React/Vite SPA, built on the VPS and served by nginx. Same VPS and
conventions as the other `*.abedubas.dev` apps.

## Pipeline

```
push to main ──▶ GitHub Actions ──ssh──▶ VPS forced-command ──▶ deploy-obsidian.sh
                                                                  ├─ git pull (deploy key)
                                                                  ├─ npm ci
                                                                  └─ npm run build → dist/
                                                          nginx serves /var/www/obsidian-quant/dist
```

## Facts

| Item | Value |
|------|-------|
| Repo | `akosiArvin081596/obsidian-quant` (private) |
| VPS | `76.13.22.110` (root) |
| App dir | `/var/www/obsidian-quant` (built output in `dist/`) |
| Web server | nginx vhost `/etc/nginx/sites-available/obsidian.abedubas.dev` |
| Deploy script | `/usr/local/bin/deploy-obsidian.sh` |
| VPS → GitHub | read-only **deploy key** `/root/.ssh/obsidian_deploy` |
| GitHub Actions → VPS | `gha-obsidian-deploy` key, **forced command** (deploy only, no shell) |
| GH secrets | `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_KNOWN_HOSTS` |

`VPS_KNOWN_HOSTS` must contain the VPS host key captured through a trusted
channel. The workflow requires an exact match and will not trust a key learned
during deployment.

## ⚠️ One-time DNS (manual — Hostinger hPanel)

`abedubas.dev` DNS is hosted at Hostinger (`dns-parking.com`). There is **no
wildcard**, so add an A record:

```
Type: A    Name: obsidian    Value: 76.13.22.110    TTL: default
```

## One-time SSL (after DNS resolves)

```bash
ssh root@76.13.22.110 \
  "certbot --nginx -d obsidian.abedubas.dev --non-interactive --agree-tos -m access@obsidianquant.group --redirect"
```

Certbot rewrites the vhost to add the 443 server block + HTTP→HTTPS redirect
(same as every other subdomain). Auto-renews via the existing certbot timer.

## Security headers

The repository contains the production header policy at
`deploy/nginx-security-headers.conf`. Include it inside the HTTPS server block,
then validate and reload nginx:

```nginx
include /var/www/obsidian-quant/deploy/nginx-security-headers.conf;
```

```bash
nginx -t && systemctl reload nginx
curl -sI https://obsidian.abedubas.dev/
```

The application also ships a CSP meta policy as defense in depth. HSTS and
`frame-ancestors` must be delivered by nginx and cannot be set by HTML.

## Market Intelligence proxy (Yahoo quotes)

The hero Market Intelligence panel fetches live index quotes through
same-origin `/api/yahoo/...`. Vite proxies that path in `npm run dev` /
`npm run preview`. On the VPS, nginx must do the same — include the snippet
inside the HTTPS server block (alongside the security headers):

```nginx
include /var/www/obsidian-quant/deploy/nginx-security-headers.conf;
include /var/www/obsidian-quant/deploy/nginx-yahoo-proxy.conf;
```

**One-time: install the rate-limit zone.** The proxy rate-limits per client IP
(`limit_req zone=yahoo_proxy burst=10 nodelay;`). `limit_req_zone` is only valid
in the `http{}` context, so it lives in `deploy/nginx-ratelimit.conf` rather than
the vhost snippet. Copy or symlink it into `/etc/nginx/conf.d/`, which the stock
`nginx.conf` auto-includes inside `http{}`:

```bash
ln -s /var/www/obsidian-quant/deploy/nginx-ratelimit.conf \
      /etc/nginx/conf.d/obsidian-ratelimit.conf          # or: cp
```

The vhost `include` of `nginx-yahoo-proxy.conf` now **depends** on this zone: if
`nginx-ratelimit.conf` is not in `conf.d/`, `nginx -t` fails with
`unknown limit_req_zone "yahoo_proxy"`. Install it before (or together with) the
reload below.

Then validate, reload, and smoke-test the proxy:

```bash
# After git pull so the new include files are on disk
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
| Repo / VPS owner (optional) | Set `VITE_CRM_WEBHOOK_URL` at build time to push leads into Zapier / Make / HubSpot |

Optional overrides (owner only — CI / VPS env, not needed by contributors):

```bash
VITE_CONTACT_INBOX=access@obsidianquantgroup.com
VITE_CONTACT_ENDPOINT=https://formsubmit.co/ajax/access@obsidianquantgroup.com
VITE_CRM_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/...
```

> **CSP note:** if you set `VITE_CRM_WEBHOOK_URL`, add that webhook's origin (e.g. `https://hooks.zapier.com`) to `connect-src` in both `deploy/nginx-security-headers.conf` and the `index.html` meta CSP, or the CRM fetch is blocked.

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
curl -sI --resolve obsidian.abedubas.dev:80:76.13.22.110 http://obsidian.abedubas.dev/ | head
```
