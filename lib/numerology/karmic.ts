import { LETTER_VALUES } from './letterMap';

/**
 * Karmic Lessons: digits 1–9 that are missing from the letter values of the
 * full name. E.g. if the name contains no letters that map to 7, then 7 is a
 * karmic lesson.
 */
export function karmicLessons(fullName: string): number[] {
  const present = new Set<number>();
  for (const ch of fullName.toUpperCase()) {
    const v = LETTER_VALUES[ch];
    if (v !== undefined) present.add(v);
  }
  const missing: number[] = [];
  for (let n = 1; n <= 9; n++) if (!present.has(n)) missing.push(n);
  return missing;
}
