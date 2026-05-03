-- Split fullName into firstName / middleName / lastName for both Profile and
-- Person. Backfill by splitting on whitespace.

-- 1. Add new columns nullable so we can backfill before locking NOT NULL.
ALTER TABLE "profile"
  ADD COLUMN "firstName"  TEXT,
  ADD COLUMN "middleName" TEXT,
  ADD COLUMN "lastName"   TEXT;

ALTER TABLE "person"
  ADD COLUMN "firstName"  TEXT,
  ADD COLUMN "middleName" TEXT,
  ADD COLUMN "lastName"   TEXT;

-- 2. Backfill from existing fullName.
--    Single-word name → firstName = lastName = that word, middle = NULL.
--    Two-word name    → firstName = first, lastName = second, middle = NULL.
--    3+ word name     → first / middle (joined) / last.
UPDATE "profile" SET
  "firstName" = split_part(trim("fullName"), ' ', 1),
  "lastName" = CASE
    WHEN array_length(string_to_array(trim("fullName"), ' '), 1) >= 2
      THEN split_part(trim("fullName"), ' ', array_length(string_to_array(trim("fullName"), ' '), 1))
    ELSE split_part(trim("fullName"), ' ', 1)
  END,
  "middleName" = CASE
    WHEN array_length(string_to_array(trim("fullName"), ' '), 1) >= 3
      THEN array_to_string(
        (string_to_array(trim("fullName"), ' '))[2:array_length(string_to_array(trim("fullName"), ' '), 1) - 1],
        ' '
      )
    ELSE NULL
  END;

UPDATE "person" SET
  "firstName" = split_part(trim("fullName"), ' ', 1),
  "lastName" = CASE
    WHEN array_length(string_to_array(trim("fullName"), ' '), 1) >= 2
      THEN split_part(trim("fullName"), ' ', array_length(string_to_array(trim("fullName"), ' '), 1))
    ELSE split_part(trim("fullName"), ' ', 1)
  END,
  "middleName" = CASE
    WHEN array_length(string_to_array(trim("fullName"), ' '), 1) >= 3
      THEN array_to_string(
        (string_to_array(trim("fullName"), ' '))[2:array_length(string_to_array(trim("fullName"), ' '), 1) - 1],
        ' '
      )
    ELSE NULL
  END;

-- 3. Lock NOT NULL on first / last; drop old fullName column.
ALTER TABLE "profile" ALTER COLUMN "firstName" SET NOT NULL;
ALTER TABLE "profile" ALTER COLUMN "lastName"  SET NOT NULL;
ALTER TABLE "profile" DROP COLUMN "fullName";

ALTER TABLE "person" ALTER COLUMN "firstName" SET NOT NULL;
ALTER TABLE "person" ALTER COLUMN "lastName"  SET NOT NULL;
ALTER TABLE "person" DROP COLUMN "fullName";
