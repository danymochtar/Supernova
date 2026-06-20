/**
 * Western tropical zodiac — sign enumeration, element / modality tables,
 * and the deterministic `sunSignFromDob` lookup.
 *
 * Sign IDs are the lowercase string keys we use in content packs
 * (`content/zodiac/meanings.id.json`) and the Prisma enum values. The
 * Prisma enum is uppercase (`LEO`, `ARIES`…); helpers below translate.
 */

export type ZodiacSign =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces';

export const ZODIAC_SIGNS: readonly ZodiacSign[] = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
] as const;

export type Element = 'fire' | 'earth' | 'air' | 'water';
export type Modality = 'cardinal' | 'fixed' | 'mutable';

export const ELEMENT: Record<ZodiacSign, Element> = {
  aries: 'fire',
  leo: 'fire',
  sagittarius: 'fire',
  taurus: 'earth',
  virgo: 'earth',
  capricorn: 'earth',
  gemini: 'air',
  libra: 'air',
  aquarius: 'air',
  cancer: 'water',
  scorpio: 'water',
  pisces: 'water',
};

export const MODALITY: Record<ZodiacSign, Modality> = {
  aries: 'cardinal',
  cancer: 'cardinal',
  libra: 'cardinal',
  capricorn: 'cardinal',
  taurus: 'fixed',
  leo: 'fixed',
  scorpio: 'fixed',
  aquarius: 'fixed',
  gemini: 'mutable',
  virgo: 'mutable',
  sagittarius: 'mutable',
  pisces: 'mutable',
};

/** Unicode glyph for each sign — used as a small affordance on cards. */
export const GLYPH: Record<ZodiacSign, string> = {
  aries: '♈',
  taurus: '♉',
  gemini: '♊',
  cancer: '♋',
  leo: '♌',
  virgo: '♍',
  libra: '♎',
  scorpio: '♏',
  sagittarius: '♐',
  capricorn: '♑',
  aquarius: '♒',
  pisces: '♓',
};

/**
 * Sun-sign date ranges in tropical zodiac. Each range starts on the date
 * traditionally given as the cusp; the previous sign owns the day before.
 * Boundaries here are the common "newspaper" cusps — exact astronomical
 * cusps shift by hours per year, but for a no-birth-time chart this is
 * the conventional choice (matches astro.com defaults).
 */
interface DateRange {
  /** [month, day] inclusive start. */
  from: [number, number];
  /** [month, day] inclusive end. */
  to: [number, number];
  sign: ZodiacSign;
}

const SUN_RANGES: readonly DateRange[] = [
  { from: [3, 21], to: [4, 19], sign: 'aries' },
  { from: [4, 20], to: [5, 20], sign: 'taurus' },
  { from: [5, 21], to: [6, 20], sign: 'gemini' },
  { from: [6, 21], to: [7, 22], sign: 'cancer' },
  { from: [7, 23], to: [8, 22], sign: 'leo' },
  { from: [8, 23], to: [9, 22], sign: 'virgo' },
  { from: [9, 23], to: [10, 22], sign: 'libra' },
  { from: [10, 23], to: [11, 21], sign: 'scorpio' },
  { from: [11, 22], to: [12, 21], sign: 'sagittarius' },
  // Capricorn wraps year-end — modeled as two segments below.
  { from: [12, 22], to: [12, 31], sign: 'capricorn' },
  { from: [1, 1], to: [1, 19], sign: 'capricorn' },
  { from: [1, 20], to: [2, 18], sign: 'aquarius' },
  { from: [2, 19], to: [3, 20], sign: 'pisces' },
];

export interface BirthDateInput {
  /** Calendar year (e.g. 1995). Not used by the lookup but kept for
   *  parity with the rest of the numerology code that takes a BirthDate. */
  year?: number;
  /** Calendar month, 1-12. */
  month: number;
  /** Calendar day-of-month, 1-31. */
  day: number;
}

/**
 * Tropical Sun sign for a date of birth. Pure function of (month, day) —
 * year is irrelevant for the conventional western dates. Returns
 * `'aries'` for inputs that don't match any range (shouldn't happen for
 * valid calendar dates) so the caller never has to null-handle the
 * fallback.
 */
export function sunSignFromDob(dob: BirthDateInput): ZodiacSign {
  const m = dob.month;
  const d = dob.day;
  for (const range of SUN_RANGES) {
    const [fromM, fromD] = range.from;
    const [toM, toD] = range.to;
    if (fromM === toM) {
      // Range fits inside a single month — both bounds must hold.
      if (m === fromM && d >= fromD && d <= toD) return range.sign;
    } else {
      // Range spans two consecutive months — start month: d >= fromD;
      // end month: d <= toD.
      if (
        (m === fromM && d >= fromD) ||
        (m === toM && d <= toD)
      ) {
        return range.sign;
      }
    }
  }
  // Defensive: only reachable for impossible inputs (m=13 etc.).
  return 'aries';
}

/** Prisma enum string ↔ our lowercase sign id. Both directions. */
export function fromPrismaEnum(value: string | null | undefined): ZodiacSign | null {
  if (!value) return null;
  const lower = value.toLowerCase();
  return (ZODIAC_SIGNS as readonly string[]).includes(lower)
    ? (lower as ZodiacSign)
    : null;
}

export function toPrismaEnum(sign: ZodiacSign): string {
  return sign.toUpperCase();
}
