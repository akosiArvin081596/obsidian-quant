/** Parsed strategic-allocation request payload for email + CRM handoff. */
export type ContactSubmission = {
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

// NEXT_PUBLIC_* vars are inlined by Next only when referenced statically as
// `process.env.NEXT_PUBLIC_X`; a dynamic `process.env[key]` lookup is left
// as-is and reads an empty stub in the browser bundle, so overrides would
// silently never apply client-side.
const cleaned = (value: string | undefined) => value?.trim() || undefined;

/** Inbox for strategic allocation requests — works with zero env config. */
export const CONTACT_INBOX =
  cleaned(process.env.NEXT_PUBLIC_CONTACT_INBOX) ||
  "access@obsidianquantgroup.com";

/**
 * CRM lead webhook. Defaults to the SAME-ORIGIN `/api/lead` proxy
 * (deploy/nginx-lead-proxy.conf), which injects the bearer secret server-side so
 * it's never in the client bundle — `connect-src 'self'` already allows it.
 * Override with NEXT_PUBLIC_CRM_WEBHOOK_URL only to point at a different collector (then
 * add that origin to the CSP connect-src).
 */
export const CRM_WEBHOOK_URL =
  cleaned(process.env.NEXT_PUBLIC_CRM_WEBHOOK_URL) ||
  "/api/lead";

/**
 * Email delivery endpoint. Default FormSubmit AJAX — no .env / Vercel secrets needed.
 * Owner may override with NEXT_PUBLIC_CONTACT_ENDPOINT.
 */
export const CONTACT_ENDPOINT =
  cleaned(process.env.NEXT_PUBLIC_CONTACT_ENDPOINT) ||
  `https://formsubmit.co/ajax/${CONTACT_INBOX}`;

export const parseContactForm = (form: FormData): ContactSubmission => {
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const profile = String(form.get("profile") ?? "").trim();
  const profileOther = String(form.get("profileOther") ?? "").trim();
  const note = String(form.get("note") ?? "").trim();
  // Preserve the raw honeypot value (no trim) so any bot input still trips FormSubmit's drop.
  const honeypot = String(form.get("_honey") ?? "");

  return {
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
  const subject = `Institutional inquiry — ${profileLabel(submission)}`;
  const body = [
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

/** Combined free-text "notes" for the CRM lead: the counterparty profile plus the
 *  briefing note (the CRM stores a single notes field). Capped to the CRM's
 *  5000-char limit so an overlong note can't trip its validation (a 400). */
const crmNotes = (submission: ContactSubmission): string => {
  const parts = [`Counterparty profile: ${profileLabel(submission)}`];
  if (submission.note) parts.push(`Briefing notes: ${submission.note}`);
  return parts.join("\n\n").slice(0, 5000);
};

/**
 * CRM ProjectLead payload — matches the alchemydev-crm `POST /api/webhooks/leads`
 * contract EXACTLY: source, companyName, contactName?, contactEmail?, notes?,
 * submittedAt?. Posted same-origin to /api/lead, where nginx injects the bearer
 * secret. Blank optional fields are omitted (undefined → dropped by
 * JSON.stringify), which the CRM treats as absent. `submittedAt` is an ISO-8601
 * instant (Date.toISOString → trailing Z), accepted by the CRM's datetime check.
 *
 * The Institutional Entity field was removed from the form (it overlapped with
 * Counterparty Profile), so `companyName` — required by the CRM contract — now
 * carries the counterparty profile label, which is always present.
 */
export const toCrmPayload = (submission: ContactSubmission) => ({
  source: submission.source,
  companyName: profileLabel(submission),
  contactName: submission.name || undefined,
  contactEmail: submission.email || undefined,
  notes: crmNotes(submission),
  submittedAt: submission.submittedAt,
});

/** Email-service payload (FormSubmit-compatible). */
export const toEmailPayload = (submission: ContactSubmission) => ({
  _subject: `Institutional inquiry — ${profileLabel(submission)}`,
  _template: "table",
  _captcha: "false",
  // Honeypot passthrough: FormSubmit silently drops any submission where _honey is non-empty.
  _honey: submission.honeypot,
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

  if (!submission.name || !submission.email || !submission.profile) {
    return { ok: false, error: "Please complete all required fields." };
  }
  if (isOthersProfile(submission.profile) && !submission.profileOther) {
    return { ok: false, error: "Please explain your counterparty profile." };
  }

  // CRM lead webhook (same-origin /api/lead by default) — a best-effort secondary
  // channel. Fire it detached and self-handle its rejection so a CRM failure can
  // never double-send the lead or gate the result. The email send below is the
  // sole source of truth.
  if (CRM_WEBHOOK_URL) {
    void fetch(CRM_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(toCrmPayload(submission)),
      signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`CRM webhook failed (${res.status})`);
      })
      .catch((err) => console.warn("CRM webhook failed", err));
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
