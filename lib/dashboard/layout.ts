/**
 * Dashboard widget layout — what shows, in what order. Persisted as JSON
 * on Profile.dashboardLayout. Hidden widgets aren't rendered AND their
 * data isn't fetched, so the dashboard page only pays for what's on screen.
 */

export const WIDGET_IDS = [
  'reading', // daily AI reading (also hosts PD/PM/PY behind a tap)
  'feedback', // end-of-day journal prompt (auto-hides if chat active)
  'aboutMe', // AI synthesis carousel — now includes per-component numbers
  'karmic', // karmic lessons chips
] as const;

export type WidgetId = (typeof WIDGET_IDS)[number];

export interface WidgetState {
  id: WidgetId;
  hidden: boolean;
}

export const DEFAULT_LAYOUT: WidgetState[] = WIDGET_IDS.map((id) => ({ id, hidden: false }));

/**
 * Parse the persisted JSON, fall back to default on any anomaly. Always
 * returns an array containing every WIDGET_ID exactly once — new widgets
 * added after a user saved their layout get appended at the end (visible).
 */
export function parseLayout(raw: string | null | undefined): WidgetState[] {
  if (!raw) return DEFAULT_LAYOUT;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return DEFAULT_LAYOUT;
  }
  if (!Array.isArray(parsed)) return DEFAULT_LAYOUT;

  const seen = new Set<string>();
  const result: WidgetState[] = [];
  for (const entry of parsed) {
    if (!entry || typeof entry !== 'object') continue;
    const id = (entry as { id?: unknown }).id;
    if (typeof id !== 'string' || !WIDGET_IDS.includes(id as WidgetId) || seen.has(id)) continue;
    seen.add(id);
    result.push({ id: id as WidgetId, hidden: Boolean((entry as { hidden?: unknown }).hidden) });
  }
  // Append any new widget IDs that weren't in the saved layout (visible).
  for (const id of WIDGET_IDS) {
    if (!seen.has(id)) result.push({ id, hidden: false });
  }
  return result;
}

export function serializeLayout(layout: WidgetState[]): string {
  // Strip extras, keep canonical shape.
  return JSON.stringify(layout.map(({ id, hidden }) => ({ id, hidden })));
}
