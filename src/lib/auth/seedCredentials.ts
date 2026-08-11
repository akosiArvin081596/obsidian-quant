/**
 * Resolution of the bootstrap administrator credentials used by `prisma/seed.ts`.
 *
 * This lives in `src/lib/` rather than next to the seed script on purpose:
 * `vitest.config.ts` only includes test files under `src/`, so anything in
 * `prisma/` is structurally outside the test suite. Keeping the decision logic
 * here is what makes it testable.
 */

/** Seeded when `ADMIN_SEED_EMAIL` is absent. Already lowercase. */
export const DEFAULT_SEED_ADMIN_EMAIL = "admin@obsidianquantgroup.com";

/**
 * Mirrors the `password: z.string().min(8)` rule enforced for API-created users
 * at `src/app/api/admin/users/route.ts:72`. The number is not arbitrary — the
 * bootstrap administrator, which holds every permission, must not be held to a
 * weaker standard than an account created through the admin UI.
 */
export const MIN_SEED_PASSWORD_LENGTH = 8;

/** Credentials for the bootstrap administrator row. */
export type SeedAdmin = {
  /** Lowercased, so the login lookup can actually find the row. */
  email: string;
  /** Verbatim operator-supplied secret, ready to hash. Never logged. */
  password: string;
};

/**
 * Reads the bootstrap administrator credentials out of the environment.
 *
 * There is deliberately no default password. This repository is public, so any
 * literal committed here would be a world-readable credential on every
 * deployment that ran the seed without configuring the environment first.
 *
 * @throws {Error} when `ADMIN_SEED_PASSWORD` is unset, blank, or shorter than
 * {@link MIN_SEED_PASSWORD_LENGTH}. Failing the seed is the correct outcome:
 * a hard stop is recoverable, a predictable admin password is not.
 */
export function resolveSeedAdmin(env: NodeJS.ProcessEnv): SeedAdmin {
  const password = env.ADMIN_SEED_PASSWORD ?? "";

  // Whitespace-only counts as unset — it is almost always an empty CI secret or
  // a blank line in `.env`, never a deliberate credential.
  if (password.trim().length === 0) {
    throw new Error(
      "ADMIN_SEED_PASSWORD is not set. The seed no longer falls back to a built-in " +
        "default password, because this repository is public. Set ADMIN_SEED_PASSWORD " +
        `to a strong secret of at least ${MIN_SEED_PASSWORD_LENGTH} characters ` +
        "(and optionally ADMIN_SEED_EMAIL) in your environment or .env file, then " +
        "re-run the seed.",
    );
  }

  // Report the length but never the value: this error surfaces in deploy and CI
  // stdout, which is exactly where the old plaintext password log leaked.
  if (password.length < MIN_SEED_PASSWORD_LENGTH) {
    throw new Error(
      `ADMIN_SEED_PASSWORD is too short (${password.length} characters). Set ` +
        `ADMIN_SEED_PASSWORD to at least ${MIN_SEED_PASSWORD_LENGTH} characters — ` +
        "the same minimum enforced for admin-created users.",
    );
  }

  // Login resolves the account with `body.email.toLowerCase()`
  // (`src/app/api/admin/auth/route.ts:25`), but the seed used to write the env
  // value verbatim. A mixed-case ADMIN_SEED_EMAIL therefore seeded an account
  // that the lookup could never match — an administrator nobody could log into.
  // Normalising here keeps the seeded row reachable.
  const email = (env.ADMIN_SEED_EMAIL?.trim() || DEFAULT_SEED_ADMIN_EMAIL).toLowerCase();

  // The password is passed through untouched — trimming it would silently seed a
  // hash that no longer matches the secret held in the operator's vault.
  return { email, password };
}
