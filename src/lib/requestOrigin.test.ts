import { describe, expect, it } from "vitest";
import { SITE_URL } from "./seo";
import {
  CANONICAL_HOST,
  resolveHost,
  resolveProto,
  resolveRequestOrigin,
} from "./requestOrigin";

describe("CANONICAL_HOST", () => {
  // requestOrigin.ts cannot import SITE_URL without dragging the marketing copy
  // into the edge bundle, so the two are pinned together here instead.
  it("matches the host of SITE_URL", () => {
    expect(CANONICAL_HOST).toBe(new URL(SITE_URL).host);
  });
});

describe("resolveProto", () => {
  it("honours a plain forwarded scheme", () => {
    expect(resolveProto("https", "http")).toBe("https");
    expect(resolveProto("http", "http")).toBe("http");
  });

  it("takes the client-most value when a second proxy makes it a list", () => {
    expect(resolveProto("https, http", "http")).toBe("https");
    expect(resolveProto("http, https", "http")).toBe("http");
  });

  it("falls back to the request's own scheme when the header is absent", () => {
    expect(resolveProto(null, "https")).toBe("https");
    expect(resolveProto(null, "http")).toBe("http");
  });

  it("refuses anything that is not http or https", () => {
    // Each of these would otherwise be interpolated into a URL string and
    // relocate the origin, or parse as a scheme in its own right.
    for (const hostile of [
      "https://evil.com/#",
      "javascript:",
      "//evil.com",
      "HTTPS evil",
      "",
    ]) {
      expect(resolveProto(hostile, "http"), `${hostile} must not survive`).toBe("http");
    }
  });

  it("is case-insensitive for legitimate values", () => {
    expect(resolveProto("HTTPS", "http")).toBe("https");
  });
});

describe("resolveHost", () => {
  it("keeps hosts this app actually answers on", () => {
    expect(resolveHost("obsidianquantgroup.com")).toBe("obsidianquantgroup.com");
    expect(resolveHost("www.obsidianquantgroup.com")).toBe("www.obsidianquantgroup.com");
    expect(resolveHost("obsidian.abedubas.dev")).toBe("obsidian.abedubas.dev");
  });

  it("keeps loopback hosts on any port, so CI and local dev still canonicalize", () => {
    expect(resolveHost("127.0.0.1:4399")).toBe("127.0.0.1:4399");
    expect(resolveHost("localhost:3000")).toBe("localhost:3000");
    expect(resolveHost("localhost")).toBe("localhost");
  });

  it("falls back to the canonical host for anything unrecognised", () => {
    for (const hostile of ["evil.com", "obsidianquantgroup.com.evil.com", "", null]) {
      expect(resolveHost(hostile), `${hostile} must not be echoed`).toBe(CANONICAL_HOST);
    }
  });
});

describe("resolveRequestOrigin", () => {
  it("reconstructs the public origin from what nginx forwards", () => {
    // The bug this exists to prevent: the app listens on 127.0.0.1:3006, so
    // req.url reports localhost:3006 and every redirect pointed visitors at a
    // port on their own machine.
    expect(resolveRequestOrigin("https", "obsidianquantgroup.com", "http")).toBe(
      "https://obsidianquantgroup.com",
    );
  });

  it("works for a direct next start with no proxy headers", () => {
    expect(resolveRequestOrigin(null, "127.0.0.1:4399", "http")).toBe("http://127.0.0.1:4399");
  });

  it("never yields an off-site origin", () => {
    expect(resolveRequestOrigin("https://evil.com/#", "evil.com", "http")).toBe(
      `http://${CANONICAL_HOST}`,
    );
  });
});
