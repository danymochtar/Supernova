import { LETTER_VALUES } from './letterMap';
import { nameTokens } from './nameParts';
import { makeResult } from './reduce';
import type { NumerologyResult } from './types';

/**
 * Balance Number (Hans Decoz) = sum of the first letter of each name-
 * part, reduced. Describes how you regain equilibrium under emotional
 * stress — your "default settle" mode.
 *
 * Dany Mochtar → D (4) + M (4) = 8. Matches Decoz Personal Profile.
 */
export function balanceNumber(fullName: string): NumerologyResult {
  let total = 0;
  for (const token of nameTokens(fullName)) {
    const first = token[0];
    if (!first) continue;
    total += LETTER_VALUES[first.toUpperCase()] ?? 0;
  }
  return makeResult(total);
}
