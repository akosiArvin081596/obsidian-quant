import { describe, expect, it } from "vitest";
import {
  LOCK_WINDOW_MS,
  LOGIN_REJECTION,
  MAX_FAILED_ATTEMPTS,
  decideLogin,
  engagesLock,
  hasLapsedLock,
  isLocked,
  justEngagedLock,
  lockExpiry,
  needsSuccessReset,
  nextFailureState,
  passwordCheckTarget,
  successState,
  type ThrottleUser,
} from "./loginThrottle";

// A fixed instant, so nothing here depends on the wall clock.
const NOW = new Date("2026-08-11T12:00:00.000Z");
const at = (offsetMs: number) => new Date(NOW.getTime() + offsetMs);

const account = (over: Partial<ThrottleUser> = {}): ThrottleUser => ({
  status: "active",
  failedLoginAttempts: 0,
  lockedUntil: null,
  ...over,
});

const LOCKED = account({ failedLoginAttempts: MAX_FAILED_ATTEMPTS, lockedUntil: at(LOCK_WINDOW_MS) });
const DISABLED = account({ status: "disabled" });

describe("isLocked", () => {
  it("treats a never-locked account as open", () => {
    // The column default, and the value every pre-existing row was migrated
    // with — this is the case that must never bar a login.
    expect(isLocked({ lockedUntil: null }, NOW)).toBe(false);
  });

  it("treats an elapsed lock as open without needing a clean-up job", () => {
    expect(isLocked({ lockedUntil: at(-1) }, NOW)).toBe(false);
    expect(isLocked({ lockedUntil: at(-LOCK_WINDOW_MS) }, NOW)).toBe(false);
  });

  it("bars a login while the lock is still in the future", () => {
    expect(isLocked({ lockedUntil: at(1) }, NOW)).toBe(true);
    expect(isLocked({ lockedUntil: at(LOCK_WINDOW_MS) }, NOW)).toBe(true);
  });

  it("expires exclusively: the instant of lockedUntil is already open", () => {
    expect(isLocked({ lockedUntil: new Date(NOW.getTime()) }, NOW)).toBe(false);
  });
});

describe("hasLapsedLock", () => {
  it("only reports a lock that was set and has since run out", () => {
    expect(hasLapsedLock({ lockedUntil: at(-1) }, NOW)).toBe(true);
    expect(hasLapsedLock({ lockedUntil: at(1) }, NOW)).toBe(false);
    expect(hasLapsedLock({ lockedUntil: null }, NOW)).toBe(false);
  });
});

describe("engagesLock / justEngagedLock", () => {
  it("takes the count AFTER the failure was counted, not before", () => {
    // The contract that matters: these read the number the atomic
    // `UPDATE ... RETURNING` handed back. Anything computed from a count read
    // before the write is a lost update waiting to happen.
    for (let after = 1; after < MAX_FAILED_ATTEMPTS; after += 1) {
      expect(engagesLock(after), `${after} failures must not lock`).toBe(false);
    }
    expect(engagesLock(MAX_FAILED_ATTEMPTS)).toBe(true);
  });

  it("engages exactly on the threshold attempt, not the one before or after", () => {
    expect(engagesLock(MAX_FAILED_ATTEMPTS - 1)).toBe(false);
    expect(engagesLock(MAX_FAILED_ATTEMPTS + 1)).toBe(true);
  });

  it("marks only the transition, so a burst leaves one audit entry", () => {
    // Concurrent attempts each get a distinct count back from the database, so
    // exactly one of them can see the threshold value.
    expect(justEngagedLock(MAX_FAILED_ATTEMPTS)).toBe(true);
    expect(justEngagedLock(MAX_FAILED_ATTEMPTS - 1)).toBe(false);
    expect(justEngagedLock(MAX_FAILED_ATTEMPTS + 1)).toBe(false);
  });
});

describe("lockExpiry / nextFailureState", () => {
  it("locks for exactly one window, measured from the failure", () => {
    expect(lockExpiry(NOW)).toEqual(at(LOCK_WINDOW_MS));
    expect(isLocked({ lockedUntil: lockExpiry(NOW) }, at(LOCK_WINDOW_MS - 1))).toBe(true);
    expect(isLocked({ lockedUntil: lockExpiry(NOW) }, at(LOCK_WINDOW_MS))).toBe(false);
  });

  it("describes an unlocked account below the threshold", () => {
    const state = nextFailureState(MAX_FAILED_ATTEMPTS - 1, NOW);
    expect(state).toEqual({ failedLoginAttempts: MAX_FAILED_ATTEMPTS - 1, lockedUntil: null });
  });

  it("describes a locked account at and above the threshold", () => {
    expect(nextFailureState(MAX_FAILED_ATTEMPTS, NOW)).toEqual({
      failedLoginAttempts: MAX_FAILED_ATTEMPTS,
      lockedUntil: at(LOCK_WINDOW_MS),
    });
    expect(nextFailureState(MAX_FAILED_ATTEMPTS + 3, NOW).lockedUntil).toEqual(at(LOCK_WINDOW_MS));
  });

  it("never reads a corrupted counter as fewer than one failure", () => {
    expect(nextFailureState(0, NOW).failedLoginAttempts).toBe(1);
    expect(nextFailureState(-5, NOW).failedLoginAttempts).toBe(1);
    expect(nextFailureState(3.7, NOW).failedLoginAttempts).toBe(3);
  });

  it("does not mutate the clock it was handed", () => {
    const now = new Date(NOW.getTime());
    nextFailureState(MAX_FAILED_ATTEMPTS, now);
    lockExpiry(now);
    expect(now.getTime()).toBe(NOW.getTime());
  });
});

describe("successState / needsSuccessReset", () => {
  it("wipes both the counter and the lock on a correct password", () => {
    expect(successState()).toEqual({ failedLoginAttempts: 0, lockedUntil: null });
    expect(isLocked(successState(), NOW)).toBe(false);
  });

  it("skips the write for the usual clean sign-in", () => {
    expect(needsSuccessReset({ failedLoginAttempts: 0, lockedUntil: null })).toBe(false);
  });

  it("writes when there is any failure state left behind", () => {
    expect(needsSuccessReset({ failedLoginAttempts: 1, lockedUntil: null })).toBe(true);
    // A lapsed lock still has to be cleared, or the row misreports the account.
    expect(needsSuccessReset({ failedLoginAttempts: 0, lockedUntil: at(-LOCK_WINDOW_MS) })).toBe(
      true,
    );
  });
});

describe("passwordCheckTarget", () => {
  it("checks the stored hash only for a live, unlocked account", () => {
    expect(passwordCheckTarget(account(), NOW)).toBe("stored");
    expect(passwordCheckTarget(account({ lockedUntil: at(-1) }), NOW)).toBe("stored");
  });

  it("spends a decoy verification on every account it will refuse anyway", () => {
    // Skipping bcrypt here is what turns a lockout into a timing oracle: the
    // locked account would answer in microseconds while a wrong password took a
    // quarter-second, so an attacker could lock an address and watch it get
    // fast to confirm the account is real.
    expect(passwordCheckTarget(null, NOW)).toBe("decoy");
    expect(passwordCheckTarget(DISABLED, NOW)).toBe("decoy");
    expect(passwordCheckTarget(LOCKED, NOW)).toBe("decoy");
  });
});

describe("decideLogin", () => {
  const rejections = [
    ["an address with no account", null as ThrottleUser | null, true],
    ["a disabled account", DISABLED, true],
    ["a locked account, right password", LOCKED, true],
    ["a locked account, wrong password", LOCKED, false],
    ["a live account, wrong password", account(), false],
  ] as const;

  it("refuses a locked account even when the password is correct", () => {
    const decision = decideLogin({ user: LOCKED, passwordOk: true, now: NOW });
    expect(decision.result).toBe("reject");
    expect(decision.result === "reject" && decision.reason).toBe("account_locked");
  });

  it("lets a correct password through once the window has lapsed", () => {
    // The recovery path. Waiting out the window is the ONLY way back in — the
    // seed does not rewrite existing users and no admin endpoint clears a lock —
    // so this must hold.
    const lapsed = account({ failedLoginAttempts: MAX_FAILED_ATTEMPTS, lockedUntil: at(-1) });
    expect(decideLogin({ user: lapsed, passwordOk: true, now: NOW })).toEqual({ result: "accept" });
  });

  it("counts a failure only for a live, unlocked account with a bad password", () => {
    const counted = decideLogin({ user: account(), passwordOk: false, now: NOW });
    expect(counted.result === "reject" && counted.countFailure).toBe(true);

    // Guesses arriving during a lock must not advance the counter or extend the
    // window, or any anonymous caller could hold an administrator out forever.
    for (const [label, user, passwordOk] of [
      ["locked, wrong password", LOCKED, false],
      ["locked, right password", LOCKED, true],
      ["unknown address", null as ThrottleUser | null, false],
      ["disabled account", DISABLED, false],
    ] as const) {
      const decision = decideLogin({ user, passwordOk, now: NOW });
      expect(decision.result === "reject" && decision.countFailure, `${label}`).toBe(false);
    }
  });

  it("returns one byte-identical rejection for every reason it refuses", () => {
    // The enumeration guarantee, asserted rather than trusted. A change that
    // "helpfully" tells the caller they are locked has to come through here.
    const responses = rejections.map(([label, user, passwordOk]) => {
      const decision = decideLogin({ user, passwordOk, now: NOW });
      expect(decision.result, `${label} must be refused`).toBe("reject");
      return decision.result === "reject" ? decision.response : null;
    });

    for (const response of responses) {
      expect(response).toBe(LOGIN_REJECTION); // same frozen object, not a copy
      expect(JSON.stringify(response)).toBe(JSON.stringify(responses[0]));
    }

    expect(LOGIN_REJECTION).toEqual({
      status: 401,
      message: "Invalid email or password",
      code: "invalid_credentials",
    });
  });

  it("distinguishes the four reasons internally, for logs only", () => {
    const reason = (user: ThrottleUser | null, passwordOk: boolean) => {
      const d = decideLogin({ user, passwordOk, now: NOW });
      return d.result === "reject" ? d.reason : "accept";
    };
    expect(reason(null, false)).toBe("unknown_account");
    expect(reason(DISABLED, false)).toBe("account_disabled");
    expect(reason(LOCKED, true)).toBe("account_locked");
    expect(reason(account(), false)).toBe("wrong_password");
    expect(reason(account(), true)).toBe("accept");
  });

  it("accepts only a live, unlocked account with the right password", () => {
    expect(decideLogin({ user: account(), passwordOk: true, now: NOW })).toEqual({
      result: "accept",
    });
  });

  it("agrees with passwordCheckTarget about who is eligible", () => {
    // If these two ever disagreed, an account could be judged against the decoy
    // hash and then accepted, or judged against its real hash and then refused.
    for (const user of [null, account(), DISABLED, LOCKED]) {
      const eligible = passwordCheckTarget(user, NOW) === "stored";
      const decision = decideLogin({ user, passwordOk: true, now: NOW });
      expect(decision.result === "accept").toBe(eligible);
    }
  });
});

describe("policy constants", () => {
  it("keeps the threshold and window in the range the route was designed for", () => {
    // Guards against a well-meaning tweak that quietly defeats the control: a
    // threshold this side of 3 trips on ordinary typos, past 10 it stops
    // bounding a wordlist, and a sub-minute window is not a throttle at all.
    expect(MAX_FAILED_ATTEMPTS).toBeGreaterThanOrEqual(3);
    expect(MAX_FAILED_ATTEMPTS).toBeLessThanOrEqual(10);
    expect(LOCK_WINDOW_MS).toBeGreaterThanOrEqual(60 * 1000);
  });

  it("freezes the rejection payload so it cannot be mutated at runtime", () => {
    expect(Object.isFrozen(LOGIN_REJECTION)).toBe(true);
  });
});
