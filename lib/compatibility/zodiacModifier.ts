/**
 * Zodiac compatibility as a score modifier — bounded additive delta
 * tallied from the existing `lib/zodiac/synastry.ts#synastry` classifier.
 *
 * Magnitudes are deliberately small so this signal complements the
 * numerology lanes rather than competing with them. The cap of ±3
 * lines up with the existing modifier set (`soulUrgeMatch` +3,
 * `lifePathMirror` +3, `bridgeFit` ±2).
 *
 * Magnetic pairs (opposite-sign attraction) and neutral pairs both
 * contribute zero to the math. Magnetic shows up in the synastry
 * card's prose as "attraction with friction"; encoding it as a number
 * would double-count what the user already sees described.
 */

import { sunSignFromDob, type ZodiacSign } from '@/lib/zodiac/signs';
import { synastry, type Placements } from '@/lib/zodiac/synastry';

export interface ZodiacInputs {
  meDob: { year: number; month: number; day: number };
  meMoon: ZodiacSign | null;
  meRising: ZodiacSign | null;
  themDob: { year: number; month: number; day: number };
  themMoon: ZodiacSign | null;
  themRising: ZodiacSign | null;
}

export interface ZodiacModifierResult {
  /** Bounded delta to add to the running score. Always in [-3, 3]. */
  delta: number;
  /** Count of `'harmony'` pairs that fed the delta — drives the UI label. */
  harmonyCount: number;
  /** Count of `'tension'` pairs. */
  tensionCount: number;
  /** Total pairs the synastry helper produced — 1..5 depending on which
   *  Moon / Rising columns are filled on each side. */
  totalPairs: number;
}

const CAP = 3;

/**
 * Tally harmony / tension across every computable (user, person) pair.
 * Returns `null` when the delta is zero — saves the modifier list on
 * the breakdown UI from being padded with noise rows.
 */
export function zodiacModifier(input: ZodiacInputs): ZodiacModifierResult | null {
  const me: Placements = {
    sun: sunSignFromDob(input.meDob),
    moon: input.meMoon,
    rising: input.meRising,
  };
  const them: Placements = {
    sun: sunSignFromDob(input.themDob),
    moon: input.themMoon,
    rising: input.themRising,
  };
  const result = synastry(me, them);

  let raw = 0;
  let h = 0;
  let t = 0;
  for (const p of result.pairs) {
    if (p.classification === 'harmony') {
      raw += 1;
      h += 1;
    } else if (p.classification === 'tension') {
      raw -= 1;
      t += 1;
    }
    // 'magnetic' + 'neutral' → 0
  }
  const delta = Math.max(-CAP, Math.min(CAP, raw));
  if (delta === 0) return null;
  return { delta, harmonyCount: h, tensionCount: t, totalPairs: result.pairs.length };
}
