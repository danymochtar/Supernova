import type { Locale } from '@/lib/i18n/config';
import type { NumerologyResult } from '@/lib/numerology';
import idPack from '@/content/compatibility/id.json';
import enPack from '@/content/compatibility/en.json';

type Pack = Record<string, string>;

const PACKS: Record<Locale, Pack> = {
  id: idPack as Pack,
  en: enPack as Pack,
};

/**
 * Normalize a number for compatibility key lookup. We pair on the **reduced**
 * single-digit form so masters and karmic-debt'd numbers find a narrative —
 * Life Path 11 looks up against the LP it reduces to (2). UI surfaces the
 * master/karmic flags separately.
 */
function key(a: NumerologyResult, b: NumerologyResult): string {
  const x = Math.min(a.reduced, b.reduced);
  const y = Math.max(a.reduced, b.reduced);
  return `lp:${x}-${y}`;
}

export function compatibilityNarrative(
  a: NumerologyResult,
  b: NumerologyResult,
  locale: Locale,
): string | null {
  const pack = PACKS[locale] ?? PACKS.id;
  return pack[key(a, b)] ?? null;
}
