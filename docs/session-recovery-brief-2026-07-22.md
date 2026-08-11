# Session recovery brief — `3fef397b` (Jul 18–22, 2026)

> **Why this file exists.** The Claude Code session that did this work (`3fef397b-6f29-431f-9408-36f69038aa67`)
> was **not resumable** — its main transcript was never written to disk (only sidecar data survived), so it
> never appeared in `/resume`. This file is the durable, git-tracked reconstruction so the work can be picked
> up from anywhere, independent of Claude Code's transcript store. Reconstructed 2026-07-22 from the 139
> subagent metadata records, the 13-item task list, surviving tool outputs, and the commit trails of all three repos.

## What it was
A full-roster, multi-agent ("jarvis") build spanning **Jul 18 15:53 → Jul 22 09:12**, **139 subagents**,
executing the **"workflow-doc July-17"** plan end-to-end across **three repos**:

| Repo | Role | Branch |
|---|---|---|
| `obsidian-quant` | Marketing SPA — intake form, §4.1 confirmation, footer relationship copy | `feat/workflow-doc-july17` |
| `obsidian-quant-onboarding` | **The bulk** — regulated onboarding portal (investor profiles, sealed PII, e-sign, packets) | `feat/workflow-doc-july17` |
| `alchemydev-crm` | Lead intake → provisioning → staff notifications | `feat/workflow-doc-july17` → `feat/dox-assign-to-company` |

## The plan it worked (13 tracked tasks)
```
[x] 1.1  /admin shell, internal_staff role, staff invites
[x] 1.2+1.3  Full investor profile — sealed PII + PDF export
[x] 1.4  Kill the dead ends (investor + staff never see a screen with no next step)
[x] Ph2  Leads + approve inside the portal
[x] Ph3  Google Places autocomplete + E.164 phone
[x] Reconcile package-lock across the 3 parallel slices
[x] Green the 11 failing crm-provision tests
[x] Validate the unenforced Appendix B fields
[x] Close security findings M1, M2 + leads hardening
[x] Security follow-ups L1–L3
[x] Rename validateAndNormalizeContactAnswers
[ ] AML/KYC vendor integration          <-- deferred by decision (#23)
[ ] REMOVE the demo MFA bypass          <-- STILL OPEN (#30)  ⚠️ security-critical
```

## What shipped (safe in git across all three repos)
**Portal** (`obsidian-quant-onboarding`, ~30 commits): full profile + PDF export with attributed
PII-access audit pairs; `/admin` shell + `internal_staff` role; Google Places + E.164 questionnaire;
portal-native lead intake with in-process provisioning; server-side Appendix B validation; encrypted
document vault (view-in-browser, download-on-ask); **e-sign** — drawn-signature capture sealed to the
package, real PPM + Operating Agreement + a 4th binding Subscription Agreement loaded via a legal gate;
env-gated wire instructions with correct fund identity (A2/A3); human-readable `SPCF1-######` references;
per-client compliance packet PDF; registration notifications to internal staff (JNS, DMK); confirm-path
hardening (CAS on answers, cross-row race convergence); DB constraints on questionnaires/currency.

**CRM** (`alchemydev-crm`): immediate portal provisioning on approve (off the cron); per-tenant sender +
lead-email switch; outbox poison-row fix; mail security fixes (fail-closed, TLS, PII escaping); crons moved
off GitHub's scheduler onto the VPS; then a saved-contacts → **assign-to-company** feature with
org-isolation RLS.

**Marketing** (`obsidian-quant`): §4.1 confirmation copy + split name + Institutional Entity; a11y
live-region fixes; the Obsidian ↔ Strike Point Capital Fund I LLC footer/relationship copy; lead proxy
repointed to the portal.

## ⚠️ Open threads / where it left off
1. **`#30` — remove the demo MFA bypass.** An **env-gated staff MFA bypass** (portal commits `e505618`,
   hardened in `92b29ee`) was added *for the client demo* and is still in the code. **This is the one
   security-critical loose end — pull it once the walkthrough is done.**
2. **E-signature vendor decision — the literal last activity (Jul 22, 09:11–09:12).** Four research agents
   were comparing **Dropbox Sign (free tier + API), Zoho Sign, SignWell, BoldSign, and open-source options**
   — i.e. whether to replace the DIY drawn-signature pad with a real e-sign provider. **No decision was
   recorded before the session died** (its conclusions were in the lost transcript). Re-runnable.
3. **`#23` — AML/KYC integration**, deferred. Vendor research was done (SMB pricing, low-cost/open AML,
   what Reg D funds actually use) but no integration built.
4. Per project memory, the whole pipeline is **shipped but "running dark"** behind ordered gates before
   emails switch on.

## Lost vs. recoverable
- **Recovered here:** the plan, the full timeline, and what shipped (all code is committed across the three repos).
- **Genuinely lost:** the narrative transcript and the *conclusions* of the Jul-22 e-sign and AML research
  (they lived only in the never-written main transcript) — both are cleanly re-runnable.

## How to actually get resumable sessions going forward
`/resume` lists a session only when a top-level transcript exists at
`~/.claude/projects/<encoded-cwd>/<session-id>.jsonl` **and** the session is registered in
`~/.claude/sessions/`. Normal **interactive terminal** Claude Code runs (e.g. the concurrent home-dir
session `0d673c1b`) produce both and are resumable. The session that did this work produced neither —
sidecars only — which is why it vanished from `/resume`. To guarantee continuity regardless of transcript
mechanics, this brief is committed to the repo and a companion auto-loading memory
(`lost-session-3fef397b-recovery`) points at it.
