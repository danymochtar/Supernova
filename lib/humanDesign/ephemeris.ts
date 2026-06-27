/**
 * Ephemeris wrapper for Human Design — produces ecliptic longitudes of
 * the 13 planetary objects HD uses, at any datetime + lat/lon.
 *
 * The underlying library is `circular-natal-horoscope-js`, which is
 * already a runtime dep (used by `lib/zodiac/birthChart.ts` for Moon /
 * Rising). HD requires nothing more than ecliptic longitudes — no house
 * cusps, no aspects, no chart placement math beyond what this library
 * already returns.
 *
 * The library exposes Sun + Moon + classical planets via `CelestialBodies`
 * and North/South Node via `CelestialPoints`. We derive Earth as the 180°
 * opposite of Sun (always exact astronomically).
 */

import { Horoscope, Origin } from 'circular-natal-horoscope-js';

import type { HDPlanet } from './types';

export interface EphemerisInput {
  /** UTC year. */
  year: number;
  /** Month, 1-12 (we adapt to the library's 0-indexed month internally). */
  month: number;
  /** Day-of-month, 1-31. */
  day: number;
  /** UTC hour, 0-23. The caller is responsible for converting local
   *  birth time → UTC using the IANA timezone before calling. */
  hour: number;
  /** UTC minute, 0-59. */
  minute: number;
  /** Latitude (north positive), -90..90. */
  lat: number;
  /** Longitude (east positive), -180..180. */
  lon: number;
}

export type PlanetaryLongitudes = Record<HDPlanet, number>;

/**
 * Compute ecliptic longitudes of the 13 HD planetary objects at the
 * given UTC moment. All angles in [0, 360).
 *
 * @throws if the library refuses the input (invalid date / coords).
 */
export function planetaryLongitudes(input: EphemerisInput): PlanetaryLongitudes {
  // The library's `month` is 0-indexed; we expose 1-indexed to match the
  // rest of the codebase (numerology, zodiac).
  const origin = new (Origin as unknown as new (a: {
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
    hour: input.hour,
    minute: input.minute,
    latitude: input.lat,
    longitude: input.lon,
  });

  type RawBody = { ChartPosition: { Ecliptic: { DecimalDegrees: number } } };
  type HoroscopeShape = {
    CelestialBodies: Record<string, RawBody>;
    CelestialPoints: Record<string, RawBody>;
  };

  const horoscope = new (Horoscope as unknown as new (a: {
    origin: unknown;
    houseSystem?: string;
    zodiac?: string;
  }) => HoroscopeShape)({
    origin,
    houseSystem: 'whole-sign',
    zodiac: 'tropical',
  });

  const ecl = (path: { ChartPosition: { Ecliptic: { DecimalDegrees: number } } }): number => {
    const d = path.ChartPosition.Ecliptic.DecimalDegrees;
    return ((d % 360) + 360) % 360;
  };

  const sun = ecl(horoscope.CelestialBodies.sun!);
  const northNode = ecl(horoscope.CelestialPoints.northnode!);

  return {
    sun,
    earth: (sun + 180) % 360,
    moon: ecl(horoscope.CelestialBodies.moon!),
    northNode,
    southNode: (northNode + 180) % 360,
    mercury: ecl(horoscope.CelestialBodies.mercury!),
    venus: ecl(horoscope.CelestialBodies.venus!),
    mars: ecl(horoscope.CelestialBodies.mars!),
    jupiter: ecl(horoscope.CelestialBodies.jupiter!),
    saturn: ecl(horoscope.CelestialBodies.saturn!),
    uranus: ecl(horoscope.CelestialBodies.uranus!),
    neptune: ecl(horoscope.CelestialBodies.neptune!),
    pluto: ecl(horoscope.CelestialBodies.pluto!),
  };
}

/** Round-trip an ecliptic longitude through "shift by N degrees" and
 *  wrap into [0, 360). Used by the design-time solver. */
function shiftDeg(d: number, by: number): number {
  return ((d + by) % 360 + 360) % 360;
}

/** Smallest signed angular difference between two longitudes, in
 *  (-180, 180]. Positive = a is "ahead of" b. */
function angularDelta(a: number, b: number): number {
  let d = a - b;
  d = ((d + 180) % 360 + 360) % 360 - 180;
  return d;
}

/**
 * Find the datetime when the Sun's ecliptic longitude was 88° earlier
 * than its position at `birth`. This is the Human Design "Design" time
 * — the moment Ra Uru Hu's system uses to compute the unconscious
 * (red) side of the bodygraph.
 *
 * NOT 88 calendar days: the Sun's apparent speed varies seasonally
 * (faster near perihelion in January, slower at aphelion in July), so
 * 88° of solar arc translates to anywhere from ~87 to ~91 calendar
 * days. We binary-search bracketed at [birth - 92d, birth - 86d] for
 * the datetime where the Sun is exactly 88° earlier.
 *
 * Returns the UTC components of the design moment, ready to pass back
 * to `planetaryLongitudes`.
 */
export function solveDesignTime(
  birth: EphemerisInput,
  birthSunLongitude: number,
): EphemerisInput {
  const targetSun = shiftDeg(birthSunLongitude, -88);

  // Convert birth to a JS Date in UTC for arithmetic.
  const birthDate = new Date(
    Date.UTC(birth.year, birth.month - 1, birth.day, birth.hour, birth.minute),
  );

  const MS_PER_DAY = 86_400_000;

  // Bracket: 92 days before to 86 days before. Sun moves
  // monotonically forward in ecliptic over that window.
  let loT = birthDate.getTime() - 92 * MS_PER_DAY;
  let hiT = birthDate.getTime() - 86 * MS_PER_DAY;

  const sunAt = (t: number): number => {
    const dt = new Date(t);
    return planetaryLongitudes({
      year: dt.getUTCFullYear(),
      month: dt.getUTCMonth() + 1,
      day: dt.getUTCDate(),
      hour: dt.getUTCHours(),
      minute: dt.getUTCMinutes(),
      lat: birth.lat,
      lon: birth.lon,
    }).sun;
  };

  // Binary search on (lo, hi) — converge until Sun is within 0.001° of
  // target, or we've done 24 iterations (overkill — 7-8 suffice).
  for (let i = 0; i < 24; i++) {
    const midT = (loT + hiT) / 2;
    const midSun = sunAt(midT);
    const delta = angularDelta(midSun, targetSun);
    if (Math.abs(delta) < 0.001) {
      const dt = new Date(midT);
      return {
        year: dt.getUTCFullYear(),
        month: dt.getUTCMonth() + 1,
        day: dt.getUTCDate(),
        hour: dt.getUTCHours(),
        minute: dt.getUTCMinutes(),
        lat: birth.lat,
        lon: birth.lon,
      };
    }
    // Sun moves monotonically forward — if midSun > target, midT is too
    // late; bring hi down. Else lo up.
    if (delta > 0) hiT = midT;
    else loT = midT;
  }

  // Fell out of the loop — return the best-effort midpoint.
  const finalT = (loT + hiT) / 2;
  const dt = new Date(finalT);
  return {
    year: dt.getUTCFullYear(),
    month: dt.getUTCMonth() + 1,
    day: dt.getUTCDate(),
    hour: dt.getUTCHours(),
    minute: dt.getUTCMinutes(),
    lat: birth.lat,
    lon: birth.lon,
  };
}
