import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

/**
 * Prisma singleton.
 *
 * At runtime we connect via Prisma Accelerate (`PRISMA_ACCELERATE_URL`) so the
 * same client works in both Node and Edge runtimes.
 *
 * For local dev or migrations the env can fall back to the direct
 * `DATABASE_URL`.
 */

declare global {
  // eslint-disable-next-line no-var
  var __prisma: ReturnType<typeof makeClient> | undefined;
}

function makeClient() {
  const url = process.env.PRISMA_ACCELERATE_URL ?? process.env.DATABASE_URL;
  return new PrismaClient({
    datasourceUrl: url,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  }).$extends(withAccelerate());
}

export const prisma: ReturnType<typeof makeClient> =
  globalThis.__prisma ?? makeClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}
