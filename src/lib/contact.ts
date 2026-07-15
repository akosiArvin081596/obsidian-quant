/** Parsed strategic-allocation request payload for email + CRM handoff. */
export type ContactSubmission = {
  entity: string;
  name: string;
  email: string;
  profile: string;
  profileOther: string;
  note: string;
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

/** Optional CRM webhook — only when the deploy owner sets VITE_CRM_WEBHOOK_URL. */
export const CRM_WEBHOOK_URL =
  (import.meta.env.VITE_CRM_WEBHOOK_URL as string | undefined)?.trim() || "";

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

  return {
    entity,
    name,
    email,
    profile,
    profileOther,
    note,
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

export const buildContactMailto = (recipient: string, form: FormData): string => {
  const submission = parseContactForm(form);
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

/** CRM-oriented JSON payload (flat fields for Zapier / Make / sheets). */
export const toCrmPayload = (submission: ContactSubmission) => ({
  lead_source: submission.source,
  submitted_at: submission.submittedAt,
  institutional_entity: submission.entity,
  name: submission.name,
  corporate_email: submission.email,
  counterparty_profile: submission.profile,
  counterparty_profile_other: submission.profileOther || null,
  counterparty_profile_display: profileLabel(submission),
  briefing_notes: submission.note || null,
  notify_inbox: submission.inbox,
  status: "new",
});

/** Email-service payload (FormSubmit-compatible). */
export const toEmailPayload = (submission: ContactSubmission) => ({
  _subject: `Institutional inquiry — ${submission.entity}`,
  _template: "table",
  _captcha: "false",
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

  const crmPromise = CRM_WEBHOOK_URL
    ? fetch(CRM_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(toCrmPayload(submission)),
        signal,
      }).then(async (res) => {
        if (!res.ok) throw new Error(`CRM webhook failed (${res.status})`);
      })
    : Promise.resolve();

  const emailPromise = fetch(CONTACT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(toEmailPayload(submission)),
    signal,
  }).then(async (res) => {
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `Inbox delivery failed (${res.status})`);
    }
  });

  try {
    await Promise.all([emailPromise, crmPromise]);
    return { ok: true };
  } catch (err) {
    // Network / service issues → keep the lead path alive via mailto draft.
    const mailto = buildContactMailto(CONTACT_INBOX, form);
    console.warn("Contact pipeline fell back to mailto:", err);
    return { ok: true, mailtoFallback: true, mailto };
  }
};
