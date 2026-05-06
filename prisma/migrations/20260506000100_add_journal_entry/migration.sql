-- Journal entries — chat turns the user explicitly chose to remember.
-- Snapshotted (question + answer + original timestamp) so deleting the
-- source chat turn doesn't destroy journaled content.

CREATE TABLE "journal_entry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "originalTurnAt" TIMESTAMP(3) NOT NULL,
    "sourceTurnId" TEXT,
    "note" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_entry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "journal_entry_userId_addedAt_idx"
    ON "journal_entry"("userId", "addedAt" DESC);

ALTER TABLE "journal_entry"
    ADD CONSTRAINT "journal_entry_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "user"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
