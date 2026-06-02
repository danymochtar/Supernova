import { LETTER_VALUES } from './letterMap';
import { nameTokens } from './nameParts';

/**
 * Hidden Passion (Hans Decoz) = the digit(s) 1-9 that appear most
 * frequently as letter-values across the full birth name. It surfaces
 * the dominant inclination — what you're naturally drawn to without
 * having to push.
 *
 * Most people have a single Hidden Passion; ties (two digits tied for
 * the top count) are common and treated as multiple Hidden Passions.
 *
 * Dany Mochtar: digit 1 appears in {A, A} (twice) and digit 4 appears
 * in {D, M} (twice). Both share the top count → Hidden Passion = [1, 4].
 * Matches Decoz Personal Profile output.
 */
export function hiddenPassion(fullName: string): number[] {
  const counts = new Map<number, number>();
  for (const token of nameTokens(fullName)) {
    for (const ch of token) {
      const v = LETTER_VALUES[ch.toUpperCase()];
      if (v === undefined) continue;
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
  }
  if (counts.size === 0) return [];
  let max = 0;
  for (const c of counts.values()) if (c > max) max = c;
  const winners: number[] = [];
  for (let d = 1; d <= 9; d++) {
    if (counts.get(d) === max) winners.push(d);
  }
  return winners;
}
