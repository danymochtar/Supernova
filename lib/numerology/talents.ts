import { letterValue } from './letterMap';
import type { CoreProfile } from './types';

/**
 * "Talent Profile" digit distribution — a weighted blend of the user's
 * core numbers and the letters in their full name. Modeled after World
 * Numerology's Proportional Numerology Chart, where the dominant bars
 * line up with the user's actual core numbers (Life Path, Expression,
 * Soul Urge, Personality, Birthday), not just the letter distribution.
 *
 * Weighting (tuned against a real WN reference profile so the chart
 * shape matches — 5/6 close together when Pers and Expr land on
 * neighbouring digits, 8 strong when both SU and BD reduce to 8, etc.):
 * - Life Path / Expression / Soul Urge / Personality: 4 points each
 * - Birthday: 2 points (it's just the day-of-month digit, lower weight)
 * - Each letter in the full name: 1 point
 *
 * Maturity is intentionally NOT included — it would double-count one
 * digit when LP+Expr happens to land on the same digit as another core
 * (e.g. Dany's LP=1, Expr=5 → Maturity=6, but Personality is already
 * 6, which inflates that bar by 50% relative to WN's actual chart).
 *
 * Master numbers (11/22/33) are reduced to their single-digit equivalent
 * (2/4/6) for this proportional view since the chart is digits 1-9.
 * Karmic-debt compounds (13/14/16/19) already use their reduced single
 * digit via NumerologyResult.reduced.
 */

export type TalentDigit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface TalentSlice {
  digit: TalentDigit;
  /** Percentage of total weighted points, rounded to 1 decimal. */
  percentage: number;
  /** Raw letter count from the user's full name (no weighting). */
  letterCount: number;
}

export interface TalentDistribution {
  /** Always length 9, in digit order 1..9. */
  slices: TalentSlice[];
  /** Total counted letters in the name (denominator for letterCount). */
  totalLetters: number;
  /** Top 3 digits by descending percentage. */
  dominant: TalentDigit[];
  /**
   * Digits missing entirely from the name's letter values — i.e. the
   * Pythagorean "karmic lessons". These are the lessons the soul came to
   * develop. NOT the same as low-percentage digits, which still got core
   * weight contributions.
   */
  absent: TalentDigit[];
}

/** Reduce master numbers (11/22/33) to their single-digit equivalents
 *  for the proportional digit view; pass 1-9 through unchanged. */
function toSingle(n: number): number {
  if (n === 11) return 2;
  if (n === 22) return 4;
  if (n === 33) return 6;
  return n;
}

const CORE_WEIGHT = 4;
const BIRTHDAY_WEIGHT = 2;
const LETTER_WEIGHT = 1;

export function talentDistribution(
  fullName: string,
  core: CoreProfile,
): TalentDistribution {
  const points: Record<TalentDigit, number> = {
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0,
  };
  const letters: Record<TalentDigit, number> = {
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0,
  };

  function bump(digit: number, weight: number) {
    const d = toSingle(digit);
    if (d >= 1 && d <= 9) points[d as TalentDigit] += weight;
  }

  bump(core.lifePath.reduced, CORE_WEIGHT);
  bump(core.expression.reduced, CORE_WEIGHT);
  bump(core.soulUrge.reduced, CORE_WEIGHT);
  bump(core.personality.reduced, CORE_WEIGHT);
  bump(core.birthday.reduced, BIRTHDAY_WEIGHT);

  // Letters from the name — weight 1 each.
  let totalLetters = 0;
  for (const ch of fullName.toUpperCase()) {
    const v = letterValue(ch);
    if (v >= 1 && v <= 9) {
      points[v as TalentDigit] += LETTER_WEIGHT;
      letters[v as TalentDigit] += 1;
      totalLetters++;
    }
  }

  const total = Object.values(points).reduce((a, b) => a + b, 0);

  const slices: TalentSlice[] = ([1, 2, 3, 4, 5, 6, 7, 8, 9] as const).map((d) => ({
    digit: d,
    percentage: total > 0 ? Math.round((points[d] / total) * 1000) / 10 : 0,
    letterCount: letters[d],
  }));

  const dominant = [...slices]
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 3)
    .map((s) => s.digit);

  // Absent = Pythagorean karmic lessons (digits 1-9 with zero letters).
  // Always pull from karmicLessons rather than re-deriving so the talents
  // page agrees with whatever karmic.ts reports elsewhere.
  const absent = core.karmicLessons.filter((n): n is TalentDigit => n >= 1 && n <= 9);

  return { slices, totalLetters, dominant, absent };
}
