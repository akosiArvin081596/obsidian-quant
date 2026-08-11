-- Login throttle state for the admin sign-in route.
--
-- Deliberately additive only: the VPS deploy script runs `prisma migrate deploy`
-- against the live database, so this must not rewrite or long-lock "users".
--   * "failed_login_attempts" is NOT NULL with a *constant* default. Since
--     PostgreSQL 11 that is a catalog-only change (the default is stored in
--     pg_attribute.attmissingval), so existing rows are not rewritten and no
--     backfill UPDATE runs.
--   * "locked_until" is nullable with no default — also catalog-only.
-- Both columns are added in one statement, so the ACCESS EXCLUSIVE lock is taken
-- once and held for microseconds. No index, constraint, or data change.

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "locked_until" TIMESTAMP(3);
