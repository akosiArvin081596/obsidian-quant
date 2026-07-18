import { describe, expect, it } from "vitest";
import { readDemoSession, writeDemoSession } from "./session-storage";

describe("demo investor session storage", () => {
  it("rejects malformed JSON and arbitrary objects", () => {
    expect(readDemoSession("not-json").signedIn).toBe(false);
    expect(readDemoSession("{}").signedIn).toBe(false);
    expect(readDemoSession(JSON.stringify({ memberId: "OQG-123" })).signedIn).toBe(false);
    // Right version, wrong type — well-formed JSON that still cannot be trusted.
    expect(
      readDemoSession(JSON.stringify({ demoVersion: 1, memberId: 42 })).signedIn,
    ).toBe(false);
  });

  it("rejects empty member identifiers", () => {
    expect(readDemoSession(writeDemoSession("   ")).signedIn).toBe(false);
    // Straight from storage rather than through writeDemoSession: the reader is
    // handed whatever localStorage holds, so it has to trim on its own account.
    expect(readDemoSession('{"demoVersion":1,"memberId":"   "}').signedIn).toBe(false);
  });

  it("round-trips a versioned local demo session", () => {
    expect(readDemoSession(writeDemoSession(" OQG-123 "))).toEqual({
      signedIn: true,
      memberId: "OQG-123",
    });
  });
});
