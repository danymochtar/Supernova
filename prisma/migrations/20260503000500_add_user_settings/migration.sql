-- User-facing preferences batch:
-- - theme: light/dark/auto override (default: auto = follow system)
-- - tone: chat & content voice (warm/direct/playful)
-- - showKarmicDebt: UI toggle to hide karmic-debt badges
-- - preferredModel: optional per-user AI model override
-- - reminderEnabled / reminderTime: daily push reminder preference

ALTER TABLE "profile"
  ADD COLUMN "theme"           TEXT    NOT NULL DEFAULT 'auto',
  ADD COLUMN "tone"            TEXT    NOT NULL DEFAULT 'warm',
  ADD COLUMN "showKarmicDebt"  BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "preferredModel"  TEXT,
  ADD COLUMN "reminderEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "reminderTime"    TEXT;
