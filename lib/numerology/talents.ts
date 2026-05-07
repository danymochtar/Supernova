import { letterValue } from './letterMap';

/**
 * "Talent Profile" digit distribution — count how often each digit 1-9
 * appears across the letters of the user's full name. Used by /talents
 * to render a proportional bar chart of which energies the user expresses.
 *
 * Inspired by World Numerology's Proportional Numerology Chart. The
 * methodology there is proprietary and probably weighs core numbers; we
 * use a simpler, fully deterministic letter-count which is enough for the
 * "where does most of my energy live?" read.
 */

export type TalentDigit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface TalentSlice {
  digit: TalentDigit;
  /** Raw letter count from the user's full name. */
  count: number;
  /** Percentage of total letters, rounded to 1 decimal (0-100). */
  percentage: number;
}

export interface TalentDistribution {
  /** Always length 9, in digit order 1..9. */
  slices: TalentSlice[];
  /** Total counted letters (denominator). */
  totalLetters: number;
  /** Digits sorted by descending percentage, top 3 with non-zero share. */
  dominant: TalentDigit[];
  /** Digits the name carries zero of — gaps / lessons-to-grow. */
  absent: TalentDigit[];
}

export function talentDistribution(fullName: string): TalentDistribution {
  const counts: Record<TalentDigit, number> = {
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0,
  };
  let total = 0;
  for (const ch of fullName.toUpperCase()) {
    const v = letterValue(ch);
    if (v >= 1 && v <= 9) {
      counts[v as TalentDigit]++;
      total++;
    }
  }

  const slices: TalentSlice[] = ([1, 2, 3, 4, 5, 6, 7, 8, 9] as const).map((d) => {
    const count = counts[d];
    const percentage = total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
    return { digit: d, count, percentage };
  });

  const dominant = [...slices]
    .sort((a, b) => b.percentage - a.percentage)
    .filter((s) => s.percentage > 0)
    .slice(0, 3)
    .map((s) => s.digit);

  const absent = slices.filter((s) => s.count === 0).map((s) => s.digit);

  return { slices, totalLetters: total, dominant, absent };
}
