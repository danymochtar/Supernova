/**
 * Targeted: clear only DailyReading rows so today's reading regenerates
 * with the latest prompt + title format. Everything else (people,
 * About Me carousel, chat history, feedback) is preserved.
 *
 *   node scripts/reset-daily-readings.mjs
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const { count } = await prisma.dailyReading.deleteMany({});
  console.log(`Deleted ${count} daily reading row(s). Reload the dashboard to regenerate.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
