import { prisma } from '@/lib/db/prisma';

/**
 * Generic key-value text cache layered on top of the NumerologyCache table.
 * Used for cross-request artifacts like the AI-synthesized "About Me" summary
 * that depend only on the (immutable) profile and don't change per visit.
 *
 * The compound / reduced / isMaster columns aren't meaningful for these rows;
 * we set placeholder zeros and stash the payload in `meta.body`.
 */

export async function getCachedText(userId: string, key: string): Promise<string | null> {
  const row = await prisma.numerologyCache.findUnique({
    where: { userId_key: { userId, key } },
    select: { meta: true },
  });
  if (!row?.meta) return null;
  const meta = row.meta as { body?: unknown };
  return typeof meta.body === 'string' ? meta.body : null;
}

export async function setCachedText(
  userId: string,
  key: string,
  body: string,
  extra?: Record<string, unknown>,
): Promise<void> {
  await prisma.numerologyCache.upsert({
    where: { userId_key: { userId, key } },
    create: {
      userId,
      key,
      compound: 0,
      reduced: 0,
      isMaster: false,
      meta: { body, ...extra, generatedAt: new Date().toISOString() },
    },
    update: {
      meta: { body, ...extra, generatedAt: new Date().toISOString() },
    },
  });
}
