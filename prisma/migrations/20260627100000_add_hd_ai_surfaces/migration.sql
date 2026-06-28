-- AI-side Human Design surfaces:
--   1. DailyReading.hdTypeAtCache — snapshot of the user's HDType when
--      a daily reading was generated. Lets the cache-bust gate
--      regenerate readings when the underlying HD chart changes.
--   2. DesignStory — new table holding the one-shot AI synthesis of
--      the user's Human Design ("Your Design Story"). Keyed by
--      (userId, locale); chartHash invalidates on HD edits.

ALTER TABLE "daily_reading" ADD COLUMN IF NOT EXISTS "hdTypeAtCache" "HDType";

CREATE TABLE IF NOT EXISTS "design_story" (
  "id"           TEXT NOT NULL,
  "userId"       TEXT NOT NULL,
  "locale"       TEXT NOT NULL,
  "chartHash"    TEXT NOT NULL,
  "body"         TEXT NOT NULL,
  "inputTokens"  INTEGER NOT NULL DEFAULT 0,
  "outputTokens" INTEGER NOT NULL DEFAULT 0,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "design_story_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "design_story_userId_locale_key"
  ON "design_story" ("userId", "locale");

CREATE INDEX IF NOT EXISTS "design_story_userId_idx"
  ON "design_story" ("userId");

DO $$ BEGIN
  ALTER TABLE "design_story"
    ADD CONSTRAINT "design_story_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
