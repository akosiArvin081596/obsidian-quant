/**
 * Failed-login throttle policy for the admin sign-in route
 * (`src/app/api/admin/auth/route.ts`).
 *
 * The decision logic is deliberately pure and DB-free: it takes the counters as
 * arguments and answers questions about them. Two reasons.
 *   1. `vitest.config.ts` only collects test files under `src/`, so policy that
 *      lives inside a route handler is structurally untestable — the same
 *      reasoning that put `seedCredentials.ts` here rather than beside
 *      `prisma/seed.ts`.
 *   2. A lockout policy is exactly the kind of code that must not be verified by
 *      hand-driving a login form. The thresholds below are asserted in
 *      `loginThrottle.test.ts` against the exported constants, not magic numbers.
 *
 * Persistence is `User.failedLoginAttempts` / `User.lockedUntil`
 * (`failed_login_attempts` / `locked_until`).
 *
 * IMPORTANT — this module does NOT compute a counter to write. An earlier
 * version exported `nextFailureState(currentAttempts)` which took the count read
 * from the row and returned an absolute value to store. That shape is a
 * read-modify-write, and with no transaction around it, N concurrent login
 * attempts all read 0, all fail, and all write 1: N guesses for the price of one
 * increment, so the account never locks. The route now increments inside a
 * single atomic SQL statement and this module only interprets the count the
 * database hands back — see {@link engagesLock} / {@link justEngagedLock}, which
 * both take the count *after* the increment.
 */

/**
 * Consecutive wrong passwords that engage a lock.
 *
 * Five, because it has to sit between two failure modes:
 *   * Too low and normal life trips it — a stale password-manager entry, caps
 *     lock, or a stored password for the *old* admin account will burn two or
 *     three attempts before a human notices, and there is no self-serve unlock
 *     or password-reset flow in this admin yet.
 *   * Too high and it stops being a control. Passwords are bcrypt cost 12
 *     (`src/lib/auth/password.ts`), roughly a quarter-second of CPU per guess,
 *     but the route sits behind nginx `location /` with no rate limit, so an
 *     attacker can run guesses concurrently and is bounded only by server cores.
 *
 * Five attempts per {@link LOCK_WINDOW_MINUTES}-minute window caps a single
 * account at ~20 guesses/hour — under 500 a day — which turns even a short
 * wordlist into a multi-week job that is loud in the audit log the whole time.
 * That bound only holds because the increment is atomic; see the module note.
 */
export const MAX_FAILED_ATTEMPTS = 5;

/**
 * How long a lock holds, in minutes.
 *
 * Fifteen is the shortest window that still collapses guess throughput by
 * ~3 orders of magnitude, and short enough that a locked-out administrator can
 * wait it out instead of paging someone with database access — which matters,
 * because nothing else in this admin can clear a lock: the seed no longer
 * rewrites existing users and `PATCH /api/admin/users/[id]` cannot touch these
 * columns. Waiting is the recovery path, so it has to be short.
 */
export const LOCK_WINDOW_MINUTES = 15;

/** {@link LOCK_WINDOW_MINUTES} in milliseconds, for date arithmetic. */
export const LOCK_WINDOW_MS = LOCK_WINDOW_MINUTES * 60 * 1000;

/**
 * The one response every rejected login gets, whatever the real reason.
 *
 * It lives here, beside the lockout policy, on purpose. The guarantee that a
 * locked account is indistinguishable from an address that has no account is a
 * property of *this* policy, not of the transport, and keeping the single
 * permitted rejection here is what lets `loginThrottle.test.ts` assert that
 * every rejection branch — unknown address, disabled, locked, wrong password —
 * yields the identical payload. A future change that "helpfully" tells the
 * caller they are locked has to come through this constant, and the test fails.
 */
export const LOGIN_REJECTION = Object.freeze({
  status: 401,
  message: "Invalid email or password",
  code: "invalid_credentials",
});

/** The two `User` columns this policy owns. */
export type ThrottleState = {
  failedLoginAttempts: number;
  lockedUntil: Date | null;
};

/** Just enough of a `User` row for the policy to read. */
export type ThrottleUser = {
  status: string;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
};

/**
 * Whether sign-in is currently barred for this account.
 *
 * Expiry is exclusive: at exactly `lockedUntil` the account is open again, so a
 * lock that has run its course never needs a clean-up job to clear it. A null
 * `lockedUntil` — the default, and the value every pre-existing row was migrated
 * with — is never locked.
 */
export function isLocked(user: { lockedUntil: Date | null }, now: Date): boolean {
  if (!user.lockedUntil) return false;
  return user.lockedUntil.getTime() > now.getTime();
}

/**
 * Whether this account carries a lock that has already run out.
 *
 * The first failed attempt after a lapse restarts the count from zero rather
 * than carrying the old total forward. Without that, a lapsed lock left the
 * counter sitting on the threshold and the very next wrong password re-locked
 * instantly — which meant a single-admin install with a stale password-manager
 * entry could never get back in without `psql` on the VPS, and an anonymous
 * attacker could hold the published admin address locked forever at four
 * requests an hour. Restarting the count makes that DoS cost
 * {@link MAX_FAILED_ATTEMPTS} requests per window instead of one, and guarantees
 * a correct password always gets in once the window has passed.
 *
 * The route never acts on this reading directly — the reset happens inside the
 * same atomic statement as the increment, because two requests that both saw a
 * lapsed lock would otherwise both reset to zero and write 1.
 */
export function hasLapsedLock(user: { lockedUntil: Date | null }, now: Date): boolean {
  return user.lockedUntil !== null && !isLocked(user, now);
}

/** When a lock engaged {@link LOCK_WINDOW_MINUTES} ago from `now` should end. */
export function lockExpiry(now: Date): Date {
  return new Date(now.getTime() + LOCK_WINDOW_MS);
}

/**
 * Whether a count *already incremented for this failure* means the account is
 * locked.
 *
 * Note the argument: this is the value the database returned from the atomic
 * `UPDATE ... RETURNING`, never a count read beforehand. The lock engages when
 * the running total *reaches* {@link MAX_FAILED_ATTEMPTS}, i.e. the 5th
 * consecutive failure is refused, not the 6th.
 */
export function engagesLock(attemptsAfterFailure: number): boolean {
  return attemptsAfterFailure >= MAX_FAILED_ATTEMPTS;
}

/**
 * Whether *this* failure is the one that engaged the lock, as opposed to one
 * that arrived while the lock was already on.
 *
 * Because the increment is atomic, concurrent attempts each get a distinct
 * count back, so exactly one of them sees the threshold value — which is what
 * keeps a burst of a thousand guesses to a single `auth.lockout` audit row
 * instead of a thousand. Counts above the threshold only occur when requests
 * were already past the lock check (inside bcrypt) when the lock engaged.
 */
export function justEngagedLock(attemptsAfterFailure: number): boolean {
  return attemptsAfterFailure === MAX_FAILED_ATTEMPTS;
}

/**
 * Describes the state the atomic failure statement has just produced, given the
 * count it returned. Used for the `auth.lockout` audit payload.
 */
export function nextFailureState(attemptsAfterFailure: number, now: Date): ThrottleState {
  // Defensive: a fractional or sub-1 value can only come from a hand-edited row.
  // Any failure has by definition produced at least one attempt.
  const attempts = Math.max(1, Math.trunc(attemptsAfterFailure));
  return {
    failedLoginAttempts: attempts,
    lockedUntil: engagesLock(attempts) ? lockExpiry(now) : null,
  };
}

/**
 * The counters to persist after a correct password: a clean slate.
 *
 * Clearing `lockedUntil` as well as the count matters — a stale past timestamp
 * left behind would be harmless to {@link isLocked} but would misreport the
 * account as previously locked to anyone reading the table.
 */
export function successState(): ThrottleState {
  return { failedLoginAttempts: 0, lockedUntil: null };
}

/**
 * Whether a successful login needs a write at all.
 *
 * Most logins succeed on a clean account, and re-writing zeroes on every sign-in
 * would churn `users.updated_at` for nothing.
 */
export function needsSuccessReset(user: {
  failedLoginAttempts: number;
  lockedUntil: Date | null;
}): boolean {
  return user.failedLoginAttempts !== 0 || user.lockedUntil !== null;
}

/** Why a login was refused. Internal only — never surfaced to the caller. */
export type RejectionReason =
  | "unknown_account"
  | "account_disabled"
  | "account_locked"
  | "wrong_password";

export type LoginDecision =
  | {
      result: "reject";
      /** For logs and tests. The wire response is {@link LOGIN_REJECTION} regardless. */
      reason: RejectionReason;
      /** Only a live, unlocked account with a bad password advances the counter. */
      countFailure: boolean;
      response: typeof LOGIN_REJECTION;
    }
  | { result: "accept" };

function rejectionFor(user: ThrottleUser | null, now: Date): RejectionReason | null {
  if (!user) return "unknown_account";
  if (user.status !== "active") return "account_disabled";
  if (isLocked(user, now)) return "account_locked";
  return null;
}

/**
 * Whether the submitted password should be checked against the account's stored
 * hash, or against a throwaway decoy.
 *
 * A locked account is refused *before* its password is considered — a correct
 * password inside the lock window must not open a session — but it must still
 * cost the same bcrypt verification as every other rejection, or the lockout
 * becomes a timing oracle for account existence. The route asks this first to
 * pick the hash, then asks {@link decideLogin} for the outcome; both derive
 * eligibility from the same check, so they cannot disagree.
 */
export function passwordCheckTarget(user: ThrottleUser | null, now: Date): "stored" | "decoy" {
  return rejectionFor(user, now) === null ? "stored" : "decoy";
}

/**
 * The whole branch table of the login route, as a pure function.
 *
 * Every rejection carries the identical {@link LOGIN_REJECTION} payload. That is
 * the property under test: an unknown address, a disabled account, a locked
 * account and a wrong password must be indistinguishable by status, code, or
 * body, because anything else lets an attacker lock a candidate address out and
 * read the account's existence off the changed response.
 */
export function decideLogin(input: {
  user: ThrottleUser | null;
  passwordOk: boolean;
  now: Date;
}): LoginDecision {
  const reason = rejectionFor(input.user, input.now);

  if (reason !== null) {
    // Guesses that arrive during a lock are not counted and do not extend it:
    // letting them would hand any anonymous caller a way to keep a real
    // administrator locked out indefinitely.
    return { result: "reject", reason, countFailure: false, response: LOGIN_REJECTION };
  }

  if (!input.passwordOk) {
    return {
      result: "reject",
      reason: "wrong_password",
      countFailure: true,
      response: LOGIN_REJECTION,
    };
  }

  return { result: "accept" };
}
