-- Profile: lastName becomes optional, add nickname for Minor numbers.
ALTER TABLE "profile" ALTER COLUMN "lastName" DROP NOT NULL;
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "nickname" TEXT;

-- Person: same treatment.
ALTER TABLE "person" ALTER COLUMN "lastName" DROP NOT NULL;
ALTER TABLE "person" ADD COLUMN IF NOT EXISTS "nickname" TEXT;
