import { PrismaClient } from '@prisma/client';

/**
 * Prisma singleton.
 *
 * Uses a plain Postgres connection (`DATABASE_URL`). Edge runtime support is
 * deferred — when M5 (Q&A streaming) lands we'll either run that route on
 * Node, or wire a serverless HTTP driver (Neon / Prisma Postgres) for the
 * Edge route specifically.
 */

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function makeClient() {
  const url = process.env.DATABASE_URL;
  if (!url && process.env.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL is not set');
  }
  return new PrismaClient({
    datasourceUrl: url,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

export const prisma: PrismaClient = globalThis.__prisma ?? makeClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}
