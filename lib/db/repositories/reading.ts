import type { DailyReading, HDType as PrismaHDType, Prisma } from '@prisma/client';
import type { Locale } from '@/lib/i18n/config';
import type { HDType } from '@/lib/humanDesign/types';
import { prisma } from '@/lib/db/prisma';

/** Date stored at UTC midnight so the unique (userId, date) key is stable. */
function toDayMarker(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

export async function getReadingForLocalDay(
  userId: string,
  year: number,
  month: number,
  day: number,
): Promise<DailyReading | null> {
  return prisma.dailyReading.findUnique({
    where: { userId_date: { userId, date: toDayMarker(year, month, day) } },
  });
}

export async function deleteReadingForLocalDay(
  userId: string,
  year: number,
  month: number,
  day: number,
): Promise<void> {
  await prisma.dailyReading.deleteMany({
    where: { userId, date: toDayMarker(year, month, day) },
  });
}

export interface CreateReadingInput {
  userId: string;
  year: number;
  month: number;
  day: number;
  locale: Locale;
  body: string;
  contextSnapshot: Prisma.InputJsonValue;
  inputTokens: number;
  outputTokens: number;
  /** Snapshot of the user's HD type at generation time. Used by the
   *  cache-bust gate to regenerate readings when the chart changes. */
  hdTypeAtCache?: HDType | null;
}

export async function createReading(input: CreateReadingInput): Promise<DailyReading> {
  return prisma.dailyReading.create({
    data: {
      userId: input.userId,
      date: toDayMarker(input.year, input.month, input.day),
      locale: input.locale,
      body: input.body,
      contextSnapshot: input.contextSnapshot,
      inputTokens: input.inputTokens,
      outputTokens: input.outputTokens,
      hdTypeAtCache: (input.hdTypeAtCache as PrismaHDType | null) ?? null,
    },
  });
}
