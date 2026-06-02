import type { Locale } from '@/lib/i18n/config';
import idPack from '@/content/meanings/id.json';
import enPack from '@/content/meanings/en.json';

type Pack = Record<string, string>;

// Deterministic meaning packs — currently shipped for ID + EN. Other
// locales fall through to ID via the `??` at the call site. When more
// language packs are added, drop them in `content/meanings/{code}.json`
// and add the import here.
const PACKS: Partial<Record<Locale, Pack>> = {
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
  | 'essence'
  | 'bridge'
  | 'karmicLesson'
  | 'personalDayTitle'
  // Decoz second-tier derivatives — meaning is per the digit's energy
  // applied to that concept. Looked up via meaningFor('maturity', n) etc.
  | 'maturity'
  | 'hiddenPassion'
  | 'balance'
  | 'cornerstone'
  | 'subconsciousSelf'
  | 'rationalThought'
  | 'physicalPlane'
  | 'mentalPlane'
  | 'emotionalPlane'
  | 'intuitivePlane';

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
  const pack = PACKS[locale] ?? PACKS.id!;
  const masterKey = `${type}:${result.compound}`;
  if (result.isMaster && pack[masterKey]) return pack[masterKey];
  return pack[`${type}:${result.reduced}`] ?? null;
}
