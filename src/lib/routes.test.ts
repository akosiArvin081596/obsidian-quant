import { describe, expect, it } from "vitest";
import {
  ADMIN_HOME,
  isActivePath,
  normalizePathname,
  safeAdminNext,
  toPublicHref,
} from "./routes";

describe("safeAdminNext", () => {
  it("keeps a same-origin admin path", () => {
    expect(safeAdminNext("/admin/blog/123/")).toBe("/admin/blog/123/");
    expect(safeAdminNext("/admin")).toBe("/admin");
  });

  it("refuses destinations that leave the origin", () => {
    for (const hostile of [
      "https://evil.com",
      "http://evil.com",
      "//evil.com",
      "/\\evil.com",
      "javascript:alert(1)",
    ]) {
      expect(safeAdminNext(hostile), `${hostile} must not be honoured`).toBe(ADMIN_HOME);
    }
  });

  it("refuses same-origin paths outside the admin area, and empty input", () => {
    expect(safeAdminNext("/contact/")).toBe(ADMIN_HOME);
    expect(safeAdminNext(null)).toBe(ADMIN_HOME);
    expect(safeAdminNext("")).toBe(ADMIN_HOME);
  });
});

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
