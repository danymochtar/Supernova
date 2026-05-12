import type { Relationship } from '@prisma/client';
import { bridges, type NumerologyResult } from '@/lib/numerology';
import { lensFor, pickResult, type CoreKey, type Lane } from './lens';

/**
 * Pythagorean compatibility score for a single digit pair, 0-100.
 *
 * Verdict table synthesizes McCants's "Three Vibrational Families" + Decoz's
 * Life-Path-pair narratives:
 *
 *   Mind family:      1, 5, 7   (cerebral, independent, freedom-seeking)
 *   Creative family:  3, 6, 9   (expressive, emotional, humanitarian)
 *   Structure family: 2, 4, 8   (practical, security-seeking, methodical)
 *
 * In-family pairs are Natural Matches by default; Decoz narratives refine
 * within-family pairs that carry tension (1-7) or same-number power
 * struggles (1-1 / 8-8). Cross-family pairs use Decoz's explicit
 * Compatible / Highly Favorable / Challenge calls.
 *
 * Master numbers (11/22/33) reduce to their root (2/4/6) BEFORE the lookup,
 * per World Numerology / Decoz convention for the compatibility layer.
 * Master vibration is preserved separately by the `masters` modifier so it
 * still elevates the score; this just keeps the digit-pair tier honest.
 *
 * Tiers:
 *   88  Natural Match            (in-family) or strong cross-family Decoz favorable
 *   80  Highly Favorable         (e.g. 1-3, 2-6, 2-7, 3-5)
 *   72  Compatible / Favorable   (e.g. 4-7, 8-9)
 *   68  Workable                 (cross-family, no friction, no spark)
 *   60  Neutral                  (e.g. 1-9, 7-9, 7-7)
 *   50  Mixed / Volatile         (e.g. 3-7 "two weeks or a lifetime", 3-3)
 *   42  Challenge                (e.g. 2-5, 3-4, 4-5, 5-6, 6-7, 5-8, 7-8)
 *   36  Power-Struggle           (1-1, 1-8, 8-8 — command-energy clashes)
 *
 * Cross-component pairs (my Expression vs their Soul Urge etc.) get a small
 * +4 lift since giver/receiver pairings differentiate roles and avoid the
 * stagnation risk of same-component sameness.
 */

function toRoot(reduced: number): number {
  if (reduced === 11) return 2;
  if (reduced === 22) return 4;
  if (reduced === 33) return 6;
  return reduced;
}

// Symmetric verdict matrix indexed by digit 1-9. Same value at [a][b] and
// [b][a]. Derived by hand from the doc's pair-by-pair table.
const VERDICT: ReadonlyArray<ReadonlyArray<number>> = [
  /* 0 placeholder */ [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  /* 1 */ [0, 36, 68, 80, 68, 88, 68, 80, 36, 60],
  /* 2 */ [0, 68, 80, 68, 88, 42, 80, 80, 88, 68],
  /* 3 */ [0, 80, 68, 50, 38, 80, 88, 50, 50, 88],
  /* 4 */ [0, 68, 88, 38, 68, 38, 68, 72, 88, 60],
  /* 5 */ [0, 88, 42, 80, 38, 76, 42, 88, 42, 70],
  /* 6 */ [0, 68, 80, 88, 68, 42, 80, 42, 70, 88],
  /* 7 */ [0, 80, 80, 50, 72, 88, 42, 60, 42, 62],
  /* 8 */ [0, 36, 88, 50, 88, 42, 70, 42, 38, 70],
  /* 9 */ [0, 60, 68, 88, 60, 70, 88, 62, 70, 70],
];

export function pairScore(
  a: NumerologyResult,
  b: NumerologyResult,
  cross = false,
): number {
  const x = toRoot(a.reduced);
  const y = toRoot(b.reduced);
  if (x < 1 || x > 9 || y < 1 || y > 9) return 60;
  const base = VERDICT[x]![y] ?? 60;
  return cross ? Math.min(100, base + 4) : base;
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

  if (lens.enabledModifiers.has('bridgeFit')) {
    // Bridge Numbers (intra-personal integration gaps) tell us how each
    // partner navigates their own internal landscape — well-integrated
    // (small bridges) or stretched between two facets (large bridges).
    // The relationship between two people's bridge profiles produces a
    // few real dynamics worth scoring:
    //
    //   - Bridge Sync: their internal landscapes look similar (both
    //     small, or both stretched in similar pattern). Mutual "we get
    //     each other's struggle." Bonding.
    //   - Bridge Complement: one is integrated, the other stretched.
    //     The integrated partner offers steady ground for the stretched
    //     one's growth work. Natural teaching dynamic.
    //   - Mutual Stretch: both stretched on both bridges. Compound
    //     scatter risk — both get exhausted in the same way at the
    //     same time. Mild penalty.
    //
    // Thresholds tuned so most pairs land in one of the three buckets;
    // the modifier should be a regular signal, not a rare event.
    // The three cases are mutually exclusive; at most one fires.
    const myBr = bridges(me);
    const theirBr = bridges(them);
    const myLPE = myBr.lifePathExpression.reduced;
    const mySUP = myBr.soulUrgePersonality.reduced;
    const theirLPE = theirBr.lifePathExpression.reduced;
    const theirSUP = theirBr.soulUrgePersonality.reduced;

    const meSum = myLPE + mySUP;       // 0..16, total bridge weight
    const theirSum = theirLPE + theirSUP;
    const diff = Math.abs(meSum - theirSum);

    const meIntegrated = meSum <= 4;   // both bridges low overall
    const themIntegrated = theirSum <= 4;
    const meStretched = meSum >= 8;    // both bridges fairly large overall
    const themStretched = theirSum >= 8;
    const bothStretched = meStretched && themStretched;

    if (
      (meIntegrated && themStretched) ||
      (themIntegrated && meStretched)
    ) {
      // One clearly more integrated than the other → complement
      modifiers.push({ reason: 'bridgeComplement', delta: 2 });
      overall += 2;
    } else if (diff <= 3 && !bothStretched) {
      // Similar internal landscape (and not both grinding) → sync
      modifiers.push({ reason: 'bridgeSync', delta: 2 });
      overall += 2;
    } else if (bothStretched && diff <= 3) {
      // Both equally stretched → compound exhaustion
      modifiers.push({ reason: 'mutualBridgeStretch', delta: -1 });
      overall -= 1;
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
