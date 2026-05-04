-- Postgres requires ALTER TYPE ... ADD VALUE for enum extension. Each in
-- its own statement and outside of an explicit transaction. Order matters
-- for the BEFORE clause when you want them sorted in pg_enum, but for our
-- purposes the natural append order is fine — sort happens in app code.

ALTER TYPE "Relationship" ADD VALUE IF NOT EXISTS 'PARENT';
ALTER TYPE "Relationship" ADD VALUE IF NOT EXISTS 'CHILD';
ALTER TYPE "Relationship" ADD VALUE IF NOT EXISTS 'SIBLING';
