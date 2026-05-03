import { describe, expect, it } from 'vitest';
import { aggregate, promptSummary, RATING_VALUE } from '../aggregate';
import type { FeedbackRow } from '../aggregate';
import type { BirthDate } from '@/lib/numerology/types';

const dob: BirthDate = { year: 1990, month: 5, day: 15 };

function row(year: number, month: number, day: number, rating: FeedbackRow['rating'], tags: string[] = []): FeedbackRow {
  return { date: new Date(Date.UTC(year, month - 1, day)), rating, tags };
}

describe('aggregate', () => {
  it('returns zeros for empty input', () => {
    const s = aggregate([], dob, 30);
    expect(s.totalEntries).toBe(0);
    expect(s.avg).toBeNull();
    expect(s.byPersonalDay).toEqual([]);
  });

  it('computes overall average across the 5-point scale', () => {
    const s = aggregate(
      [row(2026, 5, 1, 'GREAT'), row(2026, 5, 2, 'GOOD'), row(2026, 5, 3, 'NEUTRAL')],
      dob,
      30,
    );
    expect(s.totalEntries).toBe(3);
    expect(s.avg).toBeCloseTo((5 + 4 + 3) / 3);
  });

  it('buckets by Personal Day, weekday, and tag', () => {
    const rows = [
      row(2026, 5, 1, 'GREAT', ['work', 'flow']),
      row(2026, 5, 2, 'OFF', ['work']),
      row(2026, 5, 3, 'GOOD', ['family']),
    ];
    const s = aggregate(rows, dob, 30);
    expect(s.byPersonalDay.length).toBeGreaterThan(0);
    expect(s.byWeekday.length).toBeGreaterThan(0);
    const work = s.byTag.find((b) => b.key === 'work');
    expect(work?.count).toBe(2);
    expect(work?.avg).toBeCloseTo((RATING_VALUE.GREAT + RATING_VALUE.OFF) / 2);
  });

  it('promptSummary returns null below threshold', () => {
    const s = aggregate([row(2026, 5, 1, 'GREAT')], dob, 30);
    expect(promptSummary(s)).toBeNull();
  });

  it('promptSummary serializes when threshold met', () => {
    const rows: FeedbackRow[] = Array.from({ length: 10 }, (_, i) =>
      row(2026, 5, i + 1, 'GOOD', ['work']),
    );
    const s = aggregate(rows, dob, 30);
    const text = promptSummary(s);
    expect(text).toContain('entries: 10');
    expect(text).toContain('top tags: work');
  });
});
