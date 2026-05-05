import { makeResult } from './reduce';
import type { NumerologyResult } from './types';

/**
 * Bridge Numbers (Decoz, "Numerology: Key to Your Inner Self")
 *
 * A Bridge surfaces the gap between two of your core numbers — how
 * easily two facets of yourself integrate. The smaller the gap, the
 * smoother the internal flow; the larger, the more conscious work it
 * takes to bring those two sides into alignment.
 *
 * Two main bridges in Decoz tradition:
 *
 *   1. Life Path ↔ Expression
 *      "Do my natural talents (Expression) align with my life mission
 *      (Life Path)?" Lower bridge = you arrive equipped for what you're
 *      here to do. Higher bridge = your gifts and your mission pull in
 *      different directions; growth comes from developing skills the
 *      mission demands but the natural self didn't pre-load.
 *
 *   2. Soul Urge ↔ Personality
 *      "Does my inner self show on the outside?" Lower bridge = the
 *      inner you and the outer you match — people see who you really
 *      are. Higher bridge = there's a gap between what you feel and
 *      what others perceive; integration is about closing that.
 *
 * Calculation: |a.reducedToSingle − b.reducedToSingle|. Master numbers
 * (11/22/33) reduce to their single-digit form (2/4/6) for this math —
 * Bridges are about the surface "vibration" of each number meeting,
 * not the deep master-level layer.
 *
 * Result range: 0..8 (since both inputs are 1..9 after reducing).
 *   0 = identical, no bridge
 *   1-3 = light/easy bridge
 *   4-6 = moderate bridge
 *   7-8 = challenging bridge (but the deepest growth lives here)
 */

export interface Bridges {
  /** |LifePath − Expression|. Talent ↔ mission alignment. */
  lifePathExpression: NumerologyResult;
  /** |SoulUrge − Personality|. Inner self ↔ outer presentation alignment. */
  soulUrgePersonality: NumerologyResult;
}

/** Reduce a NumerologyResult to a single 1-9 digit. Master numbers
 * collapse to their digital root (11→2, 22→4, 33→6). */
function singleDigit(r: NumerologyResult): number {
  let n = r.reduced;
  while (n >= 10) {
    let s = 0;
    let x = n;
    while (x > 0) {
      s += x % 10;
      x = Math.floor(x / 10);
    }
    n = s;
  }
  return n;
}

interface BridgeInput {
  lifePath: NumerologyResult;
  expression: NumerologyResult;
  soulUrge: NumerologyResult;
  personality: NumerologyResult;
}

export function bridges(core: BridgeInput): Bridges {
  const lp = singleDigit(core.lifePath);
  const ex = singleDigit(core.expression);
  const su = singleDigit(core.soulUrge);
  const ps = singleDigit(core.personality);
  return {
    lifePathExpression: makeResult(Math.abs(lp - ex)),
    soulUrgePersonality: makeResult(Math.abs(su - ps)),
  };
}
