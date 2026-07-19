import { describe, expect, it } from "vitest";
import { readDemoSession, writeDemoSession } from "./session-storage";

/**
 * A note on `typeof candidate.memberId !== "string"` in session-storage.ts.
 *
 * That check is UNKILLABLE BY DESIGN — deleting it cannot be caught by any test
 * that can be written here, and the "wrong type" assertion below passes either
 * way. It is not missing coverage, and it should not be deleted as dead code.
 *
 * Why no test can distinguish it: the reader's input is a JSON string, so
 * `JSON.parse` can only hand it a string, number, boolean, null, object or
 * array — and of those, only a string carries a callable `.trim`. Drop the
 * check and every non-string `memberId` throws a TypeError on `.trim()`, which
 * the surrounding `try/catch` converts into the identical signed-out result.
 * Same return value, same absence of side effects, on every reachable input.
 *
 * It stays because it states the contract at the boundary rather than leaving
 * type safety to an exception handler that exists for a different reason.
 */
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
