/**
 * Locale-aware loader for the Human Design content packs. Mirrors the
 * pattern from `lib/zodiac/content.ts` + `lib/numerology/meanings.ts`:
 * each pack is keyed by locale, with ID as the fallback when the
 * requested locale isn't shipped yet.
 *
 * v1 ships ID + EN as primary packs; the other 6 locales fall back to
 * ID. Run `scripts/translate-messages.ts` (or its content-pack sibling)
 * to author the remaining locales in a follow-up pass.
 */

import type { Locale } from '@/lib/i18n/config';
import idTypes from '@/content/humanDesign/types.id.json';
import enTypes from '@/content/humanDesign/types.en.json';
import idStrategies from '@/content/humanDesign/strategies.id.json';
import enStrategies from '@/content/humanDesign/strategies.en.json';
import idAuthorities from '@/content/humanDesign/authorities.id.json';
import enAuthorities from '@/content/humanDesign/authorities.en.json';
import idProfiles from '@/content/humanDesign/profiles.id.json';
import enProfiles from '@/content/humanDesign/profiles.en.json';
import idDefinitions from '@/content/humanDesign/definitions.id.json';
import enDefinitions from '@/content/humanDesign/definitions.en.json';
import type {
  HDAuthority,
  HDDefinition,
  HDStrategy,
  HDType,
} from './types';

export interface HDTypeContent {
  name: string;
  headline: string;
  body: string;
  gifts: string[];
  shadow: string;
}

export interface HDStrategyContent {
  name: string;
  headline: string;
  body: string;
}

export interface HDAuthorityContent {
  name: string;
  headline: string;
  body: string;
}

export interface HDProfileContent {
  name: string;
  headline: string;
  body: string;
}

export interface HDDefinitionContent {
  name: string;
  headline: string;
  body: string;
}

type Pack<T> = Partial<Record<Locale, Record<string, T>>>;

const TYPE_PACKS: Pack<HDTypeContent> = {
  id: idTypes as Record<string, HDTypeContent>,
  en: enTypes as Record<string, HDTypeContent>,
};

const STRATEGY_PACKS: Pack<HDStrategyContent> = {
  id: idStrategies as Record<string, HDStrategyContent>,
  en: enStrategies as Record<string, HDStrategyContent>,
};

const AUTHORITY_PACKS: Pack<HDAuthorityContent> = {
  id: idAuthorities as Record<string, HDAuthorityContent>,
  en: enAuthorities as Record<string, HDAuthorityContent>,
};

const PROFILE_PACKS: Pack<HDProfileContent> = {
  id: idProfiles as Record<string, HDProfileContent>,
  en: enProfiles as Record<string, HDProfileContent>,
};

const DEFINITION_PACKS: Pack<HDDefinitionContent> = {
  id: idDefinitions as Record<string, HDDefinitionContent>,
  en: enDefinitions as Record<string, HDDefinitionContent>,
};

function pick<T>(packs: Pack<T>, locale: Locale, key: string): T | null {
  const pack = packs[locale] ?? packs.id;
  if (!pack) return null;
  return pack[key] ?? null;
}

export function hdTypeContent(type: HDType, locale: Locale): HDTypeContent | null {
  return pick(TYPE_PACKS, locale, type);
}

export function hdStrategyContent(
  strategy: HDStrategy,
  locale: Locale,
): HDStrategyContent | null {
  return pick(STRATEGY_PACKS, locale, strategy);
}

export function hdAuthorityContent(
  authority: HDAuthority,
  locale: Locale,
): HDAuthorityContent | null {
  return pick(AUTHORITY_PACKS, locale, authority);
}

export function hdProfileContent(
  conscious: number,
  unconscious: number,
  locale: Locale,
): HDProfileContent | null {
  return pick(PROFILE_PACKS, locale, `${conscious}/${unconscious}`);
}

export function hdDefinitionContent(
  definition: HDDefinition,
  locale: Locale,
): HDDefinitionContent | null {
  return pick(DEFINITION_PACKS, locale, definition);
}
