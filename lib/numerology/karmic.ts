import { LETTER_VALUES } from './letterMap';
import { nameTokens } from './nameParts';

/**
 * Karmic Lessons: digits 1–9 that are missing from the letter values of the
 * full name. Reads the same canonical token set as Expression / Soul Urge
 * / Personality so a >4-part name evaluates consistently across all four
 * core numbers (Goodwin cap applied via nameTokens).
 */
export function karmicLessons(fullName: string): number[] {
  const present = new Set<number>();
  for (const token of nameTokens(fullName)) {
    for (const ch of token.toUpperCase()) {
      const v = LETTER_VALUES[ch];
      if (v !== undefined) present.add(v);
    }
  }
  const missing: number[] = [];
  for (let n = 1; n <= 9; n++) if (!present.has(n)) missing.push(n);
  return missing;
}
