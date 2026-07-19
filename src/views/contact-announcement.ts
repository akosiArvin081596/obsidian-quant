import { CONTACT } from "../content/site";

/** Lifecycle of a strategic-allocation request, from the form's point of view. */
export type ContactStatus =
  | "idle"
  | "submitting"
  | "success"
  | "fallback"
  | "error";

/**
 * Copy for the mailto arm, single-sourced so the spoken text and the visible
 * panel cannot drift apart. This arm means the lead was NOT delivered, so it
 * carries its own wording rather than anything from §4.1.
 */
export const FALLBACK_COPY = {
  eyebrow: "Action Required",
  heading: "Finish sending the backup email.",
} as const;

/**
 * Accessible name of the confirmation panel, which takes focus when it replaces
 * the form. A screen reader speaks this on the focus move, so it is deliberately
 * NEUTRAL: it orients the user without asserting an outcome. It must stay free of
 * delivery wording — on the mailto arm nothing was delivered — and free of the
 * §4.1 copy, which the live region speaks a moment later and must not repeat.
 */
export const PANEL_FOCUS_LABEL = "Request status";

/** Spoken while the request is in flight — the button's "Submitting…" is visual only. */
export const SUBMITTING_ANNOUNCEMENT = "Submitting your request…";

/**
 * Delay before the live region's text is written.
 *
 * The region itself is already mounted (that is the point of hoisting it above
 * the form/panel toggle), but writing its text in the SAME commit that removes
 * the form hands assistive tech a subtree replacement to reason about instead
 * of a clean text insertion. One extra task tick keeps it unambiguous.
 */
export const ANNOUNCE_DELAY_MS = 150;

/**
 * What a screen reader should speak for a given form state.
 * An empty string means "say nothing": the region is cleared, and removals are
 * not announced under the default aria-relevant.
 */
export const contactAnnouncement = (
  status: ContactStatus,
  message: string,
): string => {
  switch (status) {
    case "submitting":
      return SUBMITTING_ANNOUNCEMENT;
    case "success": {
      // The §4.1 lines, verbatim and in panel order, read from the same
      // constants the panel renders — never a paraphrase of them.
      const { heading, body, spam } = CONTACT.confirmation;
      return [heading, body, spam].join(" ");
    }
    case "fallback":
      return [`${FALLBACK_COPY.eyebrow}.`, FALLBACK_COPY.heading, message]
        .filter(Boolean)
        .join(" ");
    case "error":
      return message;
    default:
      return "";
  }
};
