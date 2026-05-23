import { personalCycles } from '@/lib/numerology';
import type { Locale } from '@/lib/i18n/config';
import type { BirthDate } from '@/lib/numerology/types';
import type { FeedbackRating } from '@prisma/client';

/** Numeric mapping of the 5-point rating enum so we can average. */
export const RATING_VALUE: Record<FeedbackRating, number> = {
  GREAT: 5,
  GOOD: 4,
  NEUTRAL: 3,
  OFF: 2,
  HARD: 1,
};

/** Day-of-week index 0-6 (0 = Sunday). */
const WEEKDAY_LABELS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_LABELS_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export interface FeedbackRow {
  date: Date; // stored at UTC midnight
  rating: FeedbackRating;
  tags: string[];
}

export interface PatternBucket {
  /** Bucket key — e.g. "5" for PD 5, "Mon" for Monday, "work" for tag work. */
  key: string;
  count: number;
  avg: number;
  /** Best/worst can be derived from `avg`; this lets the UI sort easily. */
  ratings: FeedbackRating[];
}

export interface PatternsSummary {
  totalEntries: number;
  windowDays: number;
  /** Average rating across the window (1-5). null when no entries. */
  avg: number | null;
  byPersonalDay: PatternBucket[];
  byWeekday: PatternBucket[];
  byTag: PatternBucket[];
  /** Day-by-day trend, oldest first. Date is the UTC-day key. */
  trend: Array<{ date: Date; rating: number }>;
}

function bucketize(
  rows: Array<{ key: string; rating: FeedbackRating }>,
): PatternBucket[] {
  const buckets = new Map<string, FeedbackRating[]>();
  for (const r of rows) {
    if (!buckets.has(r.key)) buckets.set(r.key, []);
    buckets.get(r.key)!.push(r.rating);
  }
  return [...buckets.entries()]
    .map(([key, ratings]) => ({
      key,
      count: ratings.length,
      avg: ratings.reduce((a, r) => a + RATING_VALUE[r], 0) / ratings.length,
      ratings,
    }))
    .sort((a, b) => b.count - a.count || b.avg - a.avg);
}

/**
 * Aggregate feedback rows into deterministic patterns. Pure function — caller
 * supplies the rows and the user's birth date (for Personal Day computation
 * on each historical date).
 */
export function aggregate(
  rows: FeedbackRow[],
  dob: BirthDate,
  windowDays: number,
  weekdayLocale: Locale = 'id',
): PatternsSummary {
  if (rows.length === 0) {
    return {
      totalEntries: 0,
      windowDays,
      avg: null,
      byPersonalDay: [],
      byWeekday: [],
      byTag: [],
      trend: [],
    };
  }

  const labels = weekdayLocale === 'id' ? WEEKDAY_LABELS_ID : WEEKDAY_LABELS_EN;

  const byPdRows = rows.map((r) => {
    const ctx = {
      year: r.date.getUTCFullYear(),
      month: r.date.getUTCMonth() + 1,
      day: r.date.getUTCDate(),
    };
    const pd = personalCycles(dob, ctx).personalDay.reduced;
    return { key: String(pd), rating: r.rating };
  });

  const byWeekdayRows = rows.map((r) => ({
    key: labels[r.date.getUTCDay()]!,
    rating: r.rating,
  }));

  const byTagRows = rows.flatMap((r) =>
    r.tags.map((tag) => ({ key: tag.toLowerCase(), rating: r.rating })),
  );

  const trend = rows.map((r) => ({ date: r.date, rating: RATING_VALUE[r.rating] }));
  const avg =
    rows.reduce((a, r) => a + RATING_VALUE[r.rating], 0) / rows.length;

  return {
    totalEntries: rows.length,
    windowDays,
    avg,
    byPersonalDay: bucketize(byPdRows),
    byWeekday: bucketize(byWeekdayRows),
    byTag: bucketize(byTagRows),
    trend,
  };
}

/**
 * Compact prompt-ready summary used by the daily reading and Q&A flows.
 * Returns null when there's not enough data — the AI prompt should omit
 * the `<recent_patterns>` block entirely in that case.
 */
export function promptSummary(s: PatternsSummary): string | null {
  if (s.totalEntries < 7) return null;

  const top = (b: PatternBucket[], n: number) =>
    b
      .slice(0, n)
      .map((x) => `${x.key} (avg ${x.avg.toFixed(1)}, n=${x.count})`)
      .join(', ');

  const lines = [
    `entries: ${s.totalEntries} over last ${s.windowDays} days`,
    `overall avg rating: ${s.avg?.toFixed(2) ?? 'n/a'} / 5`,
  ];

  if (s.byPersonalDay.length) lines.push(`top by Personal Day: ${top(s.byPersonalDay, 3)}`);
  if (s.byWeekday.length) lines.push(`top by weekday: ${top(s.byWeekday, 3)}`);
  if (s.byTag.length) lines.push(`top tags: ${top(s.byTag, 5)}`);

  return lines.join('\n');
}
