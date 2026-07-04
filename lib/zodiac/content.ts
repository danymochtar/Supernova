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
import idClassification from '@/content/zodiac/classification.id.json';
import enClassification from '@/content/zodiac/classification.en.json';
import idPlanets from '@/content/zodiac/planets.id.json';
import enPlanets from '@/content/zodiac/planets.en.json';
import idShadow from '@/content/zodiac/shadow.id.json';
import enShadow from '@/content/zodiac/shadow.en.json';
import idRulers from '@/content/zodiac/rulers.id.json';
import enRulers from '@/content/zodiac/rulers.en.json';
import idTransitMoon from '@/content/zodiac/transitMoon.id.json';
import enTransitMoon from '@/content/zodiac/transitMoon.en.json';

import type { Element, Modality, Planet, ZodiacSign } from './signs';
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
export interface ClassificationMeaning {
  title: string;
  body: string;
}

/** Venus / Mars per-sign copy — short "keyword + one-liner". */
export interface PlanetMeaning {
  keyword: string;
  essence: string;
}
type PlanetPack = {
  venus: Record<ZodiacSign, PlanetMeaning>;
  mars: Record<ZodiacSign, PlanetMeaning>;
};

type ShadowPack = Record<ZodiacSign, string>;
type TransitMoonPack = Record<ZodiacSign, string>;

export interface RulerMeaning {
  name: string;
  theme: string;
}
type RulerPack = Record<Planet, RulerMeaning>;
/** Explainers for the 4 elements and 3 modalities — used by the chip
 *  tap-to-detail modal on the Person hero. */
type ClassificationPack = {
  element: Record<Element, ClassificationMeaning>;
  modality: Record<Modality, ClassificationMeaning>;
};

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

const CLASSIFICATION_PACKS: Partial<Record<Locale, ClassificationPack>> = {
  id: idClassification as ClassificationPack,
  en: enClassification as ClassificationPack,
};

const PLANET_PACKS: Partial<Record<Locale, PlanetPack>> = {
  id: idPlanets as PlanetPack,
  en: enPlanets as PlanetPack,
};

const SHADOW_PACKS: Partial<Record<Locale, ShadowPack>> = {
  id: idShadow as ShadowPack,
  en: enShadow as ShadowPack,
};

const RULER_PACKS: Partial<Record<Locale, RulerPack>> = {
  id: idRulers as RulerPack,
  en: enRulers as RulerPack,
};

const TRANSIT_MOON_PACKS: Partial<Record<Locale, TransitMoonPack>> = {
  id: idTransitMoon as TransitMoonPack,
  en: enTransitMoon as TransitMoonPack,
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

/**
 * Title + body for one of the 4 elements or 3 modalities — drives the
 * tap-to-detail modal behind the element/modality chips on the Person
 * hero. ID fallback for un-translated locales.
 */
export function elementMeaning(value: Element, locale: Locale): ClassificationMeaning {
  const pack = CLASSIFICATION_PACKS[locale] ?? CLASSIFICATION_PACKS.id!;
  return pack.element[value];
}

export function modalityMeaning(value: Modality, locale: Locale): ClassificationMeaning {
  const pack = CLASSIFICATION_PACKS[locale] ?? CLASSIFICATION_PACKS.id!;
  return pack.modality[value];
}

/** Per-sign copy for Venus (love style) or Mars (drive & anger). */
export function planetSignMeaning(
  planet: 'venus' | 'mars',
  sign: ZodiacSign,
  locale: Locale,
): PlanetMeaning {
  const pack = PLANET_PACKS[locale] ?? PLANET_PACKS.id!;
  return pack[planet][sign];
}

/** One-paragraph shadow / growth-edge blurb per sign. Used by the
 *  "Sisi bayangan" toggle under each placement row. */
export function shadowMeaning(sign: ZodiacSign, locale: Locale): string {
  const pack = SHADOW_PACKS[locale] ?? SHADOW_PACKS.id!;
  return pack[sign];
}

/** Ruler-planet display name + one-line theme. Fed by the classical
 *  RULER map in signs.ts — pass the planet id from `RULER[risingSign]`. */
export function rulerMeaning(planet: Planet, locale: Locale): RulerMeaning {
  const pack = RULER_PACKS[locale] ?? RULER_PACKS.id!;
  return pack[planet];
}

/** Vibe-of-today copy for the moon sign the Moon currently transits
 *  through. Feeds the "Bulan hari ini" card at the bottom of Zodiak. */
export function transitMoonBlurb(sign: ZodiacSign, locale: Locale): string {
  const pack = TRANSIT_MOON_PACKS[locale] ?? TRANSIT_MOON_PACKS.id!;
  return pack[sign];
}
