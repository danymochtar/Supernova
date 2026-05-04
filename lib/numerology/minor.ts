import { expression, soulUrge, personality } from './core';
import type { NumerologyResult } from './types';

/**
 * Minor Numbers (Decoz / McCants) — derived from the nickname or
 * commonly-used name rather than the full birth name. They describe the
 * day-to-day energy of how the person is publicly known and called, which
 * can be quite different from the foundational birth-name energy.
 *
 * Useful when:
 *  - Someone's birth name and called-name diverge (Chinese name vs English
 *    nickname; legal "Muhammad Afifuddin Noufal" vs "Noufal" everyone uses).
 *  - You want to read the social/professional self separate from the deep
 *    self that birth-name numbers describe.
 *
 * The same three component formulas apply — Expression on the full
 * nickname string, Soul Urge on the vowels, Personality on the consonants.
 * Karmic Lessons aren't computed for the nickname (that's a full-birth-name
 * concept by definition).
 *
 * Returns null when no nickname is provided.
 */
export interface MinorNumbers {
  minorExpression: NumerologyResult;
  minorSoulUrge: NumerologyResult;
  minorPersonality: NumerologyResult;
  /** The (trimmed) nickname these were derived from. */
  source: string;
}

export function minorNumbers(nickname: string | null | undefined): MinorNumbers | null {
  const trimmed = nickname?.trim() ?? '';
  if (!trimmed) return null;
  // Need at least one letter — pure punctuation / numbers can't be reduced.
  if (!/[a-zA-Z]/.test(trimmed)) return null;
  return {
    minorExpression: expression(trimmed),
    minorSoulUrge: soulUrge(trimmed),
    minorPersonality: personality(trimmed),
    source: trimmed,
  };
}
