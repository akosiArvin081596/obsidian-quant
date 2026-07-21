import { describe, expect, it } from "vitest";
import { BRAND, CONTACT } from "./site";

/**
 * The post-submit confirmation is CONTRACTUAL copy from the client's spec (§4.1),
 * not editorial text, so it is asserted verbatim here.
 *
 * The one piece of significant typography — the en dash — is asserted through a
 * \u escape rather than a literal character. That is deliberate: no assertion in
 * this file depends on a byte that an editor, a locale, or a "smart quotes" pass
 * could rewrite, so the test cannot drift in lockstep with the copy it guards.
 */
/** U+2013. Named so the assertions below stay pure ASCII and unambiguous. */
const EN_DASH = "\u2013";

describe("CONTACT.confirmation — client spec 4.1", () => {
  const { eyebrow, heading, body, spam } = CONTACT.confirmation;

  it("matches the four spec lines verbatim", () => {
    expect(eyebrow).toBe("REQUEST RECEIVED");
    expect(heading).toBe("Your request has been logged.");
    expect(body).toBe(
      "Thank you for your interest in Obsidian. A member of our team will review " +
        `your submission and follow up within 1${EN_DASH}2 business days to schedule a ` +
        "brief discovery call.",
    );
    expect(spam).toBe(
      "Please check your inbox, and your spam folder just in case, for our response.",
    );
  });

  it('keeps the EN DASH (U+2013) in "1-2 business days"', () => {
    expect(body).toContain(`1${EN_DASH}2 business days`);
    // An ASCII hyphen here is the exact regression this guards: it survives review
    // because it is visually near-identical, and it diffs against the client's doc.
    expect(body).not.toContain("1-2");
  });

  it("stores the eyebrow already uppercase, not just CSS-uppercased", () => {
    // Tailwind's `uppercase` is presentational; the browser copies SOURCE text.
    // A client QA-ing the page by copy-paste must get "REQUEST RECEIVED".
    expect(eyebrow).toBe(eyebrow.toUpperCase());
  });

  it("ends at the spam-folder line", () => {
    // The spec has no fifth line. A "next step" / inbox sign-off appended here
    // is what this rewrite removed; keep the panel closed to additions.
    expect(Object.keys(CONTACT.confirmation)).toEqual([
      "eyebrow",
      "heading",
      "body",
      "spam",
    ]);
  });
});

describe("CONTACT.fields — entity vs. profile", () => {
  it("labels the free-text field as the entity and the dropdown as the profile", () => {
    // The spec's internal template reads "Institutional Entity: [Entity]" — the
    // ORGANISATION. The category dropdown is a separate question.
    expect(CONTACT.fields.entity).toBe("Institutional Entity");
    expect(CONTACT.fields.profile).toBe("Counterparty Profile");
  });

  it("asks the entity field for a legal name, never for a category", () => {
    // Regression guard: a placeholder naming the dropdown's own options
    // ("e.g. Sovereign Wealth Fund / Family Office") is what made this field look
    // redundant and got it deleted once already.
    expect(CONTACT.fields.entityPlaceholder).toMatch(/legal name/i);
    expect(CONTACT.fields.entityPlaceholder).not.toMatch(
      /sovereign wealth fund|family office/i,
    );
  });
});

describe("BRAND — entity relationship (A3)", () => {
  // Copy the investor reads: Obsidian Quant Group is the investment arm; the fund vehicle on
  // the public offering documents is Strike Point Capital Fund I LLC. Locked verbatim here the
  // same way CONTACT.confirmation is — final wording pending Deshorn's approval.
  it("names the fund's legal entity as Strike Point Capital Fund I LLC", () => {
    expect(BRAND.legalEntity).toBe("Strike Point Capital Fund I LLC");
  });

  it("states the relationship in the approved wording, verbatim", () => {
    expect(BRAND.relationship).toBe(
      "Obsidian Quant Group operates as the investment arm of Strike Point Capital Fund I LLC.",
    );
  });

  it("keeps the sentence and the legal-entity name in agreement", () => {
    expect(BRAND.relationship).toContain(BRAND.legalEntity);
    expect(BRAND.relationship).toContain(BRAND.name); // "Obsidian Quant Group"
    expect(BRAND.relationship).toContain("investment arm");
  });

  it("does not carry the retired fund mismatch", () => {
    // "Obsidian Quant Group Fund I, L.P." was the wrong vehicle name; guard its return.
    expect(BRAND.relationship).not.toContain("L.P.");
    expect(BRAND.legalEntity).not.toContain("Obsidian");
  });
});
