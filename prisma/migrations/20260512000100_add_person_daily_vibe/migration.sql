CREATE TABLE IF NOT EXISTS "person_daily_vibe" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "personId" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "locale" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "inputTokens" INTEGER NOT NULL DEFAULT 0,
  "outputTokens" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "person_daily_vibe_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "person_daily_vibe_personId_date_key" ON "person_daily_vibe"("personId", "date");
CREATE INDEX IF NOT EXISTS "person_daily_vibe_userId_createdAt_idx" ON "person_daily_vibe"("userId", "createdAt");

ALTER TABLE "person_daily_vibe"
  ADD CONSTRAINT "person_daily_vibe_userId_fkey" FOREIGN KEY ("userId")
  REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "person_daily_vibe"
  ADD CONSTRAINT "person_daily_vibe_personId_fkey" FOREIGN KEY ("personId")
  REFERENCES "person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
