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
import idFunfact from '@/content/zodiac/lifePathFunfact.id.json';
import enFunfact from '@/content/zodiac/lifePathFunfact.en.json';

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
/**
 * 9 Life Path digits × 12 zodiac signs = 108 one-line "fun fact" combos.
 * Keys are the reduced single-digit LP ('1'..'9') — master compounds
 * (11/22/33) reduce to 2/4/6 before lookup, same convention as the rest
 * of the harmony system in `lib/zodiac`.
 */
type FunfactPack = Record<string, Record<ZodiacSign, string>>;

const MEANING_PACKS: Partial<Record<Locale, MeaningPack>> = {
  id: idMeanings as MeaningPack,
  en: enMeanings as MeaningPack,
};

const SYNASTRY_PACKS: Partial<Record<Locale, SynastryPack>> = {
  id: idSynastry as SynastryPack,
  en: enSynastry as SynastryPack,
};

const FUNFACT_PACKS: Partial<Record<Locale, FunfactPack>> = {
  id: idFunfact as FunfactPack,
  en: enFunfact as FunfactPack,
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

/**
 * Punchy one-line funfact combining a Life Path digit (1-9) with a Sun
 * sign. Master compounds (11/22/33) should be reduced to their single
 * digit (2/4/6) before passing in. Falls back to the ID pack for
 * locales that haven't been translated, mirroring the meanings pattern.
 */
export function lifePathSignFunfact(
  lpReduced: number,
  sign: ZodiacSign,
  locale: Locale,
): string | null {
  const pack = FUNFACT_PACKS[locale] ?? FUNFACT_PACKS.id!;
  const key = String(lpReduced);
  return pack[key]?.[sign] ?? null;
}
