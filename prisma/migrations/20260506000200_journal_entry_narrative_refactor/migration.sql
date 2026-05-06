-- Refactor JournalEntry from "snapshot one chat turn per row" to
-- "snapshot a batch of chat turns + first-person narrative". The
-- single-row-per-turn shape didn't fit the actual UX (multi-select →
-- one journal entry written in the user's tone).
--
-- Idempotent: works whether or not the previous migration's columns
-- have been applied yet.

ALTER TABLE "journal_entry" DROP COLUMN IF EXISTS "question";
ALTER TABLE "journal_entry" DROP COLUMN IF EXISTS "answer";
ALTER TABLE "journal_entry" DROP COLUMN IF EXISTS "originalTurnAt";
ALTER TABLE "journal_entry" DROP COLUMN IF EXISTS "sourceTurnId";

ALTER TABLE "journal_entry" ADD COLUMN IF NOT EXISTS "narrative"  TEXT      NOT NULL DEFAULT '';
ALTER TABLE "journal_entry" ADD COLUMN IF NOT EXISTS "sources"    JSONB     NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "journal_entry" ADD COLUMN IF NOT EXISTS "rangeStart" TIMESTAMP(3);
ALTER TABLE "journal_entry" ADD COLUMN IF NOT EXISTS "rangeEnd"   TIMESTAMP(3);

-- Backfill range columns for any pre-existing rows so they can be
-- promoted to NOT NULL.
UPDATE "journal_entry" SET "rangeStart" = "addedAt" WHERE "rangeStart" IS NULL;
UPDATE "journal_entry" SET "rangeEnd"   = "addedAt" WHERE "rangeEnd"   IS NULL;

ALTER TABLE "journal_entry" ALTER COLUMN "rangeStart" SET NOT NULL;
ALTER TABLE "journal_entry" ALTER COLUMN "rangeEnd"   SET NOT NULL;

-- Drop the column-level defaults — they were just there to make ADD
-- COLUMN safe against existing rows. New writes always provide values.
ALTER TABLE "journal_entry" ALTER COLUMN "narrative" DROP DEFAULT;
ALTER TABLE "journal_entry" ALTER COLUMN "sources"   DROP DEFAULT;
