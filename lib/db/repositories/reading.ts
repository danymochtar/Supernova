import type { DailyReading, Prisma } from '@prisma/client';
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

export interface CreateReadingInput {
  userId: string;
  year: number;
  month: number;
  day: number;
  locale: 'id' | 'en';
  body: string;
  contextSnapshot: Prisma.InputJsonValue;
  inputTokens: number;
  outputTokens: number;
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
    },
  });
}
