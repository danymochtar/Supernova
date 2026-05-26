-- Curhat capability tag on journal entries (pribadi/perjalanan/percintaan/
-- keuangan/karier/relationship), derived from the source chat turns' topic.
-- Nullable; existing rows stay NULL and group under "Lainnya".
ALTER TABLE "journal_entry" ADD COLUMN "category" TEXT;
