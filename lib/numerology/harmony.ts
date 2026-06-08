/**
 * Single-digit number harmony / conflict classification — Pythagorean
 * tradition as codified by Decoz, Affinity Numerology, and the broader
 * World Numerology school.
 *
 * Background. Numbers 1-9 split into two energy families:
 *   - ODD (1, 3, 5, 7, 9) — yang / active / outward-directed.
 *   - EVEN (2, 4, 6, 8) — yin / receptive / inward-supporting.
 *
 * Friction is strongest between adjacent odd↔even pairs because the two
 * energies pull on the same theme in opposite directions. The canonical
 * conflicts cited across the tradition:
 *
 *   (1, 2)  independence ↔ cooperation — "the most incompatible of any
 *           energies represented by single-digit numbers" (Affinity).
 *           This is the pair the World Numerology daily forecast calls
 *           "conflicting and less-than-harmonious".
 *   (3, 4)  expression / play ↔ structure / discipline.
 *   (4, 5)  structure / future ↔ freedom / now — the classic Decoz pair.
 *   (5, 6)  freedom ↔ responsibility / home.
 *   (7, 8)  introspection / spiritual ↔ material / ambition.
 *   (4, 9)  rigid structure ↔ humanitarian completion — the only friction
 *           in 9's universal-harmony pattern.
 *
 * Harmony is strongest among:
 *   - Same number (energy reinforces itself): 1-1, 2-2, …
 *   - The "sacred trinity" multiples of 3: (3, 6), (6, 9), (3, 9).
 *   - 9 with every other digit except 4 — 9 represents completion /
 *     universal love and broadly harmonizes ("9 universal harmony").
 *   - Same-family odd-odd (active mutually-reinforcing):
 *     (1, 3), (1, 5), (1, 7), (3, 5), (5, 7).
 *   - Same-family even-even (receptive mutually-reinforcing):
 *     (2, 6), (2, 8), (4, 6), (4, 8), (6, 8).
 *
 * Everything else is NEUTRAL — the two energies coexist without
 * particular friction or particular reinforcement (e.g. 1 & 4, 2 & 5,
 * 3 & 8). Use neutral as the "no special interaction" default rather
 * than forcing every pair into a polarized bucket.
 *
 * Master numbers (11/22/33) reduce to their single-digit form (2/4/6)
 * for this lookup — same convention as Decoz's bridge-number math,
 * since harmony is about the surface vibration meeting another, not
 * the deep master-level resonance.
 */

export type PairHarmony = 'harmony' | 'conflict' | 'neutral';

/** Symmetric pair-key with the smaller digit first ("1-2", never "2-1"). */
function key(a: number, b: number): string {
  const x = Math.min(a, b);
  const y = Math.max(a, b);
  return `${x}-${y}`;
}

const CONFLICTS: ReadonlySet<string> = new Set([
  '1-2', // independence vs cooperation
  '3-4', // expression vs structure
  '4-5', // structure vs freedom (canonical Decoz)
  '5-6', // freedom vs responsibility
  '7-8', // introspection vs material ambition
  '4-9', // rigid structure vs humanitarian completion
]);

const HARMONIES: ReadonlySet<string> = new Set([
  // Sacred trinity — multiples of 3
  '3-6',
  '3-9',
  '6-9',
  // 9 as universal harmonizer (every digit except 4)
  '1-9',
  '2-9',
  '5-9',
  '7-9',
  '8-9',
  // Same-family odd-odd (active mutual reinforcement)
  '1-3',
  '1-5',
  '1-7',
  '3-5',
  '5-7',
  // Same-family even-even (receptive mutual reinforcement)
  '2-6',
  '2-8',
  '4-6',
  '4-8',
  '6-8',
]);

/** Collapse a number (compound or master) to its 1-9 digital root. */
function reduceToSingle(n: number): number {
  let x = Math.abs(n);
  while (x >= 10) {
    let s = 0;
    while (x > 0) {
      s += x % 10;
      x = Math.floor(x / 10);
    }
    x = s;
  }
  return x;
}

/**
 * Classify the relationship between two single-digit numbers (1-9).
 * Master compounds (11/22/33) and any larger number are reduced to their
 * digital root before lookup.
 */
export function pairHarmony(a: number, b: number): PairHarmony {
  const x = reduceToSingle(a);
  const y = reduceToSingle(b);
  if (x === 0 || y === 0) return 'neutral';
  if (x === y) return 'harmony';
  const k = key(x, y);
  if (CONFLICTS.has(k)) return 'conflict';
  if (HARMONIES.has(k)) return 'harmony';
  return 'neutral';
}

export interface ClassifiedPair {
  a: number;
  b: number;
  /** Reduced form of `a` (1-9). */
  aReduced: number;
  /** Reduced form of `b` (1-9). */
  bReduced: number;
  harmony: PairHarmony;
}

export interface CombinationHarmony {
  /** Every distinct unordered pair from the input, in input order. */
  pairs: ClassifiedPair[];
  /** Count of pairs in `'conflict'`. */
  conflictCount: number;
  /** Count of pairs in `'harmony'` (excluding same-number duplicates). */
  harmonyCount: number;
  /**
   * Overall tone of the combination:
   *   - `'harmonious'` — at least one harmony pair, no conflicts.
   *   - `'conflicting'` — at least one conflict pair, no harmonies.
   *   - `'mixed'` — both present (the most common pattern).
   *   - `'neutral'` — every pair is neutral.
   */
  overallTone: 'harmonious' | 'conflicting' | 'mixed' | 'neutral';
}

/**
 * Classify every pairwise relationship in a list of numbers (typically
 * the day's Personal Day / Personal Month / Personal Year / day-of-
 * month). Returns the full pair grid plus a coarse overall tone so a
 * prompt or UI can riff on "today pulls in different directions" vs
 * "today's energies all reinforce each other".
 */
export function combinationHarmony(numbers: number[]): CombinationHarmony {
  const pairs: ClassifiedPair[] = [];
  for (let i = 0; i < numbers.length; i++) {
    for (let j = i + 1; j < numbers.length; j++) {
      const a = numbers[i]!;
      const b = numbers[j]!;
      pairs.push({
        a,
        b,
        aReduced: reduceToSingle(a),
        bReduced: reduceToSingle(b),
        harmony: pairHarmony(a, b),
      });
    }
  }
  const conflictCount = pairs.filter((p) => p.harmony === 'conflict').length;
  // Same-number pairs are technically harmony but they don't add
  // information to a forecast — they just say "this digit shows up
  // twice". Exclude them from the headline count.
  const harmonyCount = pairs.filter(
    (p) => p.harmony === 'harmony' && p.aReduced !== p.bReduced,
  ).length;

  let overallTone: CombinationHarmony['overallTone'];
  if (conflictCount > 0 && harmonyCount > 0) overallTone = 'mixed';
  else if (conflictCount > 0) overallTone = 'conflicting';
  else if (harmonyCount > 0) overallTone = 'harmonious';
  else overallTone = 'neutral';

  return { pairs, conflictCount, harmonyCount, overallTone };
}
