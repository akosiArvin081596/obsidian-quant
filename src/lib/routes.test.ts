import { describe, expect, it } from "vitest";
import { isActivePath, normalizePathname, toPublicHref } from "./routes";

describe("toPublicHref", () => {
  it("adds a trailing slash to public page paths", () => {
    expect(toPublicHref("/strategy")).toBe("/strategy/");
    expect(toPublicHref("/firm/")).toBe("/firm/");
  });

  it("preserves hash anchors after the trailing slash", () => {
    expect(toPublicHref("/strategy#mandate-coverage")).toBe("/strategy/#mandate-coverage");
    expect(toPublicHref("/architecture/#risk-discipline")).toBe("/architecture/#risk-discipline");
  });

  it("leaves root, mailto, and api paths alone", () => {
    expect(toPublicHref("/")).toBe("/");
    expect(toPublicHref("mailto:a@b.com")).toBe("mailto:a@b.com");
    expect(toPublicHref("/api/public/posts")).toBe("/api/public/posts");
  });
});

describe("normalizePathname / isActivePath", () => {
  it("treats slash and non-slash forms as the same route", () => {
    expect(normalizePathname("/strategy/")).toBe("/strategy");
    expect(isActivePath("/strategy/", "/strategy")).toBe(true);
  });
});
