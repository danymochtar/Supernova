import { LETTER_VALUES, PURE_VOWELS } from './letterMap';
import { applyGoodwinCap } from './nameParts';
import { makeResult, reducePreservingMasters } from './reduce';
import type { BirthDate, NumerologyResult } from './types';
import { isYVowel } from './yVowel';

/**
 * Tokenize a full name into name parts (split on whitespace) and within each
 * part return the indices of letters that map to a Pythagorean value. Diacritics
 * are stripped via NFD normalization (e.g. "José" → "Jose"). Names with more
 * than four parts collapse to first + last per Goodwin's rule.
 */
function tokenize(fullName: string): string[] {
  const parts = fullName
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/\s+/)
    .filter(Boolean);
  return applyGoodwinCap(parts);
}

type LetterClass = 'vowel' | 'consonant' | 'ignore';

function classify(token: string, indexInToken: number): LetterClass {
  const ch = token[indexInToken]!.toUpperCase();
  if (LETTER_VALUES[ch] === undefined) return 'ignore';
  if (PURE_VOWELS.has(ch)) return 'vowel';
  if (ch === 'Y') return isYVowel(token, indexInToken) ? 'vowel' : 'consonant';
  return 'consonant';
}

function sumByClass(fullName: string, want: LetterClass): number {
  let total = 0;
  for (const token of tokenize(fullName)) {
    for (let i = 0; i < token.length; i++) {
      if (classify(token, i) === want) {
        total += LETTER_VALUES[token[i]!.toUpperCase()] ?? 0;
      }
    }
  }
  return total;
}

function sumAllLetters(fullName: string): number {
  let total = 0;
  for (const token of tokenize(fullName)) {
    for (const ch of token) {
      total += LETTER_VALUES[ch.toUpperCase()] ?? 0;
    }
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
