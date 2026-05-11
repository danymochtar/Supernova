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

/** Generic JSON variant — stash any structured payload under `meta.data`. */
export async function getCachedJson<T = unknown>(userId: string, key: string): Promise<T | null> {
  const row = await prisma.numerologyCache.findUnique({
    where: { userId_key: { userId, key } },
    select: { meta: true },
  });
  if (!row?.meta) return null;
  const meta = row.meta as { data?: unknown };
  return meta.data === undefined ? null : (meta.data as T);
}

export async function setCachedJson(
  userId: string,
  key: string,
  data: unknown,
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
      meta: { data, ...extra, generatedAt: new Date().toISOString() } as object,
    },
    update: {
      meta: { data, ...extra, generatedAt: new Date().toISOString() } as object,
    },
  });
}

/**
 * Wipe every cached row whose `key` contains the given substring for this
 * user. Used when a Person record is edited so AI bodies that bake in the
 * person's name (relationship profile, pair narratives) regenerate fresh
 * instead of showing the pre-edit text. Cache keys use `:${personId}:` as
 * a natural delimiter, so passing the personId as the substring matches
 * every related key.
 */
export async function deleteCachedByKeyContains(
  userId: string,
  substring: string,
): Promise<void> {
  await prisma.numerologyCache.deleteMany({
    where: { userId, key: { contains: substring } },
  });
}
