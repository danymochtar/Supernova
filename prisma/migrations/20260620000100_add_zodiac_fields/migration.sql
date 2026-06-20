-- Add ZodiacSign enum + optional moon/rising columns on Profile and Person.
-- Sun is NOT stored — it's derived from `dob` at read time by
-- `lib/zodiac/signs.ts#sunSignFromDob`, so corrections to DOB never leave
-- a stale Sun behind.

-- Idempotent enum creation — matches the recovery pattern used by the
-- chatMode migration. Re-running this against a partially-applied DB
-- (e.g. after a failed deploy that already created the enum) is a no-op.
DO $$ BEGIN
  CREATE TYPE "ZodiacSign" AS ENUM (
    'ARIES',
    'TAURUS',
    'GEMINI',
    'CANCER',
    'LEO',
    'VIRGO',
    'LIBRA',
    'SCORPIO',
    'SAGITTARIUS',
    'CAPRICORN',
    'AQUARIUS',
    'PISCES'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "moonSign" "ZodiacSign";
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "risingSign" "ZodiacSign";

ALTER TABLE "person" ADD COLUMN IF NOT EXISTS "moonSign" "ZodiacSign";
ALTER TABLE "person" ADD COLUMN IF NOT EXISTS "risingSign" "ZodiacSign";
