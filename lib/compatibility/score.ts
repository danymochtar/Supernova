import type { NumerologyResult } from '@/lib/numerology';

/**
 * Pythagorean compatibility score for a single number pair, 0-100.
 *
 * Built from the traditional harmony / friction tables (Decoz, Millman):
 * - Same digit: deep resonance (80) — strong but at risk of stagnation
 * - Listed harmonious pairs: 70
 * - Neutral pairs: 55
 * - Listed challenging pairs: 45
 *
 * Master numbers (11/22/33) reduce to their single-digit form for the
 * table lookup. A master+master bonus is applied at the overall-score
 * level, not per pair.
 */
const HARMONY: Record<number, number[]> = {
  1: [3, 5, 6, 9],
  2: [4, 6, 8],
  3: [1, 5, 6, 9],
  4: [2, 6, 7, 8],
  5: [1, 3, 7],
  6: [1, 2, 3, 4, 8, 9],
  7: [4, 5, 9],
  8: [2, 4, 6],
  9: [1, 3, 6, 9],
};

const FRICTION: Record<number, number[]> = {
  1: [4, 7, 8],
  2: [1, 5, 7],
  3: [4, 7, 8],
  4: [1, 3, 5, 9],
  5: [2, 4, 6, 8],
  6: [5, 7],
  7: [1, 2, 3, 6, 8],
  8: [1, 3, 5, 7],
  9: [2, 4, 5, 7, 8],
};

export function pairScore(a: NumerologyResult, b: NumerologyResult): number {
  const x = a.reduced;
  const y = b.reduced;
  if (x === y) return 80;
  if (HARMONY[x]?.includes(y)) return 70;
  if (FRICTION[x]?.includes(y)) return 45;
  return 55;
}

export interface OverallScore {
  /** 0-100 weighted overall score. */
  overall: number;
  pairs: {
    lifePath: number;
    expression: number;
    soulUrge: number;
    birthday: number;
  };
  /** Free-text label for the score band. */
  band: 'low' | 'fair' | 'good' | 'strong' | 'rare';
  /** Bonuses/penalties applied to overall (transparent for UI). */
  modifiers: { reason: string; delta: number }[];
}

export interface CoreLite {
  lifePath: NumerologyResult;
  expression: NumerologyResult;
  soulUrge: NumerologyResult;
  personality: NumerologyResult;
  birthday: NumerologyResult;
  karmicLessons: number[];
}

const WEIGHTS = { lifePath: 0.35, expression: 0.25, soulUrge: 0.25, birthday: 0.15 };

export function compatibilityScore(me: CoreLite, them: CoreLite): OverallScore {
  const pairs = {
    lifePath: pairScore(me.lifePath, them.lifePath),
    expression: pairScore(me.expression, them.expression),
    soulUrge: pairScore(me.soulUrge, them.soulUrge),
    birthday: pairScore(me.birthday, them.birthday),
  };

  let overall =
    pairs.lifePath * WEIGHTS.lifePath +
    pairs.expression * WEIGHTS.expression +
    pairs.soulUrge * WEIGHTS.soulUrge +
    pairs.birthday * WEIGHTS.birthday;

  const modifiers: OverallScore['modifiers'] = [];

  const myMasters = [me.lifePath, me.expression, me.soulUrge].filter((x) => x.isMaster).length;
  const theirMasters = [them.lifePath, them.expression, them.soulUrge].filter((x) => x.isMaster).length;
  if (myMasters > 0 && theirMasters > 0) {
    modifiers.push({ reason: 'masters', delta: 5 });
    overall += 5;
  }

  // Soul Urge resonance — same deepest yearning.
  if (me.soulUrge.reduced === them.soulUrge.reduced) {
    modifiers.push({ reason: 'soulUrgeMatch', delta: 3 });
    overall += 3;
  }

  // Life Path mirror.
  if (me.lifePath.reduced === them.lifePath.reduced) {
    modifiers.push({ reason: 'lifePathMirror', delta: 3 });
    overall += 3;
  }

  // Karmic debts on both — shared heavy lessons can either bond or grind.
  const myDebts = [me.lifePath, me.expression, me.soulUrge].some((x) => x.karmicDebt);
  const theirDebts = [them.lifePath, them.expression, them.soulUrge].some((x) => x.karmicDebt);
  if (myDebts && theirDebts) {
    modifiers.push({ reason: 'sharedKarmicDebt', delta: -3 });
    overall -= 3;
  }

  overall = Math.max(0, Math.min(100, Math.round(overall)));

  let band: OverallScore['band'] = 'fair';
  if (overall >= 85) band = 'rare';
  else if (overall >= 75) band = 'strong';
  else if (overall >= 65) band = 'good';
  else if (overall >= 50) band = 'fair';
  else band = 'low';

  return { overall, pairs, band, modifiers };
}
