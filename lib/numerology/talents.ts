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
 * Plus sub-fractional tiebreakers so the 9 digits always sort to a
 * unique rank (1..9) — no two digits ever come out at the same
 * sortable score, even when the displayed percentages happen to round
 * to the same number:
 * - Letter count gets a 0.01-scale bonus (more letters → higher rank).
 * - Position-weighted letter sum (1/n for the n-th letter) gets a
 *   0.0001-scale bonus — earlier letters in the name nudge the rank up
 *   ("cornerstone" effect, a real numerology concept).
 * - As a final deterministic fallback, lower digit wins.
 * Tiebreakers are sized below percentage rounding so they don't change
 * the visible bar / number, only the sort order.
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
  /** Percentage of total weighted points, rounded to 1 decimal. May tie
   *  visually with another digit; use \`rank\` for a unique ordering. */
  percentage: number;
  /** Raw letter count from the user's full name (no weighting). */
  letterCount: number;
  /** Unique rank 1..9 across the 9 digits. 1 = most dominant. No ties. */
  rank: number;
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
  const positionScore: Record<TalentDigit, number> = {
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

  // Letters from the name — weight 1 each, plus a 1/n positional
  // micro-bonus for the n-th letter so earlier letters break ties first.
  let totalLetters = 0;
  let pos = 0;
  for (const ch of fullName.toUpperCase()) {
    const v = letterValue(ch);
    if (v >= 1 && v <= 9) {
      pos++;
      const d = v as TalentDigit;
      points[d] += LETTER_WEIGHT;
      letters[d] += 1;
      positionScore[d] += 1 / pos;
      totalLetters++;
    }
  }

  const total = Object.values(points).reduce((a, b) => a + b, 0);

  // Sortable score = points + sub-percent tiebreakers. Tiebreakers are
  // scaled so they fall below the percentage display rounding, so the
  // bars / numbers don't shift but the rank order is always unique.
  function sortScore(d: TalentDigit): number {
    return (
      points[d] +
      letters[d] * 0.01 +
      positionScore[d] * 0.0001 +
      // Final fallback so two truly-identical configurations still sort
      // deterministically (lower digit wins).
      (10 - d) * 0.000001
    );
  }

  const ranked = ([1, 2, 3, 4, 5, 6, 7, 8, 9] as const)
    .map((d) => ({ d, s: sortScore(d) }))
    .sort((a, b) => b.s - a.s);
  const rankByDigit = new Map<TalentDigit, number>();
  ranked.forEach((entry, idx) => rankByDigit.set(entry.d, idx + 1));

  const slices: TalentSlice[] = ([1, 2, 3, 4, 5, 6, 7, 8, 9] as const).map((d) => ({
    digit: d,
    percentage: total > 0 ? Math.round((points[d] / total) * 1000) / 10 : 0,
    letterCount: letters[d],
    rank: rankByDigit.get(d) ?? 9,
  }));

  // Top 3 by unique rank — no ties possible.
  const dominant = slices
    .filter((s) => s.rank <= 3)
    .sort((a, b) => a.rank - b.rank)
    .map((s) => s.digit);

  // Absent = Pythagorean karmic lessons (digits 1-9 with zero letters).
  // Always pull from karmicLessons rather than re-deriving so the talents
  // page agrees with whatever karmic.ts reports elsewhere.
  const absent = core.karmicLessons.filter((n): n is TalentDigit => n >= 1 && n <= 9);

  return { slices, totalLetters, dominant, absent };
}

/**
 * Talent groups inspired by World Numerology's "Talents and Traits"
 * profile (74 traits across 11 groups). For each group we declare which
 * digits feed into the rating and with what weight; the rating itself
 * is the weighted average of those digits' percentages from
 * \`talentDistribution\`.
 *
 * Five groups so far (matching the five user screenshots — Individualism,
 * Inner Self, Artistic, Enjoy Life, Humanitarian). The remaining six
 * (per WN's "eleven groups") get added as the reference is supplied.
 *
 * Weights are 0-1 floats indicating how strongly a digit feeds the group.
 * E.g. Individualism is heavily 1-driven (weight 1.0) but 8 (drive) and
 * 5 (independence/courage) also contribute meaningfully.
 */
export type TalentGroupId =
  | 'individualism'
  | 'innerSelf'
  | 'artistic'
  | 'enjoyLife'
  | 'humanitarian'
  | 'sensitive'
  | 'generousCaring'
  | 'romantic'
  | 'perseverance'
  | 'practical';

export interface TalentGroupDef {
  id: TalentGroupId;
  /** Digit → 0..1 contribution weight. Missing digits don't contribute. */
  digits: Partial<Record<TalentDigit, number>>;
}

export const TALENT_GROUPS: TalentGroupDef[] = [
  {
    id: 'individualism',
    // Leadership, independence, ambition — 1 is the dominant digit, 8
    // (drive/authority) and 5 (courage/independence) round it out.
    digits: { 1: 1.0, 8: 0.7, 5: 0.5 },
  },
  {
    id: 'innerSelf',
    // Spirituality, intuition, depth, contemplation — 7 is the seeker,
    // 9 the universal/idealist, 2 the intuitive sensitive.
    digits: { 7: 1.0, 9: 0.5, 2: 0.4 },
  },
  {
    id: 'artistic',
    // Creativity, expression, beauty — 3 is creative/expressive, 6
    // brings aesthetics, 9 universal artistry, 7 the depth/perfection.
    digits: { 3: 1.0, 6: 0.7, 9: 0.5, 7: 0.3 },
  },
  {
    id: 'enjoyLife',
    // Joy, optimism, sociability — 3 is bouncy/expressive, 5 sensual/
    // pleasure, 6 harmonious connection, 1 confident vitality.
    digits: { 3: 1.0, 5: 0.7, 6: 0.5, 1: 0.4 },
  },
  {
    id: 'humanitarian',
    // Empathy, compassion, service — 9 the humanitarian, 6 the carer,
    // 2 the sensitive supporter.
    digits: { 9: 1.0, 6: 0.6, 2: 0.4 },
  },
  {
    id: 'sensitive',
    // Emotional sensitivity, empathy with strangers, impulsive giving —
    // 2 is the sensitive intuitive, 6 the carer, 9 universal compassion.
    digits: { 2: 1.0, 6: 0.7, 9: 0.5 },
  },
  {
    id: 'generousCaring',
    // Pillar of strength for friends/family, easy to confide in — 6 is
    // the family/community number, 9 humanitarian generosity, 2 sensitive
    // supporter, 1 dependable strength.
    digits: { 6: 1.0, 9: 0.5, 2: 0.4, 1: 0.3 },
  },
  {
    id: 'romantic',
    // Gives love fully, long-term loyalty, optimistic in love — 6 is
    // the romance/family number, 2 partnership, 3 romantic expression.
    digits: { 6: 1.0, 2: 0.7, 3: 0.5 },
  },
  {
    id: 'perseverance',
    // Persistence, success orientation, finding niche, long-term focus —
    // 4 the disciplined builder, 8 achievement-oriented, 1 driven.
    digits: { 4: 1.0, 8: 0.8, 1: 0.6 },
  },
  {
    id: 'practical',
    // Efficient time use, accountability, high standards, structured
    // execution — 4 the practical disciplined, 8 results-oriented,
    // 1 sets standards.
    digits: { 4: 1.0, 8: 0.7, 1: 0.4 },
  },
];

export type TalentRating = 'high' | 'medium' | 'low';

export interface TalentGroupResult {
  id: TalentGroupId;
  /** Weighted average of contributing digit percentages (0-100). */
  score: number;
  rating: TalentRating;
}

/**
 * Compute a rating bucket for each defined group from the user's
 * distribution. Thresholds are tuned so the screenshots' "high" cases
 * all bucket as high — most users will see a mix of high/medium with
 * one or two lows, mirroring WN's chart shape.
 */
export function rateTalentGroups(slices: TalentSlice[]): TalentGroupResult[] {
  const byDigit = new Map<TalentDigit, number>();
  for (const s of slices) byDigit.set(s.digit, s.percentage);

  return TALENT_GROUPS.map((g) => {
    const totalWeight = Object.values(g.digits).reduce<number>((a, b) => a + (b ?? 0), 0);
    let weightedSum = 0;
    for (const [digitStr, weight] of Object.entries(g.digits)) {
      const d = Number(digitStr) as TalentDigit;
      const pct = byDigit.get(d) ?? 0;
      weightedSum += pct * (weight ?? 0);
    }
    const score = totalWeight > 0 ? weightedSum / totalWeight : 0;
    let rating: TalentRating;
    if (score >= 16) rating = 'high';
    else if (score >= 9) rating = 'medium';
    else rating = 'low';
    return { id: g.id, score: Math.round(score * 10) / 10, rating };
  });
}

/**
 * Vocational aptitude — separate from trait groups. WN's report rates
 * the user's fit across 7 career fields ("Vocations"), each driven by
 * a different mix of digits. Same weighting + bucketing scheme as the
 * trait groups (uniform thresholds keep the high/medium/low bars
 * meaningful across both sections).
 */
export type TalentVocationId =
  | 'business'
  | 'medicineEducation'
  | 'legalPolitics'
  | 'artsDesign'
  | 'salesPr'
  | 'scienceEngineering'
  | 'agriculture';

export interface TalentVocationDef {
  id: TalentVocationId;
  digits: Partial<Record<TalentDigit, number>>;
}

export const TALENT_VOCATIONS: TalentVocationDef[] = [
  {
    id: 'business',
    // Executive instinct, results orientation, leadership.
    digits: { 8: 1.0, 1: 0.7, 4: 0.5 },
  },
  {
    id: 'medicineEducation',
    // Caring/teaching, service, analytical depth.
    digits: { 6: 1.0, 9: 0.6, 7: 0.4 },
  },
  {
    id: 'legalPolitics',
    // Authority, structure, leadership, justice.
    digits: { 8: 1.0, 1: 0.7, 4: 0.5, 9: 0.3 },
  },
  {
    id: 'artsDesign',
    // Expression, aesthetic sensibility, perfectionist depth.
    digits: { 3: 1.0, 6: 0.7, 7: 0.4 },
  },
  {
    id: 'salesPr',
    // Charm, persuasion, communication, drive.
    digits: { 5: 1.0, 3: 0.7, 1: 0.4 },
  },
  {
    id: 'scienceEngineering',
    // Practical+analytical+results combo. STEM vibe.
    digits: { 4: 1.0, 7: 0.7, 8: 0.4 },
  },
  {
    id: 'agriculture',
    // Earthbound work, nurturing patience, slow-burn.
    digits: { 4: 1.0, 6: 0.7, 2: 0.3 },
  },
];

export interface TalentVocationResult {
  id: TalentVocationId;
  score: number;
  rating: TalentRating;
}

export function rateVocations(slices: TalentSlice[]): TalentVocationResult[] {
  const byDigit = new Map<TalentDigit, number>();
  for (const s of slices) byDigit.set(s.digit, s.percentage);

  return TALENT_VOCATIONS.map((v) => {
    const totalWeight = Object.values(v.digits).reduce<number>((a, b) => a + (b ?? 0), 0);
    let weightedSum = 0;
    for (const [digitStr, weight] of Object.entries(v.digits)) {
      const d = Number(digitStr) as TalentDigit;
      const pct = byDigit.get(d) ?? 0;
      weightedSum += pct * (weight ?? 0);
    }
    const score = totalWeight > 0 ? weightedSum / totalWeight : 0;
    let rating: TalentRating;
    if (score >= 16) rating = 'high';
    else if (score >= 9) rating = 'medium';
    else rating = 'low';
    return { id: v.id, score: Math.round(score * 10) / 10, rating };
  });
}
