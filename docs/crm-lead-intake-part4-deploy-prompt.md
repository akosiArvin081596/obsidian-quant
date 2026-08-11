# CRM lead intake — Part 4 (obsidian deploy + nginx wire-up) CLI prompt

The deploy/wire-up counterpart to
[`crm-lead-intake-part3-cli-prompt.md`](./crm-lead-intake-part3-cli-prompt.md).
Part 3 was **writing** the obsidian code; this is **shipping** it: merge the PR,
deploy the SPA, and wire the VPS nginx so the same-origin `/api/lead` proxy
injects the bearer secret and reaches the (already-live) CRM webhook.

> **Status:** the obsidian code is written & reviewed on branch
> `feat/lead-intake-proxy` (PR #24). The **CRM side is LIVE in production and
> verified** (secret loaded, `Project.leadSourceKey = "obsidian-quant-web"` set on
> the CRM's "Obsidian" project, end-to-end 401/422/201/200 confirmed). This doc is
> the spec-of-record for the remaining deploy + infra work — re-running it should
> *reconcile / verify*, not duplicate.

## Finalized CRM contract (recap — already shipped)

| | |
|---|---|
| Endpoint (via same-origin proxy) | `POST /api/lead` → `POST https://ups.alchemydev.io/api/webhooks/leads` |
| Auth | `Authorization: Bearer <LEAD_INTAKE_SECRET>` — injected by nginx server-side, never by the browser |
| Env var | `LEAD_INTAKE_SECRET` — **value already on the VPS** at `/var/www/alchemydev-crm/.env` |
| Body | `source`* (1–100), `companyName`* (2–200), `contactName?` (≤120), `contactEmail?` (email ≤200), `notes?` (≤5000), `submittedAt?` (ISO-8601 w/ offset) |
| Responses | `201 {ok,id}` · `200 {ok,id,deduplicated}` · `400` · `401` bad bearer · `422` unknown source · `429` · `503` |
| Project resolution | `source "obsidian-quant-web"` → CRM's `Project.leadSourceKey` (set in prod → real submissions return `201`) |

## The box (same VPS as the CRM)

| | |
|---|---|
| SSH | `ssh -i ~/.ssh/abedubas_vps root@76.13.22.110` |
| nginx layout | Debian-style: vhosts in `/etc/nginx/sites-available` (+ `sites-enabled` symlinks), snippets in `/etc/nginx/snippets`, `http{}` includes via `nginx.conf` |
| Prod vhost | `obsidianquantgroup.com` (`server_name obsidianquantgroup.com www.obsidianquantgroup.com`) |
| Staging vhost | `obsidian.abedubas.dev` |
| Webroot | `/var/www/obsidian-quant` |
| Mirror this | an existing **`yahoo_proxy`** is already wired here the same way you'll wire `lead_proxy` — copy its include style + `http{}` zone location |
| ⚠️ | both obsidian vhosts have `.bak` files stamped today — **read the vhost + its `.bak` before editing**; no lead snippet exists yet |

## Full prompt

```text
GOAL
Finish deploying the website-lead intake — the OBSIDIAN side. The code is already
written & reviewed on branch feat/lead-intake-proxy (PR #24). The CRM side is LIVE
in production and verified. Your job: (1) merge PR #24 + deploy the SPA, and (2)
wire this VPS's nginx so a same-origin POST /api/lead proxies to the CRM webhook
with the bearer secret injected server-side. Then smoke-test. Do NOT touch the CRM.

If PR #24 is already merged, skip step 1. If a partial /api/lead block already
exists on the box, RECONCILE rather than duplicate (see the .bak note below).

CRM SIDE — DONE & LIVE (context; change nothing here)
  Webhook:   POST https://ups.alchemydev.io/api/webhooks/leads  (live, fail-closed)
  Body:      { source*, companyName*, contactName?, contactEmail?, notes?, submittedAt? }
  Responses: 201 created · 200 deduped · 400 · 401 bad/missing bearer ·
             422 unknown source · 429 rate-limited · 503 not configured
  Resolution: source "obsidian-quant-web" → the CRM's "Obsidian" project
             (leadSourceKey already set in prod; a real submission returns 201).
  Shared secret env var:  LEAD_INTAKE_SECRET
  >> THE SECRET VALUE ALREADY EXISTS ON THIS SAME VPS at
     /var/www/alchemydev-crm/.env  — copy it FILE-TO-FILE server-side into the
     obsidian nginx secret snippet. NEVER print, echo, paste, commit, or log it.
  Verified from the CRM: no/bad bearer→401, unknown source→422, real
  obsidian-quant-web→201 + duplicate→200. The contract recap also lives in this
  repo at docs/crm-lead-intake-part3-cli-prompt.md.

THE BOX (same VPS as the CRM)
  SSH:  ssh -i ~/.ssh/abedubas_vps root@76.13.22.110
  Debian-style nginx: vhosts in /etc/nginx/sites-available (+ sites-enabled
  symlinks), snippets in /etc/nginx/snippets, http{}-level includes via nginx.conf.
  Obsidian vhosts:  obsidianquantgroup.com  (PROD — server_name
  obsidianquantgroup.com www.obsidianquantgroup.com)  and  obsidian.abedubas.dev
  (STAGING).  Webroot: /var/www/obsidian-quant.
  NOTE: BOTH obsidian vhosts already have .bak files stamped today (2026-07-16) —
  READ the current vhost AND its .bak before editing; something touched them
  recently. No lead snippet exists in /etc/nginx/snippets yet.
  An existing "yahoo_proxy" is already wired on this box exactly the way you're
  about to wire "lead_proxy" — MIRROR it (same server-block include style, same
  http{} zone location). Your repo's deploy/nginx-yahoo-proxy.conf + DEPLOY.md are
  the canonical pattern.

STEP 1 — MERGE + DEPLOY (prod change: confirm with the user first)
  Merge PR #24 (feat/lead-intake-proxy) into main. The repo remote is owned by
  akosiArvin081596 — you may need `gh auth switch` to that account to merge, then
  switch back to the default. After merge, deploy the SPA per THIS repo's own
  process (DEPLOY.md / CI) and confirm the new toCrmPayload → /api/lead code is live.

STEP 2 — WIRE NGINX (do PROD obsidianquantgroup.com; staging optional)
  a) Read first:  cat the vhost and its .bak. Understand it before editing.
  b) Create the root-only secret snippet WITHOUT ever printing the value:
       SECRET="$(grep -m1 '^LEAD_INTAKE_SECRET=' /var/www/alchemydev-crm/.env | cut -d= -f2-)"
       printf 'set $lead_intake_secret "%s";\n' "$SECRET" > /etc/nginx/snippets/obsidian-lead-secret.conf
       chmod 600 /etc/nginx/snippets/obsidian-lead-secret.conf
       unset SECRET
     Sanity-check only its LENGTH (must be 64), never its value:
       awk -F= '/^LEAD_INTAKE_SECRET=/{print length($2)}' /var/www/alchemydev-crm/.env
  c) Inside the obsidianquantgroup.com server{} block, include the secret snippet
     (must be in scope BEFORE the location that uses $lead_intake_secret) and the
     lead-proxy location from your repo's deploy/nginx-lead-proxy.conf — mirroring
     how yahoo_proxy is included.
  d) Install the lead_proxy rate-limit zone at http{} scope
     (limit_req_zone $binary_remote_addr zone=lead_proxy:10m rate=20r/m;) wherever
     the existing yahoo_proxy zone lives —  grep -rl 'zone=yahoo_proxy' /etc/nginx
     — and add lead_proxy alongside it.
  e)  nginx -t   must pass. An undefined $lead_intake_secret MUST fail -t
     (fail-closed) — if it does, fix the include scope, never hardcode the secret.
     Then reload (prod change: confirm):  systemctl reload nginx

STEP 3 — SMOKE TEST (non-polluting — proves the whole chain, creates NO lead)
  curl -sS -o /dev/null -w '%{http_code}\n' -X POST https://obsidianquantgroup.com/api/lead \
    -H 'content-type: application/json' -d '{"source":"__nginx_wiring_probe__","companyName":"Probe Co"}'
  EXPECT 422 → nginx injected the bearer, the CRM accepted it, and resolved past
  auth to an unknown source, all WITHOUT creating a lead. Diagnose otherwise:
    401 → bearer not injected (secret file wrong / not in scope)
    502/504 → proxy_pass / SSL-SNI problem
  Also confirm a non-POST to /api/lead is denied (405/403) per the POST-only guard.
  DO NOT probe with source "obsidian-quant-web" — that creates a REAL lead in the
  CRM's Obsidian project. The 422 probe is sufficient proof.

GUARDRAILS
  - The secret only ever moves file→file on the box. Never print/paste/commit/log it.
  - Don't touch the CRM side; it's live and verified.
  - Merge and nginx reload are prod changes — confirm with the user before each.

HAND BACK
  Report: whether #24 was merged + SPA deployed; the exact files you created/edited
  on the box (secret snippet, vhost include, ratelimit file); the `nginx -t` result;
  the /api/lead smoke-test status code; and any deviation from the above.
```

## Short version (copy-paste)

```text
Finish shipping the CRM website-lead intake — obsidian side — per
docs/crm-lead-intake-part4-deploy-prompt.md. In short: merge PR #24
(feat/lead-intake-proxy) + deploy the SPA, then wire this VPS's nginx
(ssh -i ~/.ssh/abedubas_vps root@76.13.22.110). Read the obsidianquantgroup.com
vhost AND its today-dated .bak first. Create root-only
/etc/nginx/snippets/obsidian-lead-secret.conf by copying LEAD_INTAKE_SECRET
FILE-TO-FILE from /var/www/alchemydev-crm/.env (NEVER print it); include it +
deploy/nginx-lead-proxy.conf inside the obsidianquantgroup.com server block,
mirroring the existing yahoo_proxy; add the lead_proxy rate-limit zone at http{}
scope beside yahoo_proxy's. nginx -t (an undefined $lead_intake_secret must fail
it — fail-closed), reload, then smoke-test: POST /api/lead with
source "__nginx_wiring_probe__" must return 422 (proves bearer injection without
creating a lead). Don't touch the CRM; confirm before the prod merge + reload.
```
