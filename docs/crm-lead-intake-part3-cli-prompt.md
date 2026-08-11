# CRM lead intake — Part 3 (obsidian-side) CLI prompt

Counterpart to "Part 1 — Prompt for the alchemydev-crm CLI" in
[`crm-lead-intake-brief.md`](./crm-lead-intake-brief.md). This is the paste-ready
prompt for **this** repo's Claude Code CLI to implement the obsidian side of the
website-lead intake, with the **finalized CRM contract (as shipped)** baked in.

> **Status:** implemented on branch `feat/lead-intake-proxy` (PR #24). This doc is
> the spec-of-record — re-running the prompt should *reconcile / verify*, not
> duplicate.

## Finalized CRM contract (recap)

| | |
|---|---|
| Endpoint (via same-origin proxy) | `POST /api/lead` → `POST https://ups.alchemydev.io/api/webhooks/leads` |
| Auth | `Authorization: Bearer <LEAD_INTAKE_SECRET>` (constant-time on the CRM; injected by nginx, never sent by the browser) |
| Env var | `LEAD_INTAKE_SECRET` (shared out-of-band) |
| Body | `source`* (1–100), `companyName`* (2–200), `contactName?` (≤120), `contactEmail?` (email ≤200), `notes?` (≤5000), `submittedAt?` (ISO-8601 w/ offset) |
| Responses | `201 {ok,id}` · `200 {ok,id,deduplicated}` · `400` · `401` · `422` unknown source · `429` · `503` not configured |
| Project resolution | `source` → CRM's unique `Project.leadSourceKey = "obsidian-quant-web"` |

## Full prompt

```text
GOAL
Implement the OBSIDIAN side of the website-lead intake (Part 3 of
docs/crm-lead-intake-brief.md). Every Strategic-Allocation contact-form
submission must ALSO be delivered to the alchemydev-crm lead webhook as a
project-scoped lead, IN ADDITION to the existing FormSubmit email (which stays
the source of truth). The secret must never reach the browser bundle: the SPA
POSTs a SAME-ORIGIN /api/lead, and nginx injects the bearer server-side.
This is the obsidian repo ONLY — the CRM side is already built.

If any of this already exists (e.g. an open PR/branch), RECONCILE and verify it
matches the contract below rather than duplicating.

FINALIZED CRM CONTRACT (already shipped on the CRM side — match it EXACTLY)
  Endpoint (via the same-origin proxy):  POST /api/lead
    -> proxied to  POST https://ups.alchemydev.io/api/webhooks/leads
  Auth:  Authorization: Bearer <LEAD_INTAKE_SECRET>   (constant-time on the CRM;
         injected by nginx, never sent by the browser). Env var: LEAD_INTAKE_SECRET.
  Body (JSON):
    source        string  REQUIRED  1..100  -> resolves the target project
    companyName   string  REQUIRED  2..200
    contactName   string  optional  ..120
    contactEmail  string  optional  valid email, ..200
    notes         string  optional  ..5000
    submittedAt   string  optional  ISO-8601 WITH offset (Date.toISOString() -> "…Z" is valid)
  Responses:  201 {ok,id} created · 200 {ok,id,deduplicated} retry-within-window ·
    400 invalid body · 401 bad/missing secret · 422 unknown source · 429 rate-limited ·
    503 intake not configured.
  Project resolution:  `source` maps to a project via the CRM's unique
    Project.leadSourceKey = "obsidian-quant-web" (no CRM id in the payload).

BEFORE WRITING: read README.md, DEPLOY.md, src/lib/contact.ts (+ contact.test.ts),
and deploy/nginx-yahoo-proxy.conf / nginx-ratelimit.conf / nginx-security-headers.conf.
Match those conventions exactly — the yahoo proxy is the pattern to mirror.

1) PAYLOAD — reshape toCrmPayload (src/lib/contact.ts) to the contract above.
   Field mapping (per the brief's Part 2 table):
     entity  -> companyName (required)
     name    -> contactName
     email   -> contactEmail
     profile + note (briefing) -> notes  (combine into ONE string, e.g.
       "Counterparty profile: <label>\n\nBriefing notes: <note>"; cap at 5000)
     source (already "obsidian-quant-web") and submittedAt (ISO) -> passed through
   Omit blank optionals (undefined -> JSON.stringify drops them; CRM treats as absent).

2) TRANSPORT — default CRM_WEBHOOK_URL to the SAME-ORIGIN "/api/lead" (overridable
   via NEXT_PUBLIC_CRM_WEBHOOK_URL for a different collector). Keep the CRM post
   BEST-EFFORT / fire-and-forget: a CRM failure must never gate the result or
   double-send the email. Do NOT send an Authorization header from the browser.

3) NGINX PROXY — new deploy/nginx-lead-proxy.conf, mirroring nginx-yahoo-proxy.conf:
     location = /api/lead {  (exact match, POST-only: limit_except POST { deny all; })
       proxy_pass https://ups.alchemydev.io/api/webhooks/leads;  proxy_ssl_server_name on;
       proxy_set_header Authorization "Bearer $lead_intake_secret";  # OVERRIDE client's
       proxy_set_header Host ups.alchemydev.io; Content-Type/Accept json; Cookie "";
       forward X-Forwarded-For / X-Real-IP; strip the CRM's response headers and
       re-assert our security headers (add_header doesn't inherit); Cache-Control no-store;
       limit_req zone=lead_proxy burst=5 nodelay;
     }
   SECRET HANDLING (critical): $lead_intake_secret must come from a NON-committed,
   root-only file included in the server block (e.g. /etc/nginx/snippets/obsidian-lead-secret.conf
   with:  set $lead_intake_secret "…";  chmod 600). NEVER hardcode or commit the secret.
   Leaving it undefined must FAIL CLOSED (nginx -t errors "unknown variable").

4) RATE-LIMIT ZONE — add a lead_proxy zone to deploy/nginx-ratelimit.conf
   (limit_req_zone $binary_remote_addr zone=lead_proxy:10m rate=20r/m;). Same
   http{}-context install note as yahoo_proxy.

5) CSP — NO change needed: /api/lead is same-origin, covered by connect-src 'self'.
   Update the explanatory comments in nginx-security-headers.conf + index.html only.

6) DOCS — DEPLOY.md: wire the two vhost includes (secret include FIRST, then
   nginx-lead-proxy.conf) into BOTH vhosts, install the lead_proxy zone, document
   the root-only secret file, the CRM host, and a NON-polluting smoke test
   (an unknown `source` -> 422 proves proxy+secret without creating a lead).
   .env.example: note the same-origin default + the cross-origin CSP caveat.

7) TESTS + GATE — vitest for toCrmPayload (asserts the exact contract fields +
   folded notes + omitted-when-blank) and that the default target is same-origin
   /api/lead with NO browser Authorization header. Run vitest + `eslint .` +
   `npm run build` (`prisma generate && next build`) — all green. Don't touch
   unrelated code.

HAND BACK
Reply with: the final toCrmPayload field names, the default transport URL, the new
nginx include filename(s) + the exact non-committed secret-file path/variable, the
rate-limit zone name, whether CSP changed, and any deviations.
```

## Short version (copy-paste)

```text
Implement Part 3 (obsidian side) of the CRM website-lead intake per
docs/crm-lead-intake-part3-cli-prompt.md. In short: reshape toCrmPayload
(src/lib/contact.ts) to the CRM contract { source, companyName, contactName?,
contactEmail?, notes?, submittedAt? } and POST it same-origin to /api/lead (the
default CRM_WEBHOOK_URL), best-effort so it never gates the FormSubmit email. Add
deploy/nginx-lead-proxy.conf (mirror nginx-yahoo-proxy.conf) that POST-proxies
/api/lead to https://ups.alchemydev.io/api/webhooks/leads and injects
Authorization: Bearer $lead_intake_secret from a NON-committed root-only include —
never hardcode the secret. Add a lead_proxy rate-limit zone; CSP stays 'self'
(same-origin). Update DEPLOY.md + .env.example. This may already exist on branch
feat/lead-intake-proxy — verify it matches rather than duplicating. Run vitest +
eslint + `npm run build` before finishing.
```
