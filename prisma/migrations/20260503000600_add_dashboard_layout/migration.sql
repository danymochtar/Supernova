-- User-customizable dashboard widget order + visibility.
-- JSON array of `{id, hidden}` objects. Null = default order, all visible.

ALTER TABLE "profile" ADD COLUMN "dashboardLayout" TEXT;
