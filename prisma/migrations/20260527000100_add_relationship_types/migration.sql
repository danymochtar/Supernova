-- AlterEnum: add business partner, close friend, and acquaintance relationship types
ALTER TYPE "Relationship" ADD VALUE IF NOT EXISTS 'BUSINESS_PARTNER';
ALTER TYPE "Relationship" ADD VALUE IF NOT EXISTS 'BEST_FRIEND';
ALTER TYPE "Relationship" ADD VALUE IF NOT EXISTS 'ACQUAINTANCE';
