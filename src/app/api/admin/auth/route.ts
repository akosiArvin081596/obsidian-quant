import { randomBytes } from "node:crypto";
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ApiError, jsonError, jsonOk } from "@/lib/auth/api";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  LOGIN_REJECTION,
  MAX_FAILED_ATTEMPTS,
  decideLogin,
  justEngagedLock,
  lockExpiry,
  needsSuccessReset,
  nextFailureState,
  passwordCheckTarget,
  successState,
} from "@/lib/auth/loginThrottle";
import {
  clearSessionCookie,
  createSession,
  destroySession,
  getCurrentUser,
  getSessionToken,
  setSessionCookie,
} from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/blog/audit";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * The single response every rejected login gets, whatever the real reason:
 * no such address, a disabled account, a locked account, or a wrong password.
 *
 * The payload comes from `LOGIN_REJECTION`, which lives with the throttle policy
 * so that the "every rejection looks identical" property is unit-tested rather
 * than trusted. Built fresh per call rather than shared, because `ApiError`
 * extends `Error` and capturing one stack at module scope would attribute every
 * failed login to the same line.
 */
function invalidCredentials(): ApiError {
  return new ApiError(LOGIN_REJECTION.status, LOGIN_REJECTION.message, LOGIN_REJECTION.code);
}

/**
 * A throwaway bcrypt hash to verify against when there is no real hash to check.
 *
 * Without it, "no such user" would return in microseconds while "wrong password"
 * spent ~250ms in bcrypt cost 12 — a timing oracle that answers "does this
 * address have an account?" reliably enough to enumerate the admin roster. The
 * lockout makes that worse, not better: a locked account would otherwise skip
 * bcrypt too, so an attacker who locked an account could *watch it become fast*
 * and learn it exists. Every rejected login therefore spends exactly one bcrypt
 * verification, and the timings converge.
 *
 * The plaintext is 32 random bytes generated once per process and immediately
 * discarded, so no password can match it — it is not a credential, and there is
 * nothing here to leak or configure.
 */
let decoyHashPromise: Promise<string> | null = null;

/**
 * Standby decoy, used only if generating one at runtime ever fails.
 *
 * This is not a credential and grants nothing: it is a cost-12 bcrypt hash of 32
 * random bytes that were discarded at the moment it was generated, so no
 * password on earth verifies against it and there is nothing here to rotate.
 *
 * It exists because `decoyPasswordHash()` must never reject. If it did, the
 * unknown-address and locked-account paths would return 500 while an active
 * account with a wrong password still returned 401 — an account-existence
 * oracle that only shows up in a degraded state, which is exactly when nobody is
 * watching for it. The cost factor is pinned to the 12 used by `hashPassword`,
 * so a fallback verification still costs what a real one costs.
 */
const STANDBY_DECOY_HASH = "$2b$12$8qzpGze/EheRv71ARtTnqevtE7zR7XksHxS6JKetuvkg3vLtuF3DK";

function decoyPasswordHash(): Promise<string> {
  decoyHashPromise ??= hashPassword(randomBytes(32).toString("hex")).catch((error) => {
    console.error("Falling back to the standby decoy hash", error);
    return STANDBY_DECOY_HASH;
  });
  return decoyHashPromise;
}

// Warm it at module load so the first rejected login pays for one bcrypt call
// like every other, rather than a hash *and* a compare.
void decoyPasswordHash().catch(() => undefined);

/**
 * Persists one failed attempt and, when the threshold is crossed, the lock —
 * atomically, in a single statement.
 *
 * The atomicity is the whole point, not a detail. Reading the counter, adding
 * one in JavaScript, and writing the absolute result back is a lost update:
 * fire 200 concurrent guesses and every one of them reads 0, fails, and writes
 * 1. Two hundred guesses, one increment, no lock, repeat forever — which
 * defeats the throttle precisely in the concurrent case it exists to stop.
 * There is no transaction wrapping a request here to save us, so the arithmetic
 * has to happen inside the database.
 *
 * The statement does three things at once:
 *   * `FOR UPDATE` in the CTE takes the row lock *before* reading, so concurrent
 *     callers serialise and each one re-reads the freshly committed count.
 *     Without it the CTE would read from the statement snapshot and the lost
 *     update comes straight back.
 *   * A lock that has already run out resets the count to zero first, so the
 *     first wrong password after a window lapses starts a new run of
 *     {@link MAX_FAILED_ATTEMPTS} rather than re-locking on its own. That reset
 *     has to happen here rather than in application code for the same reason as
 *     the increment: two callers that both saw a lapsed lock would both reset.
 *   * The threshold and the lock expiry are bound as parameters from the policy
 *     module, so the SQL contains no policy numbers of its own to drift.
 *
 * `RETURNING` hands back the post-increment count, which is what the caller
 * needs and what the policy helpers now take. Because the increment is atomic,
 * each concurrent caller gets a distinct number back, so exactly one of them
 * sees the threshold and writes the single `auth.lockout` entry.
 *
 * Never throws. Bookkeeping runs on the existing-account path only, so if a
 * write here were allowed to fail the request, an attacker could tell a real
 * account (500) from an unknown one (401) by whatever made the write fail — the
 * enumeration leak this whole route is built to avoid. The failure is logged for
 * the operator and the caller still gets the standard 401.
 *
 * Side note: raw SQL sidesteps Prisma's `@updatedAt`, so a failed login no
 * longer disturbs `users.updated_at` — a failed guess is not a profile edit, and
 * the admin users API surfaces that field.
 */
async function recordFailedAttempt(
  user: { id: string },
  now: Date,
  ipAddress: string | null,
): Promise<void> {
  try {
    const rows = await prisma.$queryRaw<
      Array<{ failed_login_attempts: number; locked_until: Date | null }>
    >`
      WITH prev AS (
        SELECT
          id,
          CASE WHEN locked_until IS NOT NULL AND locked_until <= ${now}
               THEN 0 ELSE failed_login_attempts END AS base,
          (locked_until IS NOT NULL AND locked_until <= ${now}) AS lapsed
        FROM users
        WHERE id = ${user.id}
        FOR UPDATE
      )
      UPDATE users u
      SET
        failed_login_attempts = prev.base + 1,
        locked_until = CASE
          WHEN prev.base + 1 >= ${MAX_FAILED_ATTEMPTS} THEN ${lockExpiry(now)}
          WHEN prev.lapsed THEN NULL
          ELSE u.locked_until
        END
      FROM prev
      WHERE u.id = prev.id
      RETURNING u.failed_login_attempts, u.locked_until
    `;

    // Empty only if the account was deleted mid-request. Nothing to record.
    const row = rows[0];
    if (!row) return;

    if (justEngagedLock(row.failed_login_attempts)) {
      // Logged on the transition into a lock only, never on every failure, so a
      // burst of a thousand guesses leaves one audit entry rather than a
      // thousand. Matches the `auth.login` entry shape; the attempted password
      // is never recorded.
      const applied = nextFailureState(row.failed_login_attempts, now);
      await writeAuditLog({
        userId: user.id,
        action: "auth.lockout",
        entityType: "user",
        entityId: user.id,
        after: {
          failedLoginAttempts: applied.failedLoginAttempts,
          lockedUntil: (row.locked_until ?? applied.lockedUntil)?.toISOString() ?? null,
        },
        ipAddress,
      });
    }
  } catch (error) {
    console.error("Failed to record a failed login attempt", error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = loginSchema.parse(await req.json());
    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
      include: {
        roles: { include: { role: true } },
      },
    });

    const now = new Date();
    const ipAddress = req.headers.get("x-forwarded-for");

    // A locked account is refused before its password is even considered — a
    // correct password inside the window must not open a session — but it still
    // has to cost the same bcrypt verification as every other rejection, or the
    // lockout itself becomes the timing oracle. So the policy picks the hash
    // first, and only then judges the outcome. Unknown address, disabled
    // account and locked account all verify against the decoy; see
    // `decoyPasswordHash`.
    const useStoredHash = user !== null && passwordCheckTarget(user, now) === "stored";
    const passwordOk = await verifyPassword(
      body.password,
      useStoredHash && user ? user.passwordHash : await decoyPasswordHash(),
    );

    const decision = decideLogin({ user, passwordOk, now });

    if (decision.result === "reject") {
      if (decision.countFailure && user) {
        await recordFailedAttempt(user, now, ipAddress);
      }

      // Identical 401 for every rejection branch, straight from the policy's
      // single permitted rejection. The temptation is to answer a locked account
      // with a 423/429 or a "try again in 15 minutes" hint, and that is exactly
      // what must not happen: any such difference in status, code, body, or
      // header turns the lockout into an account-existence oracle — lock a
      // candidate address out, and the changed response tells you the account is
      // real. Staying silent costs a locked-out admin some confusion; the
      // alternative costs everyone the roster.
      throw invalidCredentials();
    }

    // `decideLogin` only accepts when the account exists, is active, is unlocked
    // and the password verified — but it takes a nullable user, so re-assert it
    // for the type system rather than asserting non-null.
    if (!user) {
      throw invalidCredentials();
    }

    if (needsSuccessReset(user)) {
      // Correct password: clear the record. Guarded so an ordinary sign-in on a
      // clean account does not write to `users` at all. Safe as an absolute
      // write — unlike the failure counter, every concurrent success writes the
      // same zeroes.
      await prisma.user.update({ where: { id: user.id }, data: successState() });
    }

    const token = await createSession(user.id);
    await setSessionCookie(token);
    await writeAuditLog({
      userId: user.id,
      action: "auth.login",
      entityType: "user",
      entityId: user.id,
      ipAddress,
    });

    return jsonOk({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles.map((r) => r.role.name),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(new ApiError(400, "Invalid payload", "validation"));
    }
    return jsonError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = await getSessionToken();
    const user = await getCurrentUser();
    await destroySession(token);
    await clearSessionCookie();
    if (user) {
      await writeAuditLog({
        userId: user.id,
        action: "auth.logout",
        entityType: "user",
        entityId: user.id,
        ipAddress: req.headers.get("x-forwarded-for"),
      });
    }
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return jsonOk({ user: null });
    }
    return jsonOk({ user });
  } catch (error) {
    return jsonError(error);
  }
}
