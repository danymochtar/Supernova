-- Vocation taxonomy modernized: the dated "agriculture" field (digit 4/6/2)
-- is now "operations" (project/people management, customer success,
-- community) — a digital-era fit for the same numerology energy. Rewrite any
-- persisted career-entry classifications so existing rows keep a valid label.
UPDATE "career_entry" SET "vocationId" = 'operations' WHERE "vocationId" = 'agriculture';
