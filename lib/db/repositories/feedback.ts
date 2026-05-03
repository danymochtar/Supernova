import type { DailyFeedback, FeedbackRating } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

function toDayMarker(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

export async function getFeedbackForLocalDay(
  userId: string,
  year: number,
  month: number,
  day: number,
): Promise<DailyFeedback | null> {
  return prisma.dailyFeedback.findUnique({
    where: { userId_date: { userId, date: toDayMarker(year, month, day) } },
  });
}

export async function upsertFeedback(input: {
  userId: string;
  year: number;
  month: number;
  day: number;
  rating: FeedbackRating;
  note?: string | null;
  tags?: string[];
}): Promise<DailyFeedback> {
  const date = toDayMarker(input.year, input.month, input.day);
  return prisma.dailyFeedback.upsert({
    where: { userId_date: { userId: input.userId, date } },
    create: {
      userId: input.userId,
      date,
      rating: input.rating,
      note: input.note ?? null,
      tags: input.tags ?? [],
    },
    update: {
      rating: input.rating,
      note: input.note ?? null,
      tags: input.tags ?? [],
    },
  });
}

/**
 * Returns feedback rows for the last `days` calendar days (in UTC for storage,
 * but the caller is responsible for choosing the right window in their tz).
 */
export async function getRecentFeedback(
  userId: string,
  fromDate: Date,
): Promise<DailyFeedback[]> {
  return prisma.dailyFeedback.findMany({
    where: { userId, date: { gte: fromDate } },
    orderBy: { date: 'asc' },
  });
}
