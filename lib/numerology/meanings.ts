import type { Locale } from '@/lib/i18n/config';
import idPack from '@/content/meanings/id.json';
import enPack from '@/content/meanings/en.json';

type Pack = Record<string, string>;

const PACKS: Record<Locale, Pack> = {
  id: idPack as Pack,
  en: enPack as Pack,
};

export type MeaningType =
  | 'lifePath'
  | 'expression'
  | 'soulUrge'
  | 'personality'
  | 'birthday'
  | 'personalYear'
  | 'personalMonth'
  | 'personalDay'
  | 'pinnacle'
  | 'challenge'
  | 'cycle'
  | 'karmicLesson'
  | 'personalDayTitle';

/**
 * Look up a deterministic meaning string for a given (type, reduced number)
 * pair. Falls back to the user's locale, then to `null` so the UI can show a
 * "coming soon" message for entries we haven't curated yet.
 *
 * Master numbers (11/22/33) and karmic-debt'd numbers look up by their
 * compound first, then fall back to the reduced single-digit form so newly-
 * added types still have something to render.
 */
export function meaningFor(
  type: MeaningType,
  result: { compound: number; reduced: number; isMaster: boolean },
  locale: Locale,
): string | null {
  const pack = PACKS[locale] ?? PACKS.id;
  const masterKey = `${type}:${result.compound}`;
  if (result.isMaster && pack[masterKey]) return pack[masterKey];
  return pack[`${type}:${result.reduced}`] ?? null;
}
