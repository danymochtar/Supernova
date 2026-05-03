-- Add free-form personal notes to Profile so users can give the chat
-- assistant durable context about themselves (preferences, goals, life
-- situation). Nullable.

ALTER TABLE "profile" ADD COLUMN "personalNotes" TEXT;
