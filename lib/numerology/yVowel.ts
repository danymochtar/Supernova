import { PURE_VOWELS } from './letterMap';
import { Y_VOWEL_OVERRIDES, type YRole } from './yVowelOverrides';

/**
 * Decide whether each Y in a single name token is functioning as a vowel.
 *
 * Heuristic (in order of precedence):
 *   1. If the token has an entry in Y_VOWEL_OVERRIDES, use it.
 *   2. If Y is the only vowel-eligible letter in the token, vowel.
 *   3. If Y starts the token AND is followed by a pure vowel (Yes, Yusuf,
 *      Yanti, Yolanda), consonant — Y is making a "yuh" sound.
 *   4. If Y immediately follows a pure vowel (diphthong like AY, OY in
 *      "Hayden"), consonant.
 *   5. Otherwise vowel (Mary at end after consonant; Bryan, Wyatt, Lynn in
 *      middle between consonants; Yvonne at start before consonant).
 *
 * The function returns the role of the Y at `position` within `token`.
 * `token` is a single contiguous run of letters; split full names on
 * whitespace before calling.
 */
export function yRole(token: string, position: number): YRole {
  const upper = token.toUpperCase();
  if (upper[position] !== 'Y') {
    throw new Error(`yRole called on non-Y character at position ${position} of "${token}"`);
  }

  const override = Y_VOWEL_OVERRIDES[upper];
  if (override) {
    const yIndices: number[] = [];
    for (let i = 0; i < upper.length; i++) if (upper[i] === 'Y') yIndices.push(i);
    const occurrence = yIndices.indexOf(position);
    if (occurrence >= 0 && occurrence < override.length) {
      return override[occurrence]!;
    }
  }

  const otherVowels = [...upper].filter((ch, i) => i !== position && PURE_VOWELS.has(ch));
  if (otherVowels.length === 0) return 'vowel';

  const before = position > 0 ? upper[position - 1] : null;
  const after = position < upper.length - 1 ? upper[position + 1] : null;

  if (position === 0 && after && PURE_VOWELS.has(after)) return 'consonant';
  if (before && PURE_VOWELS.has(before)) return 'consonant';

  return 'vowel';
}

/** Convenience: is Y at this position acting as a vowel? */
export function isYVowel(token: string, position: number): boolean {
  return yRole(token, position) === 'vowel';
}
