import { LETTER_VALUES } from './letterMap';
import { nameTokens } from './nameParts';

export interface Cornerstone {
  /** First letter of the first name (uppercase, no diacritics). */
  letter: string;
  /** Its Pythagorean value (1-9). */
  value: number;
}

/**
 * Cornerstone (Hans Decoz) = the first letter of your first name.
 * Describes how you typically approach challenges and opportunities —
 * your "default opening move".
 *
 * Returns null only when the name has no usable letters.
 *
 * Dany Mochtar → D (4). Matches Decoz Personal Profile.
 */
export function cornerstone(fullName: string): Cornerstone | null {
  const [first] = nameTokens(fullName);
  if (!first) return null;
  for (const ch of first) {
    const upper = ch.toUpperCase();
    const value = LETTER_VALUES[upper];
    if (value !== undefined) return { letter: upper, value };
  }
  return null;
}
