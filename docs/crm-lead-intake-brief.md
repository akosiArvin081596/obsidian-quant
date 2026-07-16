# CRM lead-intake — hand-off brief

**Purpose:** route the Obsidian Quant "Strategic Allocation" contact-form
submissions into the **alchemydev-crm** as `Lead` records, so they appear in the
CRM's existing `/admin/leads` list.

**Ownership:** the CRM endpoint is built by the **alchemydev-crm** Claude Code CLI
(that repo owns its data model). The obsidian-quant side (this repo) provides the
secret-injecting nginx proxy + caller. This doc is the hand-off spec.

> This document contains **no secrets** — `LEAD_INTAKE_SECRET` is referenced by
> name only; the value is shared out-of-band between the two projects.

---

## Current state (why this is needed)

- The obsidian contact form currently delivers **only** to
  `access@obsidianquantgroup.com` via FormSubmit — there is **no database** and no
  structured lead store on the marketing side.
- The CRM **already** has a `Lead` model + pipeline + admin UI (`/admin/leads`),
  but leads can only be created through an internal, auth-gated server action
  (`createLead`, `requireInternal()`), used from the CRM's own UI.
- Gap: there is **no external/webhook ingestion** for leads, so the marketing
  form can't feed the CRM. This brief fills that gap.

---

## Part 1 — Prompt for the alchemydev-crm Claude Code CLI

Paste the block below to the CRM's CLI.

```text
CONTEXT
We're wiring the Obsidian Quant marketing site (obsidianquantgroup.com — a
separate repo) so its "Strategic Allocation" contact-form submissions land in
THIS CRM as Leads, visible in the existing /admin/leads list. Your scope is the
CRM side only: a secure inbound webhook that creates a Lead from an external
POST. Do NOT touch the obsidian site — that's handled on our end.

WHAT ALREADY EXISTS HERE (reuse, don't reinvent)
- model Lead — prisma/schema.prisma:754: companyName (required), contactName?,
  contactEmail?, notes?, value?, status (LeadStatus), ownerId?, wonProjectId?,
  soft-delete. Intentionally NOT tenant-scoped / no RLS ("prospects, pre-client")
  — so no org context is needed.
- enum LeadStatus { NEW QUALIFYING PROPOSAL WON LOST } — prisma/schema.prisma:745
- createLead — src/server/leads/actions.ts:22 — the pattern to mirror (Zod ->
  prisma.lead.create -> logActivity -> revalidatePath). NOTE: it's gated by
  requireInternal() (staff session). The webhook must NOT use that — the caller
  is an external site with no session.
- Existing webhook route handlers to match for structure/placement:
  src/app/api/paypal/webhook, src/app/api/livekit/webhook
- Helpers: prisma from @/lib/db, logActivity from @/lib/audit.

BUILD
1) POST /api/webhooks/leads  (App Router route handler:
   src/app/api/webhooks/leads/route.ts)
2) Auth = shared-secret bearer token. Read LEAD_INTAKE_SECRET from env; require
   header "Authorization: Bearer <secret>" and compare in CONSTANT TIME. Missing/
   invalid -> 401. (The obsidian side calls this through a trusted server-side
   nginx proxy that injects the secret, so it's never client-exposed — you just
   enforce it.)
3) Validate the JSON body with Zod:
      source        string   optional  (e.g. "obsidian-quant-web")
      companyName   string   required  (2..200)
      contactName   string   optional  (..120)
      contactEmail  string   optional  (valid email)
      notes         string   optional  (..5000)
      submittedAt   string   optional  (ISO datetime)
4) Create: prisma.lead.create({ data: { companyName, contactName,
   contactEmail: contactEmail || null, notes, status: "NEW" } }).
   Lead has no source/submittedAt columns — fold those into the audit metadata
   (and/or prepend a "Source: <source> · <submittedAt>" line into notes). Don't
   add columns unless you judge it warranted.
5) Audit: logActivity({ action: "lead.created", entityType: "lead",
   entityId: lead.id, metadata: { title: companyName, source } }). There's no
   user actor for a webhook — createLead passes actorId: user.id; decide how to
   represent a system/webhook actor consistently with how the rest of the CRM
   records non-user activity (a dedicated system user id, or a nullable actor).
6) Responses: 201 { ok:true, id } on success · 400 { ok:false, error } on
   invalid body · 401 on bad secret.
7) Abuse hardening (this endpoint is public-facing): rate-limit per IP, and add
   idempotency/dedup — skip creating a duplicate when the same contactEmail +
   companyName arrived within a short window — since the caller POSTs best-effort
   and may retry.
8) Tests: vitest covering happy path, 401 (bad secret), 400 (invalid body), and
   dedup if implemented. Run the repo's lint + typecheck + tests before finishing.

CONSTRAINTS
Read AGENTS.md / CLAUDE.md and follow the repo's conventions (route-handler
style, error handling, env access, the db.ts query-extension / soft-delete
rules). Add LEAD_INTAKE_SECRET to the env template + DEPLOYMENT.md. Don't touch
unrelated code. New leads must appear in the existing /admin/leads board
automatically once created.

HAND BACK
Reply with: the final endpoint path, the exact request contract (so we can shape
our caller to match), the env var name, the chosen secret value (or how to share
it), and any deviations from the above.
```

---

## Part 2 — Architecture & why a shared secret works with a static site

The obsidian site is a static SPA — a secret sent from the browser would be
visible in the JS bundle. So the secret is injected **server-side** by nginx on
our VPS (the same pattern already used for the Yahoo quotes proxy):

```
browser  POST  ->  same-origin /api/lead on obsidianquantgroup.com
                   (nginx adds  Authorization: Bearer <LEAD_INTAKE_SECRET>)
                   ->  proxies to CRM   POST /api/webhooks/leads
```

The secret lives in the **nginx config on the VPS**, never in the client bundle.
The two projects share `LEAD_INTAKE_SECRET` out-of-band.

**Field mapping** (obsidian contact form → CRM `Lead`):

| obsidian contact form | → CRM `Lead` |
|---|---|
| `entity` (institutional entity) | `companyName` (required) |
| `name` | `contactName` |
| `email` (corporate email) | `contactEmail` |
| `profile` + `note` (briefing) | `notes` (combined) |
| — | `status = NEW`, `value = null` |
| `source`, `submittedAt` | audit metadata / notes prefix |

---

## Part 3 — Obsidian-side counterpart (this repo — done after the CRM endpoint exists)

1. **nginx**: add a same-origin `POST /api/lead` proxy that injects
   `Authorization: Bearer <LEAD_INTAKE_SECRET>` and forwards to the CRM endpoint
   (secret in nginx config, not the bundle). New repo-managed snippet under
   `deploy/`, wired into both vhosts like the existing includes.
2. **app**: shape `toCrmPayload` (`src/lib/contact.ts`) to the agreed contract and
   point the submit at same-origin `/api/lead` (via `VITE_CRM_WEBHOOK_URL` or a
   fixed same-origin path).
3. **CSP**: `connect-src` stays `'self'` (same-origin `/api/lead`) — no external
   origin needed, so no CSP change. (If we ever call the CRM cross-origin instead,
   add its origin to `connect-src` per the note in `DEPLOY.md`.)

---

## Open decisions to confirm before build

- **Endpoint name** — `POST /api/webhooks/leads` (proposed).
- **Auth** — shared bearer secret via nginx injection (proposed) vs. a public
  Origin-allowlisted endpoint (simpler, weaker).
- **Dedup window** — e.g. skip same `contactEmail` + `companyName` within N
  minutes.
- **Secret sharing** — how `LEAD_INTAKE_SECRET` is generated and exchanged.
