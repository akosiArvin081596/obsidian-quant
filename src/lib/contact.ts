/** Parsed strategic-allocation request payload for email + CRM handoff. */
export type ContactSubmission = {
  entity: string;
  name: string;
  email: string;
  profile: string;
  profileOther: string;
  note: string;
  /** FormSubmit honeypot — empty for humans; bots fill it and FormSubmit drops the send. */
  honeypot: string;
  submittedAt: string;
  source: "obsidian-quant-web";
  inbox: string;
};

export const CONTACT_PROFILES = [
  "Sovereign Wealth Fund",
  "Family Office",
  "Institutional Allocator",
  "Others",
] as const;

export type ContactProfile = (typeof CONTACT_PROFILES)[number];

export const isOthersProfile = (profile: string) =>
  profile.trim().toLowerCase() === "others";

/** Inbox for strategic allocation requests — works with zero env config. */
export const CONTACT_INBOX =
  (import.meta.env.VITE_CONTACT_INBOX as string | undefined)?.trim() ||
  "access@obsidianquantgroup.com";

/**
 * Best-effort CRM lead endpoint. Defaults to same-origin `/api/lead` — the nginx
 * proxy (deploy/nginx-lead-proxy.conf) injects the bearer secret server-side and
 * forwards to the CRM webhook, so no secret or cross-origin call ships in the
 * client bundle and connect-src stays 'self'. The deploy owner may override with
 * VITE_CRM_WEBHOOK_URL (if that override is cross-origin, its origin must be added
 * to connect-src in both CSPs — see DEPLOY.md).
 */
export const CRM_WEBHOOK_URL =
  (import.meta.env.VITE_CRM_WEBHOOK_URL as string | undefined)?.trim() ||
  "/api/lead";

/**
 * Email delivery endpoint. Default FormSubmit AJAX — no .env / Vercel secrets needed.
 * Owner may override with VITE_CONTACT_ENDPOINT.
 */
export const CONTACT_ENDPOINT =
  (import.meta.env.VITE_CONTACT_ENDPOINT as string | undefined)?.trim() ||
  `https://formsubmit.co/ajax/${CONTACT_INBOX}`;

export const parseContactForm = (form: FormData): ContactSubmission => {
  const entity = String(form.get("entity") ?? "").trim();
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const profile = String(form.get("profile") ?? "").trim();
  const profileOther = String(form.get("profileOther") ?? "").trim();
  const note = String(form.get("note") ?? "").trim();
  // Preserve the raw honeypot value (no trim) so any bot input still trips FormSubmit's drop.
  const honeypot = String(form.get("_honey") ?? "");

  return {
    entity,
    name,
    email,
    profile,
    profileOther,
    note,
    honeypot,
    submittedAt: new Date().toISOString(),
    source: "obsidian-quant-web",
    inbox: CONTACT_INBOX,
  };
};

export const profileLabel = (submission: ContactSubmission) => {
  if (isOthersProfile(submission.profile) && submission.profileOther) {
    return `Others — ${submission.profileOther}`;
  }
  return submission.profile;
};

/** Render a mailto: draft from an already-parsed submission (single source of truth). */
const mailtoFromSubmission = (
  recipient: string,
  submission: ContactSubmission,
): string => {
  const subject = `Institutional inquiry — ${submission.entity}`;
  const body = [
    `Entity: ${submission.entity}`,
    `Name: ${submission.name}`,
    `Reply email: ${submission.email}`,
    `Counterparty profile: ${profileLabel(submission)}`,
    "",
    "Briefing notes:",
    submission.note || "Not provided",
  ].join("\n");

  return `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

export const buildContactMailto = (recipient: string, form: FormData): string =>
  mailtoFromSubmission(recipient, parseContactForm(form));

/**
 * Fold the counterparty profile (incl. the "Others — …" explanation) and the
 * freeform briefing into the CRM's single `notes` field — the ProjectLead model
 * has no dedicated profile column, so this preserves that context inline.
 */
const crmNotes = (submission: ContactSubmission): string => {
  const profileLine = `Counterparty profile: ${profileLabel(submission)}`;
  return submission.note ? `${profileLine}\n\n${submission.note}` : profileLine;
};

/**
 * CRM ProjectLead payload — the proposed webhook contract from
 * docs/crm-lead-intake-brief.md (Part 2 field-mapping table). Posted to the
 * same-origin /api/lead proxy, which forwards to CRM POST /api/webhooks/leads.
 *
 * TODO(crm-contract): these field NAMES (source/companyName/contactName/
 * contactEmail/notes/submittedAt) are the alchemydev-crm engineer's *proposed*
 * Zod shape and may shift on hand-back — reconcile with the CRM's confirmed
 * request contract before go-live. `status` is intentionally omitted: the CRM
 * sets ProjectLead.status = NEW server-side.
 */
export const toCrmPayload = (submission: ContactSubmission) => ({
  source: submission.source, // "obsidian-quant-web" — CRM maps this to the Obsidian project
  companyName: submission.entity, // required (institutional entity)
  contactName: submission.name,
  contactEmail: submission.email,
  notes: crmNotes(submission),
  submittedAt: submission.submittedAt,
});

/** Email-service payload (FormSubmit-compatible). */
export const toEmailPayload = (submission: ContactSubmission) => ({
  _subject: `Institutional inquiry — ${submission.entity}`,
  _template: "table",
  _captcha: "false",
  // Honeypot passthrough: FormSubmit silently drops any submission where _honey is non-empty.
  _honey: submission.honeypot,
  entity: submission.entity,
  name: submission.name,
  email: submission.email,
  profile: profileLabel(submission),
  note: submission.note || "Not provided",
  submittedAt: submission.submittedAt,
});

export type SubmitContactResult =
  | { ok: true; mailtoFallback?: false }
  | { ok: true; mailtoFallback: true; mailto: string }
  | { ok: false; error: string };

/**
 * End-to-end handoff: email inbox + optional CRM webhook.
 * Never stores or transmits mailbox passwords — auth belongs on the server/service.
 */
export const submitContactRequest = async (
  form: FormData,
  signal?: AbortSignal,
): Promise<SubmitContactResult> => {
  const submission = parseContactForm(form);

  if (!submission.entity || !submission.name || !submission.email || !submission.profile) {
    return { ok: false, error: "Please complete all required fields." };
  }
  if (isOthersProfile(submission.profile) && !submission.profileOther) {
    return { ok: false, error: "Please explain your counterparty profile." };
  }

  // Best-effort CRM push through the same-origin /api/lead proxy, which injects
  // the bearer secret server-side and forwards to the CRM webhook. Fire it
  // detached and swallow EVERY outcome: the proxy may not be deployed yet
  // (→ same-origin 404, an expected state while this is a draft) or the CRM may
  // be down, and neither may gate the result, double-send the lead, or surface a
  // noisy console error. fetch only rejects on network/abort — a non-2xx resolves
  // and is ignored the same way. The email send below is the sole source of truth.
  if (CRM_WEBHOOK_URL) {
    void fetch(CRM_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(toCrmPayload(submission)),
      signal,
    }).catch(() => {
      // Swallowed by design — see above. No-op.
    });
  }

  try {
    const res = await fetch(CONTACT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(toEmailPayload(submission)),
      signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `Inbox delivery failed (${res.status})`);
    }
    return { ok: true };
  } catch (err) {
    // Email delivery (the gate) failed → keep the lead path alive via mailto draft,
    // reusing the single parsed submission so there's no re-parse / timestamp drift.
    const mailto = mailtoFromSubmission(CONTACT_INBOX, submission);
    console.warn("Contact pipeline fell back to mailto:", err);
    return { ok: true, mailtoFallback: true, mailto };
  }
};
