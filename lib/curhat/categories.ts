/**
 * Curhat capability tags. A single flat set of life-area categories used to
 * tag a chat (curhat) session and the journal entry it produces, and to group
 * the journal by capability. Kept deliberately flat (6 values) so the per-page
 * shortcut, the chat chip, and the journal grouping all line up 1:1.
 */

export const CATEGORIES = [
  'pribadi',
  'perjalanan',
  'percintaan',
  'keuangan',
  'karier',
  'relationship',
] as const;

export type Category = (typeof CATEGORIES)[number];

/** Display + grouping order (used for journal section ordering + tie-breaks). */
export const CATEGORY_ORDER: readonly Category[] = CATEGORIES;

export function isCategory(value: unknown): value is Category {
  return typeof value === 'string' && (CATEGORIES as readonly string[]).includes(value);
}

/** Map a Kehidupan sub-tab to its curhat category. "tentang" (self-portrait)
 *  reads as the general "pribadi" bucket; the rest map by name. */
export function categoryForKehidupanTab(
  tab: 'tentang' | 'perjalanan' | 'percintaan' | 'keuangan',
): Category {
  return tab === 'tentang' ? 'pribadi' : tab;
}

/**
 * Pick the dominant category from a set of per-turn topics (e.g. when several
 * chat turns are journaled into one entry). Most frequent wins; ties broken by
 * CATEGORY_ORDER for determinism. Returns null when none of the topics is a
 * known category (the entry is then shown under "Lainnya").
 */
export function deriveCategory(topics: ReadonlyArray<string | null | undefined>): Category | null {
  const counts = new Map<Category, number>();
  for (const t of topics) {
    if (isCategory(t)) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  if (counts.size === 0) return null;
  return [...counts.entries()].sort(
    (a, b) => b[1] - a[1] || CATEGORY_ORDER.indexOf(a[0]) - CATEGORY_ORDER.indexOf(b[0]),
  )[0]![0];
}
