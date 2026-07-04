/**
 * Server-side computation of Moon and Rising (Ascendant) zodiac signs
 * from a (DOB, birth time, birth timezone) tuple. Uses
 * `circular-natal-horoscope-js` for the ephemeris math.
 *
 * Latitude / longitude is approximated from the IANA timezone via the
 * static map below — accurate enough for sign identification (each sign
 * is 30°, our worst-case lat/lon error is well under that). Storing
 * lat/lon per user would be more accurate but would require a city
 * picker + geocoding; this is a deliberate trade-off in favor of UX
 * simplicity.
 *
 * Note: `circular-natal-horoscope-js` is published as CommonJS without
 * TypeScript declarations on the API surface we use, so we type the
 * shape inline.
 */

import { Horoscope, Origin } from 'circular-natal-horoscope-js';

import { sunSignFromDob, type ZodiacSign } from './signs';

interface LatLon {
  lat: number;
  lon: number;
}

/**
 * IANA timezone → approximate lat / lon of the timezone's "center".
 * Chosen to cover Indonesia + SEA + the major world timezones the user
 * picker exposes (see `lib/timezones.ts`). Unknown timezones fall back
 * to (0, 0) which produces a "best-effort" but lower-accuracy Rising.
 */
const TZ_LATLON: Record<string, LatLon> = {
  // Indonesia
  'Asia/Jakarta': { lat: -6.2, lon: 106.85 },
  'Asia/Pontianak': { lat: -0.03, lon: 109.33 },
  'Asia/Makassar': { lat: -5.13, lon: 119.41 },
  'Asia/Jayapura': { lat: -2.53, lon: 140.7 },
  // SEA
  'Asia/Singapore': { lat: 1.35, lon: 103.82 },
  'Asia/Kuala_Lumpur': { lat: 3.14, lon: 101.69 },
  'Asia/Manila': { lat: 14.6, lon: 120.98 },
  'Asia/Bangkok': { lat: 13.75, lon: 100.5 },
  'Asia/Ho_Chi_Minh': { lat: 10.82, lon: 106.63 },
  // East Asia
  'Asia/Tokyo': { lat: 35.69, lon: 139.69 },
  'Asia/Seoul': { lat: 37.57, lon: 126.98 },
  'Asia/Hong_Kong': { lat: 22.32, lon: 114.17 },
  'Asia/Shanghai': { lat: 31.23, lon: 121.47 },
  'Asia/Taipei': { lat: 25.03, lon: 121.57 },
  // South / West Asia
  'Asia/Kolkata': { lat: 28.61, lon: 77.21 },
  'Asia/Dubai': { lat: 25.2, lon: 55.27 },
  'Asia/Riyadh': { lat: 24.71, lon: 46.68 },
  // Europe
  'Europe/London': { lat: 51.51, lon: -0.13 },
  'Europe/Paris': { lat: 48.86, lon: 2.35 },
  'Europe/Berlin': { lat: 52.52, lon: 13.41 },
  'Europe/Madrid': { lat: 40.42, lon: -3.7 },
  'Europe/Rome': { lat: 41.9, lon: 12.5 },
  'Europe/Istanbul': { lat: 41.01, lon: 28.98 },
  'Europe/Moscow': { lat: 55.76, lon: 37.62 },
  // Americas
  'America/New_York': { lat: 40.71, lon: -74.0 },
  'America/Chicago': { lat: 41.88, lon: -87.63 },
  'America/Denver': { lat: 39.74, lon: -104.99 },
  'America/Los_Angeles': { lat: 34.05, lon: -118.24 },
  'America/Sao_Paulo': { lat: -23.55, lon: -46.63 },
  'America/Mexico_City': { lat: 19.43, lon: -99.13 },
  'America/Buenos_Aires': { lat: -34.6, lon: -58.38 },
  'America/Toronto': { lat: 43.65, lon: -79.38 },
  // Oceania
  'Australia/Sydney': { lat: -33.87, lon: 151.21 },
  'Australia/Melbourne': { lat: -37.81, lon: 144.96 },
  'Australia/Perth': { lat: -31.95, lon: 115.86 },
  'Pacific/Auckland': { lat: -36.85, lon: 174.76 },
  // Africa
  'Africa/Cairo': { lat: 30.04, lon: 31.24 },
  'Africa/Johannesburg': { lat: -26.2, lon: 28.05 },
  'Africa/Lagos': { lat: 6.45, lon: 3.4 },
  'Africa/Nairobi': { lat: -1.29, lon: 36.82 },
  'Etc/UTC': { lat: 0, lon: 0 },
};

function approxLatLon(timezone: string): LatLon {
  return TZ_LATLON[timezone] ?? { lat: 0, lon: 0 };
}

/** Convert "Aries" / "Taurus" / … (library output) to our lowercase id. */
function normalizeSign(label: string | null | undefined): ZodiacSign | null {
  if (!label) return null;
  const lower = label.toLowerCase();
  const valid: ZodiacSign[] = [
    'aries',
    'taurus',
    'gemini',
    'cancer',
    'leo',
    'virgo',
    'libra',
    'scorpio',
    'sagittarius',
    'capricorn',
    'aquarius',
    'pisces',
  ];
  return valid.includes(lower as ZodiacSign) ? (lower as ZodiacSign) : null;
}

interface BirthInput {
  /** DOB year (4-digit). */
  year: number;
  /** DOB month, 1-12. */
  month: number;
  /** DOB day-of-month, 1-31. */
  day: number;
  /** Local birth time "HH:MM" (24-hour, in `timezone`). */
  birthTime: string;
  /** IANA timezone of the birth instant. */
  timezone: string;
  /** Optional precise birth-place coordinates. When supplied, they
   *  override the timezone-center approximation — this is what the
   *  city picker on the form passes through, and what produces an
   *  accurate Ascendant. */
  lat?: number;
  lon?: number;
}

export interface BirthChartResult {
  moon: ZodiacSign | null;
  rising: ZodiacSign | null;
}

/**
 * Full birth-chart placements — Sun, Moon, Rising (Ascendant), Venus,
 * Mars. Venus + Mars each require the same DOB/time/location as Moon, so
 * the engine returns them together to keep the ephemeris construction to
 * a single call.
 */
export interface ExtendedChartResult {
  sun: ZodiacSign | null;
  moon: ZodiacSign | null;
  rising: ZodiacSign | null;
  venus: ZodiacSign | null;
  mars: ZodiacSign | null;
}

/**
 * Compute Moon and Ascendant signs from birth data. Returns `null` for
 * either field if the input can't be interpreted (invalid time string,
 * library throws). The compute call costs ~1ms and is pure, so callers
 * just run it inline on form submit and persist the result.
 */
export function computeMoonAndRising(input: BirthInput): BirthChartResult {
  // Validate the time string before touching the library — its error
  // messages aren't user-friendly enough to surface, so we bail early.
  const m = input.birthTime.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return { moon: null, rising: null };
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) return { moon: null, rising: null };
  if (!Number.isFinite(minute) || minute < 0 || minute > 59) return { moon: null, rising: null };

  // Precise coords from the city picker win; fall back to the
  // timezone-center map when no city was selected.
  const approx = approxLatLon(input.timezone);
  const lat = typeof input.lat === 'number' && Number.isFinite(input.lat) ? input.lat : approx.lat;
  const lon = typeof input.lon === 'number' && Number.isFinite(input.lon) ? input.lon : approx.lon;

  try {
    // The library's `month` is 0-indexed (Jan = 0) despite the API
    // shape — gotcha called out in its README. We accept 1-12 from the
    // caller (consistent with the rest of `lib/numerology`).
    const origin = new (Origin as unknown as new (args: {
      year: number;
      month: number;
      date: number;
      hour: number;
      minute: number;
      latitude: number;
      longitude: number;
    }) => unknown)({
      year: input.year,
      month: input.month - 1,
      date: input.day,
      hour,
      minute,
      latitude: lat,
      longitude: lon,
    });
    const horoscope = new (Horoscope as unknown as new (args: {
      origin: unknown;
      houseSystem?: string;
      zodiac?: string;
    }) => {
      CelestialBodies: { moon: { Sign: { label: string } } };
      Ascendant: { Sign: { label: string } };
    })({
      origin,
      houseSystem: 'whole-sign',
      zodiac: 'tropical',
    });

    return {
      moon: normalizeSign(horoscope.CelestialBodies.moon?.Sign?.label),
      rising: normalizeSign(horoscope.Ascendant?.Sign?.label),
    };
  } catch {
    return { moon: null, rising: null };
  }
}

/**
 * Compute the full set of placements exposed on the Zodiak view — Sun,
 * Moon, Rising, Venus, Mars. Sun is derived from DOB alone (no time
 * needed) so it always returns a sign when the date is valid; the rest
 * need a valid birth time and coordinates.
 *
 * Failures on the time/library path degrade gracefully: only the
 * time-dependent placements go null. Callers render partial data.
 */
export function computeExtendedChart(input: {
  year: number;
  month: number;
  day: number;
  birthTime: string | null;
  timezone: string | null;
  lat?: number | null;
  lon?: number | null;
}): ExtendedChartResult {
  // Sun is a pure function of DOB — safe to compute regardless of the
  // rest.
  const sun = sunSignFromDob({ month: input.month, day: input.day });

  if (!input.birthTime || !input.timezone) {
    return { sun, moon: null, rising: null, venus: null, mars: null };
  }
  const m = input.birthTime.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return { sun, moon: null, rising: null, venus: null, mars: null };
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) {
    return { sun, moon: null, rising: null, venus: null, mars: null };
  }
  if (!Number.isFinite(minute) || minute < 0 || minute > 59) {
    return { sun, moon: null, rising: null, venus: null, mars: null };
  }

  const approx = approxLatLon(input.timezone);
  const lat = typeof input.lat === 'number' && Number.isFinite(input.lat) ? input.lat : approx.lat;
  const lon = typeof input.lon === 'number' && Number.isFinite(input.lon) ? input.lon : approx.lon;

  try {
    const origin = new (Origin as unknown as new (args: {
      year: number;
      month: number;
      date: number;
      hour: number;
      minute: number;
      latitude: number;
      longitude: number;
    }) => unknown)({
      year: input.year,
      month: input.month - 1,
      date: input.day,
      hour,
      minute,
      latitude: lat,
      longitude: lon,
    });
    const horoscope = new (Horoscope as unknown as new (args: {
      origin: unknown;
      houseSystem?: string;
      zodiac?: string;
    }) => {
      CelestialBodies: {
        moon: { Sign: { label: string } };
        venus: { Sign: { label: string } };
        mars: { Sign: { label: string } };
      };
      Ascendant: { Sign: { label: string } };
    })({
      origin,
      houseSystem: 'whole-sign',
      zodiac: 'tropical',
    });

    return {
      sun,
      moon: normalizeSign(horoscope.CelestialBodies.moon?.Sign?.label),
      rising: normalizeSign(horoscope.Ascendant?.Sign?.label),
      venus: normalizeSign(horoscope.CelestialBodies.venus?.Sign?.label),
      mars: normalizeSign(horoscope.CelestialBodies.mars?.Sign?.label),
    };
  } catch {
    return { sun, moon: null, rising: null, venus: null, mars: null };
  }
}

/**
 * Zodiac sign the Moon transits through on a given calendar day (noon
 * UTC as the reference instant). Feeds the "Bulan hari ini" transit
 * card — refreshes daily. Location isn't meaningful for Moon-sign
 * lookup (Moon changes sign every ~2.5 days regardless of viewer
 * location), so we default to lat/lon = 0.
 */
export function transitMoonSign(date: Date): ZodiacSign | null {
  try {
    const origin = new (Origin as unknown as new (args: {
      year: number;
      month: number;
      date: number;
      hour: number;
      minute: number;
      latitude: number;
      longitude: number;
    }) => unknown)({
      year: date.getUTCFullYear(),
      month: date.getUTCMonth(),
      date: date.getUTCDate(),
      hour: 12,
      minute: 0,
      latitude: 0,
      longitude: 0,
    });
    const horoscope = new (Horoscope as unknown as new (args: {
      origin: unknown;
      houseSystem?: string;
      zodiac?: string;
    }) => {
      CelestialBodies: { moon: { Sign: { label: string } } };
    })({
      origin,
      houseSystem: 'whole-sign',
      zodiac: 'tropical',
    });
    return normalizeSign(horoscope.CelestialBodies.moon?.Sign?.label);
  } catch {
    return null;
  }
}
