import type { Locale } from '@/lib/i18n/config';
import idIntents from '@/content/dailyIntents/id.json';
import enIntents from '@/content/dailyIntents/en.json';
import msIntents from '@/content/dailyIntents/ms.json';
import zhIntents from '@/content/dailyIntents/zh.json';
import jaIntents from '@/content/dailyIntents/ja.json';
import koIntents from '@/content/dailyIntents/ko.json';
import esIntents from '@/content/dailyIntents/es.json';
import arIntents from '@/content/dailyIntents/ar.json';

/**
 * Per-digit intent dictionary for the daily reading. Each entry is the
 * raw material the AI weaves into the day's WN-style prose + CTAs:
 *
 *   - keywords:  archetypal words for the title and opening texture.
 *   - posture:   one-line "energy of the day" through this digit's lens.
 *   - money / career / love / social / self: domain-specific calls to
 *     action. The prompt picks 3-4 of these (based on which digits
 *     dominate today) and lifts them into the bullet list at the bottom.
 *   - watch_out: the digit's typical pitfall, framed as a positive move
 *     ("when X rises, do Y") — never a prohibition.
 *
 * Keys cover 1-9 + the three master compounds (11/22/33). Master Personal
 * Day / Personal Month / Personal Year all stay in master form in the
 * Decoz tradition, so we author full master variants instead of
 * collapsing them.
 */
export interface DailyIntent {
  keywords: string[];
  posture: string;
  money: string;
  career: string;
  love: string;
  social: string;
  self: string;
  watch_out: string;
}

type IntentPack = Record<string, DailyIntent>;

const PACKS: Partial<Record<Locale, IntentPack>> = {
  id: idIntents as IntentPack,
  en: enIntents as IntentPack,
  ms: msIntents as IntentPack,
  zh: zhIntents as IntentPack,
  ja: jaIntents as IntentPack,
  ko: koIntents as IntentPack,
  es: esIntents as IntentPack,
  ar: arIntents as IntentPack,
};

/**
 * Look up the intent dictionary for a single digit. Accepts both the
 * single-digit reduction (1-9) and the master compound (11/22/33) —
 * unknown values fall back to `null` (caller should skip).
 *
 * Locales without their own pack fall back to ID, matching the
 * existing `content/meanings` + `content/zodiac` pattern.
 */
export function dailyIntent(digit: number, locale: Locale): DailyIntent | null {
  const pack = PACKS[locale] ?? PACKS.id!;
  return pack[String(digit)] ?? null;
}
