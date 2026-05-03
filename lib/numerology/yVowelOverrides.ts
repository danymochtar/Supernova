/**
 * Per-name overrides for the Y-vowel heuristic. Keys are uppercased name tokens
 * (a single word — apply per-token, not full name). Each entry says how each Y
 * in the word should be treated: 'vowel' or 'consonant', indexed by occurrence
 * (0 = first Y in the word, 1 = second Y, etc.).
 *
 * Most of these names happen to also resolve correctly via the heuristic — they
 * live here as regression locks so future heuristic tweaks can't silently flip
 * a known name. Add new entries when you find a name the heuristic gets wrong.
 */

export type YRole = 'vowel' | 'consonant';

export const Y_VOWEL_OVERRIDES: Record<string, YRole[]> = {
  // Y functions as a vowel
  YVONNE: ['vowel'],
  YVETTE: ['vowel'],
  YVES: ['vowel'],
  BRYAN: ['vowel'],
  BRYANT: ['vowel'],
  LYNN: ['vowel'],
  LYNNE: ['vowel'],
  TYRONE: ['vowel'],
  WYATT: ['vowel'],
  MARY: ['vowel'],
  SANDY: ['vowel'],
  DANY: ['vowel'],

  // Y functions as a consonant (Y starts the syllable, makes a "yuh" sound)
  YOLANDA: ['consonant'],
  YUSUF: ['consonant'],
  YANTI: ['consonant'],
  YES: ['consonant'],
};
