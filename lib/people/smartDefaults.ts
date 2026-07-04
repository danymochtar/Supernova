/**
 * Soft defaults applied when adding a new Person to the People list.
 * These are pure heuristics — always meant as SUGGESTIONS the user can
 * override on the form, never silently forced.
 *
 * Two things get suggested:
 *   1. Birth time defaults to 12:00 (noon) when the user doesn't know
 *      it. Noon is the astrological convention for an unknown birth
 *      time — the Sun is at the meridian, so Sun sign math stays
 *      accurate and Moon / Rising get a plausible midpoint estimate
 *      that's rarely worse than half a sign off.
 *
 *   2. Birth city guessed from name markers:
 *      - Malay Islamic naming particles ("bin" / "binti" / "bt") →
 *        Kuala Lumpur.
 *      - Otherwise, if the app's active locale is Indonesian, default
 *        to Jakarta.
 *      - Everything else → null (no guess; user picks manually).
 *
 * These defaults reflect the current user base (mostly Indonesia, with
 * a meaningful Malay subset) — happy to extend when we see repeat
 * regions in production.
 */

export interface CityDefault {
  /** Stable id for React `key` + change detection. */
  key: 'jakarta' | 'kuala_lumpur';
  /** Display label shown in the combobox input. Matches the format the
   *  `/api/zodiac/cities` endpoint returns so the visible input reads
   *  identically to a manually-picked hit. */
  label: string;
  lat: number;
  lon: number;
  /** IANA timezone. */
  timezone: string;
}

export const JAKARTA_DEFAULT: CityDefault = {
  key: 'jakarta',
  label: 'Jakarta, Indonesia',
  lat: -6.2088,
  lon: 106.8456,
  timezone: 'Asia/Jakarta',
};

export const KUALA_LUMPUR_DEFAULT: CityDefault = {
  key: 'kuala_lumpur',
  label: 'Kuala Lumpur, Malaysia',
  lat: 3.139,
  lon: 101.6869,
  timezone: 'Asia/Kuala_Lumpur',
};

/** Noon local as the astrological "unknown birth time" fallback. */
export const SUGGESTED_BIRTH_TIME = '12:00';

/**
 * Guess a plausible birth city based on name + active locale. Returns
 * null when we can't say — the caller then leaves the field blank and
 * the user picks manually.
 *
 * @param fullName Full name concatenated with spaces (first + middle +
 *   last). Empty / whitespace = no guess.
 * @param activeLocale The Supernova locale currently in effect (`id`,
 *   `en`, `ms`, etc.). Used as a weak signal when name markers are
 *   inconclusive.
 */
export function guessBirthCityFromName(
  fullName: string,
  activeLocale?: string,
): CityDefault | null {
  const name = fullName.toLowerCase().trim();
  if (!name) return null;

  // Malay Islamic naming — "Ahmad bin Abdullah", "Siti binti Tarudin",
  // "Aisyah bt. Hassan". Whitespace boundaries prevent false positives
  // on English names containing "bin" (Robin, Sabina, etc.).
  const malayParticle = /(^|\s)(bin|binti|bt\.?)\s+/i;
  if (malayParticle.test(name)) return KUALA_LUMPUR_DEFAULT;

  // Indonesian names don't have a comparable surface marker. Fallback:
  // if the app locale is Indonesian, default to Jakarta. Not a strong
  // signal on its own, but paired with the user's context (they're
  // adding people from their own life) it's usually right.
  if (activeLocale === 'id') return JAKARTA_DEFAULT;

  return null;
}
