import { describe, expect, it } from "vitest";
import { buildContactMailto } from "./contact";

describe("buildContactMailto", () => {
  it("encodes the inquiry without claiming it was submitted", () => {
    const form = new FormData();
    form.set("entity", "Acme & Partners");
    form.set("email", "allocations@example.com");
    form.set("profile", "Family Office");
    form.set("note", "Please send terms.\nSingapore mandate.");

    const result = buildContactMailto("contact@example.com", form);
    const url = new URL(result);

    expect(url.protocol).toBe("mailto:");
    expect(url.pathname).toBe("contact@example.com");
    expect(url.searchParams.get("subject")).toBe(
      "Institutional inquiry — Acme & Partners",
    );
    expect(url.searchParams.get("body")).toContain(
      "Reply email: allocations@example.com",
    );
    expect(url.searchParams.get("body")).toContain("Singapore mandate.");
  });

  it("uses an explicit placeholder when briefing notes are empty", () => {
    const form = new FormData();
    form.set("entity", "Northstar");
    form.set("email", "team@example.com");
    form.set("profile", "Institutional Allocator");

    const result = buildContactMailto("contact@example.com", form);

    expect(new URL(result).searchParams.get("body")).toContain(
      "Briefing notes:\nNot provided",
    );
  });
});
