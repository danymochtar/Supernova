import { prisma } from '@/lib/db/prisma';

/**
 * Daily rate-limit check + atomic increment.
 *
 * Returns `true` if the call is allowed (and increments), `false` if the user
 * has hit the limit for today. Bucket window is UTC-midnight for now (per-tz
 * windowing comes with M7 patterns work).
 *
 * NOTE (Decision #4 in plan): no premium tier in MVP — limits apply uniformly.
 * When tiers land, branch on profile.tier here.
 */
export async function checkAndIncrement(args: {
  userId: string;
  bucket: 'qa' | 'pwreset';
  limit: number;
}): Promise<{ allowed: boolean; count: number }> {
  const now = new Date();
  const windowStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  // Atomic upsert + return new count. Postgres handles the race.
  const row = await prisma.rateLimit.upsert({
    where: {
      userId_bucket_windowStart: {
        userId: args.userId,
        bucket: args.bucket,
        windowStart,
      },
    },
    update: { count: { increment: 1 } },
    create: { userId: args.userId, bucket: args.bucket, windowStart, count: 1 },
  });

  if (row.count > args.limit) {
    // Roll back so a denied attempt doesn't permanently inflate the counter.
    await prisma.rateLimit.update({
      where: { id: row.id },
      data: { count: { decrement: 1 } },
    });
    return { allowed: false, count: args.limit };
  }
  return { allowed: true, count: row.count };
}
