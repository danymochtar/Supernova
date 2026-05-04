import type { Relationship } from '@prisma/client';
import type { NumerologyResult } from '@/lib/numerology';
import { lensFor, pickResult, type CoreKey, type Lane } from './lens';

/**
 * Pythagorean compatibility score for a single number pair, 0-100.
 *
 * Tables synthesized from Decoz, Millman, and Glynis McCants. The score
 * is symmetric on (a, b) — only the digit pair matters. Cross-component
 * pairs (my Expression vs their Soul Urge) reuse the same table; what
 * differs is the interpretation, surfaced by the UI.
 *
 * - Same digit, cross component: 82 — clean fit (giver matches receiver,
 *   no stagnation risk because roles are differentiated)
 * - Same digit, same component: 76 — deep resonance, with stagnation /
 *   competition risk depending on number
 * - Listed harmonious pairs: 75 — supportive, complementary
 * - Neutral pairs: 60 — workable, neither boost nor friction
 * - Listed challenging pairs: 42 — friction; can become growth ground
 *   but starts hard
 *
 * Compared to the previous tier (80/78/70/55/45) we tightened so that
 * harmonics carry more weight (matchness lifts when the chemistry is
 * actually there) without flattening friction.
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

export function pairScore(
  a: NumerologyResult,
  b: NumerologyResult,
  cross = false,
): number {
  const x = a.reduced;
  const y = b.reduced;
  if (x === y) return cross ? 82 : 76;
  if (HARMONY[x]?.includes(y)) return 75;
  if (FRICTION[x]?.includes(y)) return 42;
  return 60;
}

export interface CoreLite {
  lifePath: NumerologyResult;
  expression: NumerologyResult;
  soulUrge: NumerologyResult;
  personality: NumerologyResult;
  birthday: NumerologyResult;
  karmicLessons: number[];
}

export interface LaneScore {
  /** Lane id (e.g. "lp-lp", "expr-su"). */
  key: string;
  meKey: CoreKey;
  themKey: CoreKey;
  cross: boolean;
  weight: number;
  /** Digit-pair score 0-100. */
  score: number;
  /** The two NumerologyResults compared, for UI rendering. */
  meResult: NumerologyResult;
  themResult: NumerologyResult;
}

export interface OverallScore {
  /** 0-100 weighted overall score. */
  overall: number;
  relationship: Relationship;
  /** Per-lane breakdown — already filtered to the relationship's lens. */
  lanes: LaneScore[];
  band: 'low' | 'fair' | 'good' | 'strong' | 'rare';
  /** Bonuses/penalties applied to the weighted average. */
  modifiers: { reason: string; delta: number }[];
}

/**
 * Compute an overall compatibility score for a relationship pair, using a
 * lens that picks which lanes to score and how to weight them.
 *
 * Crucially, the lens *does not* always compare same-to-same components.
 * For partners we compare my Expression to their Soul Urge (the giver-↔-
 * receiver dynamic). For colleagues we compare my Expression to their
 * Life Path (your output supports my mission). The numeric pair score is
 * still symmetric — what changes is which components are paired.
 */
export function compatibilityScore(
  me: CoreLite,
  them: CoreLite,
  relationship: Relationship,
): OverallScore {
  const lens = lensFor(relationship);

  const lanes: LaneScore[] = lens.lanes.map((lane: Lane) => {
    const meR = pickResult(me, lane.meKey);
    const themR = pickResult(them, lane.themKey);
    return {
      key: lane.key,
      meKey: lane.meKey,
      themKey: lane.themKey,
      cross: lane.cross,
      weight: lane.weight,
      score: pairScore(meR, themR, lane.cross),
      meResult: meR,
      themResult: themR,
    };
  });

  let overall = lanes.reduce((sum, l) => sum + l.score * l.weight, 0);

  const modifiers: OverallScore['modifiers'] = [];

  if (lens.enabledModifiers.has('masters')) {
    // Master numbers (11/22/33) elevate the relationship regardless of
    // who carries them. Both sides → +6 (deeper joint elevation). Only
    // one side → +3 (asymmetric — the master partner lifts the pair).
    // McCants and Decoz both treat masters as bringing spiritual weight
    // to anyone in their orbit, not just to a fellow master.
    const myMasters = [me.lifePath, me.expression, me.soulUrge].filter((x) => x.isMaster).length;
    const theirMasters = [them.lifePath, them.expression, them.soulUrge].filter((x) => x.isMaster).length;
    if (myMasters > 0 && theirMasters > 0) {
      modifiers.push({ reason: 'masters', delta: 6 });
      overall += 6;
    } else if (myMasters > 0 || theirMasters > 0) {
      modifiers.push({ reason: 'asymmetricMasters', delta: 3 });
      overall += 3;
    }
  }

  if (lens.enabledModifiers.has('soulUrgeMatch') && me.soulUrge.reduced === them.soulUrge.reduced) {
    modifiers.push({ reason: 'soulUrgeMatch', delta: 3 });
    overall += 3;
  }

  if (lens.enabledModifiers.has('lifePathMirror') && me.lifePath.reduced === them.lifePath.reduced) {
    modifiers.push({ reason: 'lifePathMirror', delta: 3 });
    overall += 3;
  }

  if (lens.enabledModifiers.has('sharedKarmicDebt')) {
    // Karmic debt is the bearer's own learning curve, not a relationship
    // burden. We only penalize when BOTH sides carry debt (true shared
    // trigger — same emotional/structural triggers can compound between
    // partners). One-sided debt is the bearer's solo work; the partner
    // is witness, not punished.
    //
    // Rationale: previous "-1 per occurrence" rule penalized non-debt
    // partners just for being adjacent to a debt-bearing person, which
    // didn't reflect how Decoz / McCants describe karmic debt's role
    // in pairings.
    const myDebts = [me.lifePath, me.expression, me.soulUrge].filter((x) => x.karmicDebt).length;
    const theirDebts = [them.lifePath, them.expression, them.soulUrge].filter((x) => x.karmicDebt).length;
    if (myDebts > 0 && theirDebts > 0) {
      modifiers.push({ reason: 'sharedKarmicDebt', delta: -2 });
      overall -= 2;
    }
  }

  if (lens.enabledModifiers.has('oldSoul')) {
    // "Old soul still learning" archetype: master number(s) in core +
    // multiple karmic lessons in the same person. High spiritual
    // capacity paired with explicit work-to-do. McCants treats this
    // profile as elevating to be around — they bring depth + humility
    // to a relationship. Recognize it on either side.
    const myMaster = [me.lifePath, me.expression, me.soulUrge].some((x) => x.isMaster);
    const theirMaster = [them.lifePath, them.expression, them.soulUrge].some((x) => x.isMaster);
    const oldSoul =
      (myMaster && me.karmicLessons.length >= 3) ||
      (theirMaster && them.karmicLessons.length >= 3);
    if (oldSoul) {
      modifiers.push({ reason: 'oldSoul', delta: 2 });
      overall += 2;
    }
  }

  if (lens.enabledModifiers.has('complementaryKarmic')) {
    // When YOUR strong core (LP / Expression / Soul Urge reduced)
    // matches one of your partner's karmic-lesson digits, you're a
    // natural teacher in the area they came here to develop. Count
    // matches both directions; each match adds +1 to a cap of +3.
    const myStrong = new Set(
      [me.lifePath.reduced, me.expression.reduced, me.soulUrge.reduced]
        .filter((n) => n >= 1 && n <= 9),
    );
    const theirStrong = new Set(
      [them.lifePath.reduced, them.expression.reduced, them.soulUrge.reduced]
        .filter((n) => n >= 1 && n <= 9),
    );
    let teachMatches = 0;
    for (const lesson of them.karmicLessons) if (myStrong.has(lesson)) teachMatches++;
    for (const lesson of me.karmicLessons) if (theirStrong.has(lesson)) teachMatches++;
    if (teachMatches > 0) {
      const delta = Math.min(teachMatches, 3);
      modifiers.push({ reason: 'complementaryKarmic', delta });
      overall += delta;
    }
  }

  overall = Math.max(0, Math.min(100, Math.round(overall)));

  let band: OverallScore['band'] = 'fair';
  if (overall >= 85) band = 'rare';
  else if (overall >= 75) band = 'strong';
  else if (overall >= 65) band = 'good';
  else if (overall >= 50) band = 'fair';
  else band = 'low';

  return { overall, relationship, lanes, band, modifiers };
}
