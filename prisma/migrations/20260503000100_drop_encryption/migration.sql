-- Drop encrypted PII columns and replace with plaintext.
-- Safe to wipe rows: only dev/test data exists at this point.

DELETE FROM "profile";
DELETE FROM "person";

ALTER TABLE "profile"
  DROP COLUMN "nameEncrypted",
  DROP COLUMN "dobEncrypted",
  ADD COLUMN "fullName" TEXT NOT NULL,
  ADD COLUMN "dob" DATE NOT NULL;

ALTER TABLE "person"
  DROP COLUMN "nameEncrypted",
  DROP COLUMN "dobEncrypted",
  ADD COLUMN "fullName" TEXT NOT NULL,
  ADD COLUMN "dob" DATE NOT NULL;
