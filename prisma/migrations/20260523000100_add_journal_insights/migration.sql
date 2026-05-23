-- Closed-loop journaling: extend JournalEntry with AI-extracted insight
-- fields. `reframe` is a short CBT-style paragraph voiced as Supernova
-- (vs the first-person narrative). `emotion` + `theme` are single-label
-- classifications used to surface patterns across entries. `actionItems`
-- holds the extracted concrete tasks as a JSON array — schema:
--   [{ id, title, completed, completedAt?, createdAt }]

ALTER TABLE "journal_entry"
  ADD COLUMN "reframe" TEXT,
  ADD COLUMN "emotion" TEXT,
  ADD COLUMN "theme" TEXT,
  ADD COLUMN "actionItems" JSONB NOT NULL DEFAULT '[]'::jsonb;
