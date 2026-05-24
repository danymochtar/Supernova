-- Auto-journaling opt-in flag. When true, the journal page auto-clusters
-- the user's past-day chat conversations by topic and turns each cluster
-- into a journal entry. Off by default.

ALTER TABLE "profile"
  ADD COLUMN "autoJournal" BOOLEAN NOT NULL DEFAULT false;
