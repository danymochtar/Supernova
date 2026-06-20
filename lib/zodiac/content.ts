/**
 * Locale-keyed lookup helpers for the zodiac content packs. Mirror the
 * `lib/numerology/meanings.ts` pattern — locales other than ID and EN
 * fall back to the ID pack until translated.
 */

import type { Locale } from '@/lib/i18n/config';
import idMeanings from '@/content/zodiac/meanings.id.json';
import enMeanings from '@/content/zodiac/meanings.en.json';
import idSynastry from '@/content/zodiac/synastry.id.json';
import enSynastry from '@/content/zodiac/synastry.en.json';

import type { ZodiacSign } from './signs';
import type { PairCategory, SynastryClassification } from './synastry';

export interface ZodiacMeaning {
  keyword: string;
  element: string;
  modality: string;
  essence: string;
  inLove: string;
}

type MeaningPack = Record<ZodiacSign, ZodiacMeaning>;
type SynastryPack = Record<PairCategory, Record<SynastryClassification, string>>;

const MEANING_PACKS: Partial<Record<Locale, MeaningPack>> = {
  id: idMeanings as MeaningPack,
  en: enMeanings as MeaningPack,
};

const SYNASTRY_PACKS: Partial<Record<Locale, SynastryPack>> = {
  id: idSynastry as SynastryPack,
  en: enSynastry as SynastryPack,
};

/** Per-sign blurb (keyword + element + modality + essence + in-love). */
export function zodiacMeaning(sign: ZodiacSign, locale: Locale): ZodiacMeaning {
  const pack = MEANING_PACKS[locale] ?? MEANING_PACKS.id!;
  return pack[sign];
}

/** Per-(category, classification) prose for the synastry card. */
export function synastryBlurb(
  category: PairCategory,
  classification: SynastryClassification,
  locale: Locale,
): string {
  const pack = SYNASTRY_PACKS[locale] ?? SYNASTRY_PACKS.id!;
  return pack[category][classification];
}
