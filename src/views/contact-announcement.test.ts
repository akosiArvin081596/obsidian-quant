import { describe, expect, it } from "vitest";
import { CONTACT } from "../content/site";
import {
  contactAnnouncement,
  FALLBACK_COPY,
  PANEL_FOCUS_LABEL,
  SUBMITTING_ANNOUNCEMENT,
} from "./contact-announcement";

/** The wording Contact.tsx passes as `message` on the mailto arm. */
const FALLBACK_MESSAGE =
  "We prepared a backup email draft because the secure intake service did not confirm delivery.";

describe("contactAnnouncement", () => {
  it("stays silent until something has happened", () => {
    expect(contactAnnouncement("idle", "")).toBe("");
  });

  it("speaks every §4.1 confirmation line, in panel order, on success", () => {
    const spoken = contactAnnouncement("success", "");
    const { heading, body, spam } = CONTACT.confirmation;

    expect(spoken).toContain(heading);
    expect(spoken).toContain(body);
    expect(spoken).toContain(spam);
    expect(spoken.indexOf(body)).toBeGreaterThan(spoken.indexOf(heading));
    expect(spoken.indexOf(spam)).toBeGreaterThan(spoken.indexOf(body));
    // Read from the constants, not retyped: the contractual en dash comes along.
    expect(spoken).toContain("1–2 business days");
  });

  /**
   * The load-bearing rule. On this arm the lead was NOT delivered — only a
   * mailto draft was prepared — so speaking §4.1 would tell a screen-reader
   * user the exact opposite of what happened.
   */
  it("never speaks the delivered-confirmation on the mailto fallback arm", () => {
    const spoken = contactAnnouncement("fallback", FALLBACK_MESSAGE);

    expect(spoken).toBe(
      `Action Required. Finish sending the backup email. ${FALLBACK_MESSAGE}`,
    );
    expect(spoken).not.toContain("has been logged");
    expect(spoken).not.toContain(CONTACT.confirmation.heading);
    expect(spoken).not.toContain(CONTACT.confirmation.body);
    expect(spoken).not.toContain(CONTACT.confirmation.spam);
  });

  it("keeps the fallback panel and the fallback announcement on one wording", () => {
    // Both come from FALLBACK_COPY, so the panel cannot say "action required"
    // while the announcement says something softer.
    const spoken = contactAnnouncement("fallback", FALLBACK_MESSAGE);
    expect(spoken).toContain(FALLBACK_COPY.eyebrow);
    expect(spoken).toContain(FALLBACK_COPY.heading);
  });

  it("speaks the error text so a rejected submit is not silent", () => {
    expect(
      contactAnnouncement("error", "Please complete all required fields."),
    ).toBe("Please complete all required fields.");
  });

  /**
   * The panel takes focus when it replaces the form, so this label is spoken
   * too — just ahead of whatever the live region then says. It has to stay
   * neutral on BOTH counts: it must not claim delivery (the mailto arm delivered
   * nothing), and it must not restate the §4.1 copy (that would be the
   * double-speak the single hoisted region exists to avoid).
   */
  it("keeps the focused panel's name neutral and free of the confirmation copy", () => {
    const { heading, body, spam } = CONTACT.confirmation;
    for (const line of [heading, body, spam]) {
      expect(PANEL_FOCUS_LABEL).not.toContain(line);
    }
    expect(PANEL_FOCUS_LABEL).not.toMatch(/logged|received|sent|delivered/i);
  });

  it("announces progress while the request is in flight", () => {
    expect(contactAnnouncement("submitting", "")).toBe("Submitting your request…");
    expect(SUBMITTING_ANNOUNCEMENT).toBe("Submitting your request…");
  });
});
