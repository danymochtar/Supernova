-- Hierarchical conversation summaries for the chatbot.

CREATE TYPE "SummaryKind" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

CREATE TABLE "conversation_summary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "SummaryKind" NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "summary" TEXT NOT NULL,
    "turnCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_summary_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "conversation_summary_userId_kind_periodStart_key"
    ON "conversation_summary"("userId", "kind", "periodStart");

CREATE INDEX "conversation_summary_userId_kind_periodStart_idx"
    ON "conversation_summary"("userId", "kind", "periodStart");

ALTER TABLE "conversation_summary"
    ADD CONSTRAINT "conversation_summary_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "user"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
