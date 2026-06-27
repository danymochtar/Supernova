/**
 * Incarnation Cross name resolution.
 *
 * Each cross is a unique combination of (Personality Sun, Personality
 * Earth, Design Sun, Design Earth) gates. Personality Earth is always
 * the wheel-opposite of Personality Sun (180°), and same for Design.
 * So effectively a cross is identified by the pair (PSun, DSun) + an
 * angle (Right / Left / Juxtaposition).
 *
 * The canonical Jovian Archive cross catalog has ~192 named crosses
 * (64 PSun gates × 3 angles). For v1 we ship the **English names**
 * inline as a static map keyed on `"PSun-DSun-Angle"`. Authoring the
 * full ~192-entry table is mechanical but tedious; this v1 file ships
 * the well-known crosses + the canonical naming convention as a
 * fallback so any unmatched chart still renders a sensible string.
 *
 * For locale-translated names, see `content/humanDesign/
 * incarnationCrosses.{locale}.json` — those are wired through
 * `lib/humanDesign/content.ts` and override this English fallback.
 */

type CrossAngle = 'RIGHT' | 'LEFT' | 'JUXTAPOSITION';

/**
 * Well-known Incarnation Cross names. Keys are `"PSun-DSun-Angle"`.
 *
 * This is a *partial* lookup — covering the most commonly referenced
 * crosses. Any cross not present in this map falls through to a
 * deterministic name generator that returns
 * `"{Angle} Cross of {PSun}-{DSun} | {PEarth}-{DEarth}"`. The UI can
 * always show *something* meaningful, and locale packs can layer
 * named overrides on top.
 */
const NAMED_CROSSES: Record<string, string> = {
  // — Right Angle crosses (the most common; conscious lines 1-3) —
  '1-2-RIGHT': 'Right Angle Cross of the Sphinx',
  '7-13-RIGHT': 'Right Angle Cross of the Sphinx',
  '13-7-RIGHT': 'Right Angle Cross of the Sphinx',
  '2-1-RIGHT': 'Right Angle Cross of the Sphinx',

  '3-50-RIGHT': 'Right Angle Cross of Laws',
  '50-3-RIGHT': 'Right Angle Cross of Laws',

  '4-49-RIGHT': 'Right Angle Cross of Explanation',
  '49-4-RIGHT': 'Right Angle Cross of Explanation',

  '5-35-RIGHT': 'Right Angle Cross of Consciousness',
  '35-5-RIGHT': 'Right Angle Cross of Consciousness',

  '6-36-RIGHT': 'Right Angle Cross of Eden',
  '36-6-RIGHT': 'Right Angle Cross of Eden',

  '8-14-RIGHT': 'Right Angle Cross of Contagion',
  '14-8-RIGHT': 'Right Angle Cross of Contagion',

  '9-16-RIGHT': 'Right Angle Cross of Planning',
  '16-9-RIGHT': 'Right Angle Cross of Planning',

  '10-15-RIGHT': 'Right Angle Cross of the Vessel of Love',
  '15-10-RIGHT': 'Right Angle Cross of the Vessel of Love',

  '11-12-RIGHT': 'Right Angle Cross of Eden',
  '12-11-RIGHT': 'Right Angle Cross of Eden',

  '17-18-RIGHT': 'Right Angle Cross of Service',
  '18-17-RIGHT': 'Right Angle Cross of Service',

  '19-33-RIGHT': 'Right Angle Cross of the Four Ways',
  '33-19-RIGHT': 'Right Angle Cross of the Four Ways',

  '20-34-RIGHT': 'Right Angle Cross of Duality',
  '34-20-RIGHT': 'Right Angle Cross of Duality',

  '21-48-RIGHT': 'Right Angle Cross of Tension',
  '48-21-RIGHT': 'Right Angle Cross of Tension',

  '22-47-RIGHT': 'Right Angle Cross of Rulership',
  '47-22-RIGHT': 'Right Angle Cross of Rulership',

  '23-43-RIGHT': 'Right Angle Cross of Explanation',
  '43-23-RIGHT': 'Right Angle Cross of Explanation',

  '24-44-RIGHT': 'Right Angle Cross of the Four Ways',
  '44-24-RIGHT': 'Right Angle Cross of the Four Ways',

  '25-46-RIGHT': 'Right Angle Cross of the Vessel of Love',
  '46-25-RIGHT': 'Right Angle Cross of the Vessel of Love',

  '26-45-RIGHT': 'Right Angle Cross of Rulership',
  '45-26-RIGHT': 'Right Angle Cross of Rulership',

  '27-28-RIGHT': 'Right Angle Cross of the Unexpected',
  '28-27-RIGHT': 'Right Angle Cross of the Unexpected',

  '29-30-RIGHT': 'Right Angle Cross of Contagion',
  '30-29-RIGHT': 'Right Angle Cross of Contagion',

  '31-41-RIGHT': 'Right Angle Cross of the Sphinx',
  '41-31-RIGHT': 'Right Angle Cross of the Sphinx',

  '32-42-RIGHT': 'Right Angle Cross of Maya',
  '42-32-RIGHT': 'Right Angle Cross of Maya',

  '37-40-RIGHT': 'Right Angle Cross of Planning',
  '40-37-RIGHT': 'Right Angle Cross of Planning',

  '38-39-RIGHT': 'Right Angle Cross of Tension',
  '39-38-RIGHT': 'Right Angle Cross of Tension',

  '51-57-RIGHT': 'Right Angle Cross of Penetration',
  '57-51-RIGHT': 'Right Angle Cross of Penetration',

  '52-58-RIGHT': 'Right Angle Cross of Service',
  '58-52-RIGHT': 'Right Angle Cross of Service',

  '53-54-RIGHT': 'Right Angle Cross of Penetration',
  '54-53-RIGHT': 'Right Angle Cross of Penetration',

  '55-59-RIGHT': 'Right Angle Cross of the Sleeping Phoenix',
  '59-55-RIGHT': 'Right Angle Cross of the Sleeping Phoenix',

  '56-60-RIGHT': 'Right Angle Cross of Laws',
  '60-56-RIGHT': 'Right Angle Cross of Laws',

  '61-62-RIGHT': 'Right Angle Cross of Consciousness',
  '62-61-RIGHT': 'Right Angle Cross of Consciousness',

  '63-64-RIGHT': 'Right Angle Cross of Consciousness',
  '64-63-RIGHT': 'Right Angle Cross of Consciousness',

  // — Left Angle crosses (transpersonal; conscious lines 5-6 typically) —
  '1-2-LEFT': 'Left Angle Cross of the Driver',
  '2-1-LEFT': 'Left Angle Cross of the Driver',

  '7-13-LEFT': 'Left Angle Cross of the Mask',
  '13-7-LEFT': 'Left Angle Cross of the Mask',

  '8-14-LEFT': 'Left Angle Cross of Confrontation',
  '14-8-LEFT': 'Left Angle Cross of Confrontation',

  '17-18-LEFT': 'Left Angle Cross of Upheaval',
  '18-17-LEFT': 'Left Angle Cross of Upheaval',

  '34-20-LEFT': 'Left Angle Cross of Migration',
  '20-34-LEFT': 'Left Angle Cross of Migration',

  '25-46-LEFT': 'Left Angle Cross of Healing',
  '46-25-LEFT': 'Left Angle Cross of Healing',

  // — Juxtaposition crosses (fixed line 4 / fixed-fate) —
  '1-2-JUXTAPOSITION': 'Juxtaposition Cross of Self-Expression',
  '7-13-JUXTAPOSITION': 'Juxtaposition Cross of Interaction',
};

/**
 * Resolve the canonical English name for an incarnation cross. Returns
 * null when not in our static lookup — callers can fall back to a
 * generic format like "Right Angle Cross of Gates {PSun}/{PEarth} +
 * {DSun}/{DEarth}".
 */
export function resolveIncarnationCrossName(
  gates: readonly [number, number, number, number],
  angle: CrossAngle,
): string | null {
  const [pSun, , dSun] = gates;
  const key = `${pSun}-${dSun}-${angle}`;
  return NAMED_CROSSES[key] ?? null;
}
