import { LETTER_VALUES } from './letterMap';
import { nameTokens } from './nameParts';
import { makeResult } from './reduce';
import type { NumerologyResult } from './types';

/**
 * Planes of Expression (Hans Decoz) — Pythagorean letters partition into
 * four "modes of being": Physical (body / action), Mental (analysis /
 * planning), Emotional (feeling / response), Intuitive (knowing without
 * thinking). Summing the letter values in each category for the full
 * birth name surfaces which planes the user naturally lives in.
 *
 * Letter categorization (verified against the Dany Mochtar Personal
 * Profile output where Physical=8, Mental=15/6, Emotional=17/8,
 * Intuitive=10/1):
 *   Physical:  D E M W                  (4 letters)
 *   Mental:    A G H J L N P            (7 letters)
 *   Emotional: B I O R S T X Z          (8 letters)
 *   Intuitive: C F K Q U V Y            (7 letters)
 */
const PHYSICAL = new Set(['D', 'E', 'M', 'W']);
const MENTAL = new Set(['A', 'G', 'H', 'J', 'L', 'N', 'P']);
const EMOTIONAL = new Set(['B', 'I', 'O', 'R', 'S', 'T', 'X', 'Z']);
const INTUITIVE = new Set(['C', 'F', 'K', 'Q', 'U', 'V', 'Y']);

export interface Planes {
  physical: NumerologyResult;
  mental: NumerologyResult;
  emotional: NumerologyResult;
  intuitive: NumerologyResult;
}

export function planesOfExpression(fullName: string): Planes {
  let p = 0;
  let m = 0;
  let e = 0;
  let i = 0;
  for (const token of nameTokens(fullName)) {
    for (const ch of token) {
      const upper = ch.toUpperCase();
      const v = LETTER_VALUES[upper];
      if (v === undefined) continue;
      if (PHYSICAL.has(upper)) p += v;
      else if (MENTAL.has(upper)) m += v;
      else if (EMOTIONAL.has(upper)) e += v;
      else if (INTUITIVE.has(upper)) i += v;
    }
  }
  return {
    physical: makeResult(p),
    mental: makeResult(m),
    emotional: makeResult(e),
    intuitive: makeResult(i),
  };
}
