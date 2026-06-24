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
 * raw material the AI weaves into a plain, practical reading + a closing
 * positive-CTA list:
 *
 *   - keywords: 8-10 archetypal words (title + opening texture seeds).
 *   - posture:  one-line "energy of the day" — written plainly, NOT as a
 *               literary metaphor. ✅ "Today rewards first moves and
 *               self-trust." ❌ "Today is the door that swings open."
 *   - money / career / love / social / self: arrays of 2-3 short positive
 *               imperatives, ≤10 words each, expressed in everyday
 *               language. The prompt picks the resonant ones across the
 *               two intent blocks (day + month) and emits them as
 *               `→ {domain}: {imperative}` lines under the prose, always
 *               re-voiced in the locale's register — never quoted
 *               verbatim. Mix of domains is required so the closing list
 *               isn't all-money or all-self.
 *   - watch_out: one-line awareness seed. Frame is observation about
 *               today's pattern, not a prohibition. ❌ "Don't gamble."
 *               ✅ "You may be more transparent than usual — what you
 *               hide reads easily." The model emits this as the single
 *               trailing `~ Awareness:` line.
 *
 * Deliberately NO `imagery` field. Earlier prompt revisions seeded
 * WN-style sensory metaphors ("in the wake of a ship", "benang yang
 * ujungnya udah tinggal selangkah lagi"), but those landed as
 * AI-flavored and inaccessible to readers across knowledge levels. The
 * prompt now explicitly forbids "kayak…"-style analogies in prose; the
 * dictionary stays plain on purpose.
 *
 * Keys cover 1-9 + the three master compounds (11/22/33). Master Personal
 * Day / Personal Month / Personal Year all stay in master form in the
 * Decoz tradition, so we author full master variants instead of
 * collapsing them.
 */
export interface DailyIntent {
  keywords: string[];
  posture: string;
  money: string[];
  career: string[];
  love: string[];
  social: string[];
  self: string[];
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
