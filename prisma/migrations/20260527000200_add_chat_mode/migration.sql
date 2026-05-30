-- AlterTable: chat-mode preference (how Supernova engages — listen / probe / practical / reflective)
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "chatMode" TEXT NOT NULL DEFAULT 'listen';
