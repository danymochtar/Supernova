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
import idCenters from '@/content/humanDesign/centers.id.json';
import enCenters from '@/content/humanDesign/centers.en.json';
import idChannels from '@/content/humanDesign/channels.id.json';
import enChannels from '@/content/humanDesign/channels.en.json';
import idGates from '@/content/humanDesign/gates.id.json';
import enGates from '@/content/humanDesign/gates.en.json';
import idLines from '@/content/humanDesign/lines.id.json';
import enLines from '@/content/humanDesign/lines.en.json';
import type {
  HDAuthority,
  HDCenter,
  HDDefinition,
  HDLine,
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

export interface HDCenterContent {
  name: string;
  headline: string;
  body: string;
  /** Optional — only meaningful for undefined centers (the "open" side). */
  gift?: string;
  shadow?: string;
}

export interface HDChannelContent {
  name: string;
  body: string;
}

export interface HDGateContent {
  name: string;
  keynote: string;
  body: string;
}

export interface HDLineContent {
  name: string;
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

/** Centers are keyed `"{HDCenter}_{defined|undefined}"` in the JSON so
 *  one map covers both modes — keeps the loader function call shape
 *  simple at the call site. */
const CENTER_PACKS: Pack<HDCenterContent> = {
  id: idCenters as Record<string, HDCenterContent>,
  en: enCenters as Record<string, HDCenterContent>,
};

/** Channels keyed by the channel's index in `CHANNELS` (0-35) as a
 *  string — JSON object keys are strings. */
const CHANNEL_PACKS: Pack<HDChannelContent> = {
  id: idChannels as Record<string, HDChannelContent>,
  en: enChannels as Record<string, HDChannelContent>,
};

/** Gates keyed `"1"`…`"64"`. */
const GATE_PACKS: Pack<HDGateContent> = {
  id: idGates as Record<string, HDGateContent>,
  en: enGates as Record<string, HDGateContent>,
};

/** Lines keyed `"1"`…`"6"` — the six archetypal line meanings. */
const LINE_PACKS: Pack<HDLineContent> = {
  id: idLines as Record<string, HDLineContent>,
  en: enLines as Record<string, HDLineContent>,
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

export function hdCenterContent(
  center: HDCenter,
  defined: boolean,
  locale: Locale,
): HDCenterContent | null {
  return pick(CENTER_PACKS, locale, `${center}_${defined ? 'defined' : 'undefined'}`);
}

export function hdChannelContent(
  channelIndex: number,
  locale: Locale,
): HDChannelContent | null {
  return pick(CHANNEL_PACKS, locale, String(channelIndex));
}

export function hdGateContent(gate: number, locale: Locale): HDGateContent | null {
  return pick(GATE_PACKS, locale, String(gate));
}

export function hdLineContent(line: HDLine, locale: Locale): HDLineContent | null {
  return pick(LINE_PACKS, locale, String(line));
}
