import { describe, expect, it } from "vitest";
import { DEFAULT_SEED_ADMIN_EMAIL, resolveSeedAdmin } from "./seedCredentials";

const VALID_PASSWORD = "correct-horse-battery";

describe("resolveSeedAdmin password policy", () => {
  it("refuses to seed when ADMIN_SEED_PASSWORD is missing or blank", () => {
    // No fallback literal may exist: the repository is public, so a default
    // password would be a world-readable live credential.
    for (const env of [{}, { ADMIN_SEED_PASSWORD: "" }, { ADMIN_SEED_PASSWORD: "   " }]) {
      expect(() => resolveSeedAdmin(env), `${JSON.stringify(env)} must not seed`).toThrow(
        /ADMIN_SEED_PASSWORD is not set/,
      );
    }
  });

  it("names the variable the operator has to set", () => {
    expect(() => resolveSeedAdmin({})).toThrow(/ADMIN_SEED_PASSWORD/);
    expect(() => resolveSeedAdmin({})).toThrow(/at least 8 characters/);
  });

  it("rejects a password below the 8-character minimum used for API-created users", () => {
    expect(() => resolveSeedAdmin({ ADMIN_SEED_PASSWORD: "short7!" })).toThrow(
      /too short \(7 characters\)/,
    );
  });

  it("accepts a password exactly at the minimum length", () => {
    expect(resolveSeedAdmin({ ADMIN_SEED_PASSWORD: "12345678" }).password).toBe("12345678");
  });

  it("never echoes the secret in the too-short error", () => {
    // This message reaches deploy and CI stdout; leaking the value there would
    // reintroduce the plaintext log the seed used to print. Asserted against the
    // message directly — `toThrow(expect.not.stringContaining(...))` matches the
    // Error object rather than its message and would pass vacuously.
    let message = "";
    try {
      resolveSeedAdmin({ ADMIN_SEED_PASSWORD: "hunter2" });
    } catch (error) {
      message = (error as Error).message;
    }

    expect(message).toContain("too short");
    expect(message).not.toContain("hunter2");
  });

  it("returns the supplied password verbatim", () => {
    // Trimming would seed a hash that no longer matches the operator's vault.
    const password = "  padded secret  ";
    expect(resolveSeedAdmin({ ADMIN_SEED_PASSWORD: password }).password).toBe(password);
  });
});

describe("resolveSeedAdmin email normalisation", () => {
  it("lowercases a mixed-case ADMIN_SEED_EMAIL", () => {
    // Login looks the account up with `body.email.toLowerCase()`, so a
    // mixed-case seed email would create an admin nobody could sign in as.
    expect(
      resolveSeedAdmin({
        ADMIN_SEED_PASSWORD: VALID_PASSWORD,
        ADMIN_SEED_EMAIL: "Admin@ObsidianQuantGroup.com",
      }).email,
    ).toBe("admin@obsidianquantgroup.com");
  });

  it("falls back to the default address when ADMIN_SEED_EMAIL is unset or blank", () => {
    for (const env of [
      { ADMIN_SEED_PASSWORD: VALID_PASSWORD },
      { ADMIN_SEED_PASSWORD: VALID_PASSWORD, ADMIN_SEED_EMAIL: "" },
      { ADMIN_SEED_PASSWORD: VALID_PASSWORD, ADMIN_SEED_EMAIL: "   " },
    ]) {
      expect(resolveSeedAdmin(env).email).toBe(DEFAULT_SEED_ADMIN_EMAIL);
    }
    expect(DEFAULT_SEED_ADMIN_EMAIL).toBe("admin@obsidianquantgroup.com");
  });

  it("trims surrounding whitespace from a supplied address", () => {
    expect(
      resolveSeedAdmin({
        ADMIN_SEED_PASSWORD: VALID_PASSWORD,
        ADMIN_SEED_EMAIL: "  Ops@Example.COM \n",
      }).email,
    ).toBe("ops@example.com");
  });
});
