import { LETTER_VALUES, PURE_VOWELS } from './letterMap';
import { nameTokens } from './nameParts';
import { makeResult, reducePreservingMasters } from './reduce';
import type { BirthDate, NumerologyResult } from './types';
import { isYVowel } from './yVowel';

type LetterClass = 'vowel' | 'consonant' | 'ignore';

function classify(token: string, indexInToken: number): LetterClass {
  const ch = token[indexInToken]!.toUpperCase();
  if (LETTER_VALUES[ch] === undefined) return 'ignore';
  if (PURE_VOWELS.has(ch)) return 'vowel';
  if (ch === 'Y') return isYVowel(token, indexInToken) ? 'vowel' : 'consonant';
  return 'consonant';
}

/**
 * Hans Decoz / World Numerology convention: each name-part is reduced
 * to a single digit BEFORE the parts are summed across, AND master
 * numbers (11/22/33) are preserved during that per-part reduction.
 *
 * For "Dany Mochtar" the Expression compound is 41 (Dany 17→8 + Mochtar
 * 33-preserved = 41), not the 50 you'd get from a straight letter-by-
 * letter sum. The reduced single digit usually coincides between both
 * methods, but the compound — what we render as "41/5" — and the
 * reduced-master cases diverge. We follow Decoz so our compound matches
 * his Personal Profile output byte-for-byte.
 */
function sumByClass(fullName: string, want: LetterClass): number {
  let total = 0;
  for (const token of nameTokens(fullName)) {
    let partSum = 0;
    for (let i = 0; i < token.length; i++) {
      if (classify(token, i) === want) {
        partSum += LETTER_VALUES[token[i]!.toUpperCase()] ?? 0;
      }
    }
    if (partSum > 0) total += reducePreservingMasters(partSum);
  }
  return total;
}

function sumAllLetters(fullName: string): number {
  let total = 0;
  for (const token of nameTokens(fullName)) {
    let partSum = 0;
    for (const ch of token) {
      partSum += LETTER_VALUES[ch.toUpperCase()] ?? 0;
    }
    if (partSum > 0) total += reducePreservingMasters(partSum);
  }
  return total;
}

/**
 * Life Path = reduce(reducedMonth + reducedDay + reducedYear), with masters
 * preserved at each reduction step. Per spec we never sum all DOB digits at
 * once; each component is reduced first.
 */
export function lifePath(dob: BirthDate): NumerologyResult {
  const m = reducePreservingMasters(dob.month);
  const d = reducePreservingMasters(dob.day);
  const y = reducePreservingMasters(dob.year);
  return makeResult(m + d + y);
}

/** Expression (Destiny) = reduce(sum of all letters in full birth name). */
export function expression(fullName: string): NumerologyResult {
  return makeResult(sumAllLetters(fullName));
}

/** Soul Urge (Heart's Desire) = reduce(sum of vowels). */
export function soulUrge(fullName: string): NumerologyResult {
  return makeResult(sumByClass(fullName, 'vowel'));
}

/** Personality (Outer) = reduce(sum of consonants). */
export function personality(fullName: string): NumerologyResult {
  return makeResult(sumByClass(fullName, 'consonant'));
}

/** Birthday number = day of month, reduced (preserving masters). */
export function birthday(dob: BirthDate): NumerologyResult {
  return makeResult(dob.day);
}
