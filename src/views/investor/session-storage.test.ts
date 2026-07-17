import { describe, expect, it } from "vitest";
import { readDemoSession, writeDemoSession } from "./session-storage";

describe("demo investor session storage", () => {
  it("rejects malformed JSON and arbitrary objects", () => {
    expect(readDemoSession("not-json").signedIn).toBe(false);
    expect(readDemoSession("{}").signedIn).toBe(false);
    expect(readDemoSession(JSON.stringify({ memberId: "OQG-123" })).signedIn).toBe(false);
  });

  it("rejects empty member identifiers", () => {
    expect(readDemoSession(writeDemoSession("   ")).signedIn).toBe(false);
  });

  it("round-trips a versioned local demo session", () => {
    expect(readDemoSession(writeDemoSession(" OQG-123 "))).toEqual({
      signedIn: true,
      memberId: "OQG-123",
    });
  });
});
