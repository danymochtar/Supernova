-- AlterTable: chat-mode preference (how Supernova engages — listen / probe / practical / reflective)
ALTER TABLE "Profile" ADD COLUMN "chatMode" TEXT NOT NULL DEFAULT 'listen';
