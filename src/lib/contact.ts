export const buildContactMailto = (recipient: string, form: FormData): string => {
  const entity = String(form.get("entity") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const profile = String(form.get("profile") ?? "").trim();
  const note = String(form.get("note") ?? "").trim();
  const subject = `Institutional inquiry — ${entity}`;
  const body = [
    `Entity: ${entity}`,
    `Reply email: ${email}`,
    `Counterparty profile: ${profile}`,
    "",
    "Briefing notes:",
    note || "Not provided",
  ].join("\n");

  return `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};
