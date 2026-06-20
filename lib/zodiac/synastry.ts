/**
 * Synastry — pairwise compatibility classification between two zodiac
 * placements. Pure display layer (does NOT feed the numerology
 * compatibility score in `lib/compatibility/`).
 *
 * Classification scheme — coarse on purpose so static content packs can
 * cover every case without combinatorial explosion (12 × 12 = 144 pairs
 * would be too much copy):
 *
 *   - `'harmony'`  — same sign, same element, or compatible-element pair
 *                    (fire+air, earth+water). Energies amplify each other.
 *   - `'magnetic'` — opposing signs (180° apart on the wheel). Pull each
 *                    other strongly; reflective relationship that can
 *                    either complete or wear thin.
 *   - `'tension'`  — incompatible element pair that aren't opposites
 *                    (fire+water, fire+earth, earth+air, water+air).
 *                    Friction by default; growth available if held.
 *   - `'neutral'`  — everything else (largely modality-driven adjacencies
 *                    that aren't doing either).
 *
 * The five PAIR_CATEGORIES below are what the compatibility card actually
 * renders — Sun-Sun on identity, Moon-Moon on emotion, Rising-Rising on
 * first impression, plus two crosses (Sun-Moon, Sun-Rising) that catch
 * common "outer me meets your inner me" reads.
 */

import { ELEMENT, type ZodiacSign } from './signs';

export type SynastryClassification = 'harmony' | 'magnetic' | 'tension' | 'neutral';

const OPPOSITES: Record<ZodiacSign, ZodiacSign> = {
  aries: 'libra',
  taurus: 'scorpio',
  gemini: 'sagittarius',
  cancer: 'capricorn',
  leo: 'aquarius',
  virgo: 'pisces',
  libra: 'aries',
  scorpio: 'taurus',
  sagittarius: 'gemini',
  capricorn: 'cancer',
  aquarius: 'leo',
  pisces: 'virgo',
};

/** Symmetric element-pair compatibility key. */
function elementPairKey(a: ZodiacSign, b: ZodiacSign): string {
  const els = [ELEMENT[a], ELEMENT[b]].sort();
  return `${els[0]}-${els[1]}`;
}

const HARMONIOUS_ELEMENT_PAIRS = new Set([
  'fire-fire',
  'earth-earth',
  'air-air',
  'water-water',
  'air-fire', // fire + air — feed each other
  'earth-water', // earth + water — stabilize each other
]);

const TENSION_ELEMENT_PAIRS = new Set([
  'fire-water', // dampens / boils
  'earth-fire', // smother
  'air-water', // restless vs steady
  'air-earth', // detached vs grounded
]);

export function classifyPair(a: ZodiacSign, b: ZodiacSign): SynastryClassification {
  if (a === b) return 'harmony';
  if (OPPOSITES[a] === b) return 'magnetic';
  const key = elementPairKey(a, b);
  if (HARMONIOUS_ELEMENT_PAIRS.has(key)) return 'harmony';
  if (TENSION_ELEMENT_PAIRS.has(key)) return 'tension';
  return 'neutral';
}

export type PairCategory =
  | 'sun-sun'
  | 'moon-moon'
  | 'rising-rising'
  | 'sun-moon'
  | 'sun-rising';

export interface Placements {
  /** Sun is derived from DOB so it's always present at the call site. */
  sun: ZodiacSign;
  moon: ZodiacSign | null;
  rising: ZodiacSign | null;
}

export interface SynastryPair {
  category: PairCategory;
  /** Sign from the user side of the cross. */
  userSign: ZodiacSign;
  /** Sign from the person side of the cross. */
  personSign: ZodiacSign;
  classification: SynastryClassification;
}

export interface SynastryResult {
  /** Every pair that could be computed (skipped when either side is null
   *  for a non-Sun field). Always includes at least the Sun-Sun pair. */
  pairs: SynastryPair[];
  /**
   * `true` when at least one of the user or person is missing a Moon
   * or Rising placement — drives the UI's "tambahkan untuk synastry
   * lengkap" hint without the caller having to re-walk the inputs.
   */
  partial: boolean;
}

/**
 * Build the synastry pair stack for a (user, person) placements pair.
 * The order of returned `pairs` matches the canonical Sun → Moon →
 * Rising → cross order so the UI can render them top-down without
 * sorting.
 */
export function synastry(user: Placements, person: Placements): SynastryResult {
  const pairs: SynastryPair[] = [];

  // Sun-Sun — always available.
  pairs.push({
    category: 'sun-sun',
    userSign: user.sun,
    personSign: person.sun,
    classification: classifyPair(user.sun, person.sun),
  });

  if (user.moon && person.moon) {
    pairs.push({
      category: 'moon-moon',
      userSign: user.moon,
      personSign: person.moon,
      classification: classifyPair(user.moon, person.moon),
    });
  }

  if (user.rising && person.rising) {
    pairs.push({
      category: 'rising-rising',
      userSign: user.rising,
      personSign: person.rising,
      classification: classifyPair(user.rising, person.rising),
    });
  }

  // Crosses — outer-vs-inner reads. We compare user.sun ↔ person.moon
  // (their inner emotional read of me) and user.sun ↔ person.rising
  // (their first-impression read of me) where the person side data
  // exists. Done one-directionally on purpose; the reverse direction
  // would double the card without adding insight for this use case.
  if (person.moon) {
    pairs.push({
      category: 'sun-moon',
      userSign: user.sun,
      personSign: person.moon,
      classification: classifyPair(user.sun, person.moon),
    });
  }
  if (person.rising) {
    pairs.push({
      category: 'sun-rising',
      userSign: user.sun,
      personSign: person.rising,
      classification: classifyPair(user.sun, person.rising),
    });
  }

  const partial =
    !user.moon || !user.rising || !person.moon || !person.rising;

  return { pairs, partial };
}
