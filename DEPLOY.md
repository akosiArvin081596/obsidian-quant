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
