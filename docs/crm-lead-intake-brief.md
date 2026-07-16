# CRM website-lead intake → project "Leads" tab — hand-off brief

**Purpose:** route the Obsidian Quant "Strategic Allocation" contact-form
submissions into **alchemydev-crm** as **project-scoped website leads**, shown on
the Obsidian **project's** detail page under a new **"Leads" tab**.

> ⚠️ **These are NOT AlchemyDev sales leads.** The CRM's existing `Lead` model +
> `/admin/leads` board is AlchemyDev's own sales pipeline (prospective AlchemyDev
> clients) — **leave it completely untouched.** The obsidian submissions are
> *investor inquiries to the client (Obsidian Quant Group)* and belong to the
> **Obsidian project**, not the sales funnel. This needs a **new, project-scoped
> model**, separate from `Lead`.

**Ownership:** the CRM endpoint + model + UI are built by the **alchemydev-crm**
Claude Code CLI (that repo owns its data model). The obsidian-quant side (this
repo) provides the secret-injecting nginx proxy + caller. This doc is the spec.

> Contains **no secrets** — `LEAD_INTAKE_SECRET` is referenced by name only; the
> value is shared out-of-band between the two projects.

---

## Current state

- The obsidian contact form currently delivers **only** to
  `access@obsidianquantgroup.com` via FormSubmit — no structured store on the
  marketing side.
- The CRM has a project detail page at `/admin/projects/[projectId]` with
  **Overview / Tasks / Client / Internal** tabs (rendered via a `<ProjectTabs>`
  component). We want to add a **"Leads"** tab there, scoped to that project,
  listing inbound website leads (newest first, row → detail).
- No existing model fits **project-scoped inbound website leads** — the sales
  `Lead` is a separate pipeline and is not project-linked — so a **new model** is
  needed.

---

## Part 1 — Prompt for the alchemydev-crm Claude Code CLI

Paste the block below to the CRM's CLI.

```text
GOAL
Route inbound website leads from the Obsidian Quant marketing site
(obsidianquantgroup.com — a separate repo) into THIS CRM as PROJECT-SCOPED leads,
displayed on the project detail page under a NEW "Leads" tab. Your scope is the
CRM side only: model + migration + inbound webhook + the project-page tab. Do NOT
touch the obsidian site — that's handled on our end.

HARD CONSTRAINT — DO NOT TOUCH THE SALES PIPELINE
Do NOT reuse or modify the existing sales `model Lead` (prisma/schema.prisma:754),
its enum LeadStatus, src/server/leads/actions.ts, or /admin/leads. That is
AlchemyDev's own separate sales pipeline (prospective AlchemyDev clients). These
Obsidian website submissions are investor inquiries that belong to the OBSIDIAN
PROJECT — a distinct, project-scoped concept that must be a NEW model.

1) NEW MODEL — ProjectLead (final name your call), PROJECT-SCOPED.
   Mirror the project-scoped relation pattern of `model Task`
   (prisma/schema.prisma:651 — projectId + relation, onDelete Cascade) and the
   soft-delete convention used across the schema. Suggested fields:
     id
     projectId     -> Project (onDelete Cascade)   [required]
     companyName   String                          [required]
     contactName   String?
     contactEmail  String?
     notes         String?   @db.Text
     source        String                          (e.g. "obsidian-quant-web")
     status        enum ProjectLeadStatus { NEW CONTACTED QUALIFIED ARCHIVED }
                   @default(NEW)                    [NEW enum, distinct from LeadStatus]
     submittedAt   DateTime?
     createdAt / updatedAt / deletedAt?  (soft delete)
   Add the back-relation on `model Project` (prisma/schema.prisma:324) and generate
   a migration. Follow the repo's RLS / db.ts query-extension / soft-delete rules.
   (These leads are viewed by internal staff on the project page; scope visibility
   the same way the project's Internal tab data is scoped.)

2) WEBHOOK — POST /api/webhooks/leads
   App Router route handler at src/app/api/webhooks/leads/route.ts; match the
   existing src/app/api/paypal/webhook + src/app/api/livekit/webhook for structure.
   - Auth: shared-secret bearer. Read LEAD_INTAKE_SECRET from env; require
     "Authorization: Bearer <secret>", compare CONSTANT-TIME; 401 on miss/mismatch.
     (The obsidian side calls this through a trusted server-side nginx proxy that
     injects the secret, so it's never client-exposed — you just enforce it.)
   - Project resolution: the payload carries a stable `source` key
     ("obsidian-quant-web"). Map source -> project. RECOMMENDED: add a unique
     nullable `Project.leadSourceKey` field and look the project up by it. This
     keeps CRM project ids out of the marketing site, and onboarding another site
     later = just set its source key on a project. Set leadSourceKey =
     "obsidian-quant-web" on the Obsidian project (data step / seed). If no project
     matches the source -> 422.
   - Validate body with Zod:
       source        string   required   (maps to a project)
       companyName   string   required   (2..200)
       contactName   string   optional   (..120)
       contactEmail  string   optional   (valid email)
       notes         string   optional   (..5000)
       submittedAt   string   optional   (ISO datetime)
   - Create the ProjectLead with projectId from the resolved project, status NEW,
     source + submittedAt persisted.
   - Audit: logActivity({ action: "project_lead.created", entityType:
     "project_lead", entityId: lead.id, projectId, metadata: { title: companyName,
     source } }). No user actor (webhook) — represent a system/webhook actor
     consistently with how the rest of the CRM records non-user activity.
   - Responses: 201 {ok:true,id} · 400 invalid body · 401 bad secret · 422 unknown
     source/project.
   - Abuse hardening (public-facing): rate-limit per IP + idempotency/dedup (skip a
     duplicate when the same projectId + contactEmail + companyName arrived within a
     short window) — the caller POSTs best-effort and may retry.

3) UI — add a "Leads" TAB to the project detail page.
   - src/app/admin/projects/[projectId]/page.tsx builds each tab's content and
     passes it to <ProjectTabs> (around line 496: tasks={...} client={...}
     internal={...}). Add a `leadsTab` built from
     prisma.projectLead.findMany({ where: { projectId }, orderBy: { createdAt:
     "desc" }, ... }) and pass `leads={leadsTab}`.
   - Find the ProjectTabs component (it renders the Overview/Tasks/Client/Internal
     TabsTrigger+TabsContent — likely src/components/project-tabs.tsx) and add a
     "Leads" trigger + content mirroring the existing Client/Internal tabs.
     Internal/staff-only, consistent with the other admin tabs.
   - List rows: companyName · contactName · contactEmail · status · createdAt,
     newest first; row -> a detail view (a modal, or a sub-route like
     /admin/projects/[projectId]/leads/[leadId] mirroring the existing
     tasks/[taskId] and tickets/[ticketId] sub-routes). Include a status control
     (NEW/CONTACTED/QUALIFIED/ARCHIVED) via a small server action — but a NEW one
     for ProjectLead; do NOT reuse the sales-lead actions.
   - Optional nice-to-have: a "Leads: N new" stat card on Overview (the stats array
     at page.tsx:497).

4) TESTS + CONVENTIONS
   vitest for the webhook (happy path, 401, 400, 422, dedup) and any new
   ProjectLead server action. Read AGENTS.md / CLAUDE.md and match the repo's
   route-handler / error / env / RLS conventions. Add LEAD_INTAKE_SECRET (and the
   leadSourceKey setup) to the env template + DEPLOYMENT.md. Run the repo's lint +
   typecheck + tests before finishing. Don't touch unrelated code, and especially
   not the sales Lead pipeline.

HAND BACK
Reply with: the final model + enum name and fields, the endpoint path + exact
request contract (so we shape our caller to match), how a project is resolved
(leadSourceKey vs. explicit projectId), the env var name, how to share
LEAD_INTAKE_SECRET, and any deviations.
```

---

## Part 2 — Architecture

**Secret stays server-side.** The obsidian site is a static SPA, so a secret in
the browser bundle would be exposed. nginx on our VPS injects it (same pattern as
the existing Yahoo quotes proxy):

```
browser POST  ->  same-origin /api/lead on obsidianquantgroup.com
                  (nginx adds  Authorization: Bearer <LEAD_INTAKE_SECRET>)
                  ->  proxies to CRM   POST /api/webhooks/leads
```

The secret lives in the **nginx config on the VPS**, never in the client bundle.
The two projects share `LEAD_INTAKE_SECRET` out-of-band.

**Project resolution (recommended):** obsidian sends `source: "obsidian-quant-web"`
(it already sets this in the contact submission). The CRM maps that to the Obsidian
project via a unique `Project.leadSourceKey`. No CRM id lives in the marketing site;
onboarding another site later = set its source key on a project.

**Field mapping** (obsidian contact form → CRM `ProjectLead`):

| obsidian contact form | → CRM `ProjectLead` |
|---|---|
| — (`source` key) | resolves `projectId` (→ Obsidian project) |
| `entity` (institutional entity) | `companyName` (required) |
| `name` | `contactName` |
| `email` (corporate email) | `contactEmail` |
| `profile` + `note` (briefing) | `notes` (combined) |
| — | `status = NEW` |
| `source`, `submittedAt` | persisted + audit metadata |

---

## Part 3 — Obsidian-side counterpart (this repo; after the CRM endpoint exists)

1. **nginx**: add a same-origin `POST /api/lead` proxy that injects
   `Authorization: Bearer <LEAD_INTAKE_SECRET>` and forwards to the CRM webhook —
   new repo-managed snippet under `deploy/`, wired into both vhosts like the
   existing includes.
2. **app**: shape `toCrmPayload` (`src/lib/contact.ts`) to the agreed contract (it
   already includes `source: "obsidian-quant-web"`) and post to same-origin
   `/api/lead`.
3. **CSP**: `connect-src` stays `'self'` (same-origin `/api/lead`) — no change
   needed.

---

## Open decisions to confirm before build

- **Model / enum name** — `ProjectLead` + `ProjectLeadStatus` (proposed).
- **Status set** — `NEW / CONTACTED / QUALIFIED / ARCHIVED` (proposed) vs. minimal.
- **Project resolution** — `Project.leadSourceKey` (recommended) vs. explicit
  `projectId` in the payload.
- **Detail view** — sub-route (`…/leads/[leadId]`) vs. modal.
- **Secret sharing** — how `LEAD_INTAKE_SECRET` is generated + exchanged.
