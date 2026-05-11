-- Drop the orphaned dashboardLayout column. The per-user widget reorder /
-- hide feature was removed in favor of a fixed dashboard order; nothing
-- reads or writes this column anymore.
ALTER TABLE "profile" DROP COLUMN IF EXISTS "dashboardLayout";
