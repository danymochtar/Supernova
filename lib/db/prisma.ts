import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

/**
 * Prisma singleton.
 *
 * We use Prisma Postgres, which speaks the Accelerate-style HTTP protocol
 * over a single `prisma+postgres://...` URL. The same client works in both
 * Node and Edge runtimes; no separate pooler URL needed.
 *
 * The `withAccelerate` extension is included free with Prisma Postgres and
 * is what enables the Edge-compatible HTTP transport.
 */

declare global {
  // eslint-disable-next-line no-var
  var __prisma: ReturnType<typeof makeClient> | undefined;
}

function makeClient() {
  const url = process.env.DATABASE_URL;
  if (!url && process.env.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL is not set');
  }
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
