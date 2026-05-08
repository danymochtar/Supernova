-- Career entries — user's work history, parsed from a PDF resume and
-- snapshotted with a match score against their TalentVocation rating.

CREATE TABLE "career_entry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT,
    "startDate" DATE,
    "endDate" DATE,
    "description" TEXT,
    "vocationId" TEXT NOT NULL,
    "matchScore" DOUBLE PRECISION NOT NULL,
    "insight" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "career_entry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "career_entry_userId_startDate_idx"
    ON "career_entry"("userId", "startDate" DESC);

ALTER TABLE "career_entry"
    ADD CONSTRAINT "career_entry_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "user"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
