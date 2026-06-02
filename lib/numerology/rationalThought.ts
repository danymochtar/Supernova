import { LETTER_VALUES } from './letterMap';
import { nameTokens } from './nameParts';
import { makeResult, reducePreservingMasters } from './reduce';
import type { BirthDate, NumerologyResult } from './types';

/**
 * Rational Thought (Hans Decoz) = reduced sum of all the letter values
 * in the first name PLUS the day-of-month at birth. Describes the
 * default analytical mode — how you organize information into thought,
 * what makes ideas "click" for you.
 *
 * Decoz reduces the first-name letter sum to a single digit (preserving
 * masters) before adding the day-of-month, then reduces the total.
 *
 * Dany (17 → 8) + day 17 → 25 → 7. Matches Decoz Personal Profile.
 */
export function rationalThought(fullName: string, dob: BirthDate): NumerologyResult {
  const [first] = nameTokens(fullName);
  let firstNameSum = 0;
  if (first) {
    for (const ch of first) {
      firstNameSum += LETTER_VALUES[ch.toUpperCase()] ?? 0;
    }
  }
  const firstNameReduced = reducePreservingMasters(firstNameSum);
  return makeResult(firstNameReduced + dob.day);
}
