import type { Locale } from '@/lib/i18n/config';
import idPack from '@/content/meanings/id.json';
import enPack from '@/content/meanings/en.json';
import loveIdPack from '@/content/meanings/love.id.json';
import loveEnPack from '@/content/meanings/love.en.json';
import financeIdPack from '@/content/meanings/finance.id.json';
import financeEnPack from '@/content/meanings/finance.en.json';

type Pack = Record<string, string>;

// Deterministic meaning packs — currently shipped for ID + EN. Other
// locales fall through to ID via the `??` at the call site. When more
// language packs are added, drop them in `content/meanings/{code}.json`
// and add the import here.
const PACKS: Partial<Record<Locale, Pack>> = {
  id: idPack as Pack,
  en: enPack as Pack,
};

// Aspect-scoped overrides: same `{type}:{num}` key shape, but the prose is
// framed for the love or money lens. When a key exists in the aspect pack
// it wins over the generic pack — so Soul Urge 6 on Love reads about
// craving warmth in a relationship, while on Money it reads about
// craving financial security for the people you love.
type Aspect = 'love' | 'finance';
const ASPECT_PACKS: Record<Aspect, Partial<Record<Locale, Pack>>> = {
  love: { id: loveIdPack as Pack, en: loveEnPack as Pack },
  finance: { id: financeIdPack as Pack, en: financeEnPack as Pack },
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
  options?: { aspect?: Aspect },
): string | null {
  const masterKey = `${type}:${result.compound}`;
  const reducedKey = `${type}:${result.reduced}`;

  // Aspect pack wins when it has an entry for this exact (type, number) pair.
  // Falls through to the generic pack so we never blank out a card just
  // because the aspect pack hasn't covered a master number yet.
  if (options?.aspect) {
    const aspectPack = ASPECT_PACKS[options.aspect][locale] ?? ASPECT_PACKS[options.aspect].id;
    if (aspectPack) {
      if (result.isMaster && aspectPack[masterKey]) return aspectPack[masterKey];
      if (aspectPack[reducedKey]) return aspectPack[reducedKey];
    }
  }

  const pack = PACKS[locale] ?? PACKS.id!;
  if (result.isMaster && pack[masterKey]) return pack[masterKey];
  return pack[reducedKey] ?? null;
}
