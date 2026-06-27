-- Add Human Design (Ra Uru Hu) enums + 8 cached chart columns on Profile.
-- The full computed bodygraph (centers, channels, 26 planetary activations)
-- lives in `hdChart Json` — the discrete columns above it expose the
-- 5 user-facing values (type, strategy, authority, profile lines,
-- definition, incarnation cross name) for fast read paths and lens
-- gating in `compatibilityScore` + AI prompt assembly.

-- All four enums use the idempotent recovery pattern matching the
-- ZodiacSign migration (20260620000100_add_zodiac_fields). Re-running
-- this migration against a partially-applied DB is a no-op.

DO $$ BEGIN
  CREATE TYPE "HDType" AS ENUM (
    'GENERATOR',
    'MANIFESTING_GENERATOR',
    'MANIFESTOR',
    'PROJECTOR',
    'REFLECTOR'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "HDStrategy" AS ENUM (
    'RESPOND',
    'INFORM',
    'WAIT_INVITATION',
    'WAIT_LUNAR'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "HDAuthority" AS ENUM (
    'EMOTIONAL',
    'SACRAL',
    'SPLENIC',
    'EGO',
    'SELF_PROJECTED',
    'MENTAL',
    'LUNAR',
    'NONE'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "HDDefinition" AS ENUM (
    'SINGLE',
    'SPLIT',
    'TRIPLE_SPLIT',
    'QUAD_SPLIT',
    'NONE'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Profile columns. All nullable — populated by computeHumanDesign() on
-- profile-edit submit when (birthTime, birthLat, birthLon, birthTimezone)
-- are all present. Otherwise null and the Life-tab "Desain Manusia"
-- section renders an empty state prompting the user to add birth data.
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "hdType" "HDType";
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "hdStrategy" "HDStrategy";
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "hdAuthority" "HDAuthority";
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "hdProfileConscious" INTEGER;
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "hdProfileUnconscious" INTEGER;
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "hdDefinition" "HDDefinition";
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "hdIncarnationCross" TEXT;
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "hdChart" JSONB;
