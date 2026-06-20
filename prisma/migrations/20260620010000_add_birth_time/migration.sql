-- Add birthTime + birthTimezone to Profile and Person so Moon + Rising
-- can be computed automatically from (dob, birthTime, birthTimezone)
-- via `circular-natal-horoscope-js` instead of manually picked. The
-- resulting sign is still cached in the existing moonSign/risingSign
-- columns so reads stay fast.

ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "birthTime" TEXT;
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "birthTimezone" TEXT;

ALTER TABLE "person" ADD COLUMN IF NOT EXISTS "birthTime" TEXT;
ALTER TABLE "person" ADD COLUMN IF NOT EXISTS "birthTimezone" TEXT;
