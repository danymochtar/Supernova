/**
 * One-off: clear all AI-generated / cached / activity data, keeping only
 * the user's identity (User, Session, Account, Verification), their own
 * Profile, and their saved People.
 *
 * Run after schema/prompt changes that invalidate cached output:
 *   pnpm node scripts/reset-generated-data.mjs
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const counts = {};

  counts.dailyReading = (await prisma.dailyReading.deleteMany({})).count;
  counts.qaHistory = (await prisma.qaHistory.deleteMany({})).count;
  counts.dailyFeedback = (await prisma.dailyFeedback.deleteMany({})).count;
  counts.numerologyCache = (await prisma.numerologyCache.deleteMany({})).count;
  counts.aiUsage = (await prisma.aiUsage.deleteMany({})).count;
  counts.conversationSummary = (await prisma.conversationSummary.deleteMany({})).count;
  counts.rateLimit = (await prisma.rateLimit.deleteMany({})).count;

  console.log('Reset complete:');
  for (const [k, v] of Object.entries(counts)) {
    console.log(`  ${k.padEnd(22)} ${v} rows deleted`);
  }
  console.log('Kept: User, Session, Account, Verification, Profile, Person, PushSubscription');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
