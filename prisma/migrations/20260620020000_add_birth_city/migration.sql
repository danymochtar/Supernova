-- Add birthCity + birthLat + birthLon to Profile and Person so the
-- Rising (Ascendant) calculation can use precise coordinates instead
-- of the timezone-center approximation.

ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "birthCity" TEXT;
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "birthLat" DOUBLE PRECISION;
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "birthLon" DOUBLE PRECISION;

ALTER TABLE "person" ADD COLUMN IF NOT EXISTS "birthCity" TEXT;
ALTER TABLE "person" ADD COLUMN IF NOT EXISTS "birthLat" DOUBLE PRECISION;
ALTER TABLE "person" ADD COLUMN IF NOT EXISTS "birthLon" DOUBLE PRECISION;
