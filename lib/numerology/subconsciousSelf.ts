import { LETTER_VALUES } from './letterMap';
import { nameTokens } from './nameParts';

/**
 * Subconscious Self (Hans Decoz) = count of distinct digit-values 1-9
 * present in the full birth name. Tells you how stable you stay under
 * pressure: more digits present → more inner resources to draw on
 * without conscious effort.
 *
 * Range: 1-9. Anything below ~6 suggests one or more major life lessons
 * (Karmic Lessons) are tugging at the user's stability.
 *
 * Dany Mochtar contains all 9 digits at least once → Subconscious Self
 * = 9. Matches Decoz Personal Profile.
 */
export function subconsciousSelf(fullName: string): number {
  const present = new Set<number>();
  for (const token of nameTokens(fullName)) {
    for (const ch of token) {
      const v = LETTER_VALUES[ch.toUpperCase()];
      if (v !== undefined) present.add(v);
    }
  }
  return present.size;
}
