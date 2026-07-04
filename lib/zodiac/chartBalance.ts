/**
 * Element + Modality distribution across a person's chart placements.
 * Used by the Zodiak view to surface "kamu 2 Bumi · 1 Air · 0 Api …" —
 * fast signal about which mode the person defaults into.
 *
 * Pure math over the existing ELEMENT + MODALITY maps in `signs.ts`. No
 * new data. Counts only non-null placements — a partial chart (Sun only,
 * no birth time) returns a 1-of-1 count on whatever Sun element is.
 */

import type { Element, Modality, ZodiacSign } from './signs';
import { ELEMENT, MODALITY } from './signs';

export interface ChartBalance {
  /** Total non-null placements counted. */
  total: number;
  elements: Record<Element, number>;
  modalities: Record<Modality, number>;
  /** The element with the highest count. `null` when nothing is dominant
   *  (all zero or a tie at zero). Ties above zero return the first one
   *  in fire → earth → air → water order — good enough for a headline
   *  chip. */
  dominantElement: Element | null;
  /** Same shape for modality dominance. */
  dominantModality: Modality | null;
  /** Elements the chart has none of. Used to surface "kamu kurang Fire"
   *  as a growth-edge cue. */
  missingElements: Element[];
}

export function computeChartBalance(
  placements: readonly (ZodiacSign | null)[],
): ChartBalance {
  const elements: Record<Element, number> = { fire: 0, earth: 0, air: 0, water: 0 };
  const modalities: Record<Modality, number> = { cardinal: 0, fixed: 0, mutable: 0 };
  let total = 0;

  for (const sign of placements) {
    if (!sign) continue;
    elements[ELEMENT[sign]] += 1;
    modalities[MODALITY[sign]] += 1;
    total += 1;
  }

  const dominantElement = pickDominant(elements, ['fire', 'earth', 'air', 'water']);
  const dominantModality = pickDominant(modalities, ['cardinal', 'fixed', 'mutable']);
  const missingElements = (['fire', 'earth', 'air', 'water'] as const).filter(
    (e) => elements[e] === 0,
  );

  return { total, elements, modalities, dominantElement, dominantModality, missingElements };
}

function pickDominant<K extends string>(
  counts: Record<K, number>,
  order: readonly K[],
): K | null {
  let best: K | null = null;
  let bestCount = 0;
  for (const k of order) {
    if (counts[k] > bestCount) {
      best = k;
      bestCount = counts[k];
    }
  }
  return bestCount > 0 ? best : null;
}
