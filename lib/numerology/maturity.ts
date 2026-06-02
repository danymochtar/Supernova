import { makeResult } from './reduce';
import type { NumerologyResult } from './types';

/** Reduce any NumerologyResult to a single 1-9 digit. Masters collapse
 *  to their digital root (11→2, 22→4, 33→6). */
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

/**
 * Maturity Number (Hans Decoz) = single-digit Life Path + single-digit
 * Expression. Activates conceptually around age 30-35: the "real you"
 * that emerges as the mission (Life Path) and natural toolkit
 * (Expression) integrate into one operating mode.
 *
 * Master sums are preserved in the result (so 1 + 4 → 5, but 2 + 9 → 11).
 *
 * Dany Mochtar: 1 + 5 = 6 → 6/6. Matches Decoz Personal Profile output.
 */
export function maturityNumber(
  lifePath: NumerologyResult,
  expression: NumerologyResult,
): NumerologyResult {
  return makeResult(singleDigit(lifePath) + singleDigit(expression));
}
