-- One-time self-healing recovery for the stuck `add_chat_mode` migration.
-- A previous deploy started this migration but failed before completion
-- (likely a network blip to the self-hosted Postgres), leaving Prisma in
-- P3009 — refusing all subsequent migrations until the failed row is
-- cleared.
--
-- This DELETE is safe:
--   - targeted to ONE migration name (no other rows touched);
--   - scoped to rows where finished_at IS NULL (won't touch successfully
--     applied migrations);
--   - idempotent: once the row is gone or the migration finishes
--     successfully, this is a no-op (DELETE 0).
--
-- The migration SQL itself uses `ADD COLUMN IF NOT EXISTS`, so when
-- `prisma migrate deploy` retries it the next instant, it succeeds
-- whether or not the column was already added by the partial run.
DELETE FROM "_prisma_migrations"
WHERE migration_name = '20260527000200_add_chat_mode'
  AND finished_at IS NULL;
