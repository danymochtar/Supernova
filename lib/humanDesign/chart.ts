/**
 * Top-level Human Design chart computation. Given a birth datetime +
 * lat/lon, returns a fully populated `HumanDesignChart` (see `types.ts`).
 *
 * Pipeline:
 *   1. Ephemeris at birth → 13 Personality activations (gate + line).
 *   2. Solve "design time" (88° solar arc earlier).
 *   3. Ephemeris at design time → 13 Design activations.
 *   4. Aggregate unique active gates across both sides.
 *   5. Walk the 36 canonical channels: a channel is defined iff BOTH
 *      its gates are active. Defined channels light up both end-centers.
 *   6. Type / Strategy / Authority / Profile / Definition / Incarnation
 *      Cross all fall out of the active-gate + defined-channel + defined-
 *      center state.
 *
 * All computation is pure (no I/O beyond the ephemeris) and runs in
 * ~10ms per chart on a typical laptop.
 */

import {
  planetaryLongitudes,
  solveDesignTime,
  type EphemerisInput,
  type PlanetaryLongitudes,
} from './ephemeris';
import { longitudeToGateLine } from './wheel';
import {
  MOTOR_CENTERS,
  SACRAL_CENTER,
  THROAT_CENTER,
  centerForGate,
} from './centers';
import { CHANNELS } from './channels';
import { resolveIncarnationCrossName } from './incarnationCrosses';
import type {
  GateLine,
  HDAuthority,
  HDCenter,
  HDDefinition,
  HDLine,
  HDPlanet,
  HDType,
  HumanDesignChart,
} from './types';
import { ALL_CENTERS, STRATEGY_FOR_TYPE } from './types';

export interface BirthInput {
  year: number;
  month: number; // 1-12
  day: number;
  /** Local birth time "HH:MM" (24h). */
  birthTime: string;
  /** IANA timezone of the local birth time (e.g. "Asia/Jakarta"). */
  timezone: string;
  /** Precise birth lat (north positive). */
  lat: number;
  /** Precise birth lon (east positive). */
  lon: number;
}

/** Convert (local date, local time, IANA tz) → UTC components.
 *
 *  Uses `Intl.DateTimeFormat` with the IANA tz to find the local-time
 *  offset, then subtracts. This is the same trick `lib/timezones.ts`
 *  uses elsewhere. Returns null if the time string is malformed.
 */
function localToUtc(input: BirthInput): EphemerisInput | null {
  const m = input.birthTime.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (!Number.isFinite(hh) || hh < 0 || hh > 23) return null;
  if (!Number.isFinite(mm) || mm < 0 || mm > 59) return null;

  // The local moment as if it were UTC (so we can ask DateTimeFormat
  // what the offset is for that wall-clock time in the IANA tz).
  const naiveUtc = Date.UTC(input.year, input.month - 1, input.day, hh, mm);

  // Use Intl.DateTimeFormat to get the IANA offset for that wall time.
  // We format the naive moment in the target timezone, then compare to
  // the same wall time in UTC.
  let offsetMs = 0;
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: input.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = dtf.formatToParts(new Date(naiveUtc));
    const get = (t: string) => parts.find((p) => p.type === t)?.value;
    const y = Number(get('year'));
    const mo = Number(get('month'));
    const d = Number(get('day'));
    let h = Number(get('hour'));
    const mi = Number(get('minute'));
    if (h === 24) h = 0; // some locales emit "24:00"
    const tzAsUtc = Date.UTC(y, mo - 1, d, h, mi);
    offsetMs = naiveUtc - tzAsUtc;
  } catch {
    offsetMs = 0;
  }

  const utcMoment = new Date(naiveUtc + offsetMs);
  return {
    year: utcMoment.getUTCFullYear(),
    month: utcMoment.getUTCMonth() + 1,
    day: utcMoment.getUTCDate(),
    hour: utcMoment.getUTCHours(),
    minute: utcMoment.getUTCMinutes(),
    lat: input.lat,
    lon: input.lon,
  };
}

const PLANET_ORDER: readonly HDPlanet[] = [
  'sun',
  'earth',
  'moon',
  'northNode',
  'southNode',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
];

function activationsFrom(lons: PlanetaryLongitudes): Record<HDPlanet, GateLine> {
  const out = {} as Record<HDPlanet, GateLine>;
  for (const p of PLANET_ORDER) {
    out[p] = longitudeToGateLine(lons[p]);
  }
  return out;
}

/** Compute defined channels + which gates from each are active. */
function deriveChannelsAndCenters(activeGates: Set<number>): {
  definedChannels: number[];
  centers: Record<HDCenter, { defined: boolean; gates: number[] }>;
} {
  const definedChannels: number[] = [];
  const definedCenters = new Set<HDCenter>();
  for (let i = 0; i < CHANNELS.length; i++) {
    const ch = CHANNELS[i]!;
    if (activeGates.has(ch.gates[0]) && activeGates.has(ch.gates[1])) {
      definedChannels.push(i);
      definedCenters.add(ch.centers[0]);
      definedCenters.add(ch.centers[1]);
    }
  }

  // For UI: per-center, list the user's *active* gates that anchor at
  // that center. (Note this is independent of whether the center itself
  // is defined — a center may have a single hanging gate active.)
  const centers = {} as Record<HDCenter, { defined: boolean; gates: number[] }>;
  for (const c of ALL_CENTERS) {
    const seen = new Set<number>();
    for (const g of activeGates) {
      if (centerForGate(g) === c) seen.add(g);
    }
    centers[c] = { defined: definedCenters.has(c), gates: [...seen].sort((a, b) => a - b) };
  }
  return { definedChannels, centers };
}

function deriveType(centers: Record<HDCenter, { defined: boolean }>): HDType {
  const sacralDefined = centers[SACRAL_CENTER].defined;
  // A Throat motor connection = at least one defined channel whose two
  // centers are { Throat, motor } where motor ∈ {Sacral, Heart, Solar
  // Plexus, Root}. We check via the channel list to be safe — there's
  // no Root-Throat direct channel, but the rule reads more cleanly
  // expressed as "is there any channel from Throat to a motor center
  // whose centers are both defined?"
  let throatMotorConnected = false;
  for (const ch of CHANNELS) {
    const [c1, c2] = ch.centers;
    const involvesThroat = c1 === THROAT_CENTER || c2 === THROAT_CENTER;
    if (!involvesThroat) continue;
    const other = c1 === THROAT_CENTER ? c2 : c1;
    if (!(MOTOR_CENTERS as readonly HDCenter[]).includes(other)) continue;
    if (!centers[c1].defined || !centers[c2].defined) continue;
    throatMotorConnected = true;
    break;
  }

  const anyDefined = ALL_CENTERS.some((c) => centers[c].defined);

  if (sacralDefined && throatMotorConnected) return 'MANIFESTING_GENERATOR';
  if (sacralDefined && !throatMotorConnected) return 'GENERATOR';
  if (!sacralDefined && throatMotorConnected) return 'MANIFESTOR';
  if (!sacralDefined && !throatMotorConnected && anyDefined) return 'PROJECTOR';
  return 'REFLECTOR';
}

function deriveAuthority(
  type: HDType,
  centers: Record<HDCenter, { defined: boolean }>,
): HDAuthority {
  if (type === 'REFLECTOR') return 'LUNAR';
  if (centers.SOLAR_PLEXUS.defined) return 'EMOTIONAL';
  if (centers.SACRAL.defined) return 'SACRAL';
  if (centers.SPLEEN.defined) return 'SPLENIC';
  if (centers.HEART.defined) return 'EGO';
  if (centers.G.defined) return 'SELF_PROJECTED';
  // Mental Authority — Ajna / Throat / Head with no gut authority above.
  // (Projector-specific case.)
  if (centers.AJNA.defined || centers.THROAT.defined || centers.HEAD.defined) return 'MENTAL';
  return 'NONE';
}

function deriveDefinition(
  activeGates: Set<number>,
  centers: Record<HDCenter, { defined: boolean }>,
): HDDefinition {
  // Union-find over the set of defined centers, joined by defined channels.
  const definedCenters = ALL_CENTERS.filter((c) => centers[c].defined);
  if (definedCenters.length === 0) return 'NONE';

  const parent = new Map<HDCenter, HDCenter>();
  const find = (c: HDCenter): HDCenter => {
    const p = parent.get(c)!;
    if (p === c) return c;
    const root = find(p);
    parent.set(c, root);
    return root;
  };
  const union = (a: HDCenter, b: HDCenter) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };

  for (const c of definedCenters) parent.set(c, c);

  for (const ch of CHANNELS) {
    const both =
      activeGates.has(ch.gates[0]) &&
      activeGates.has(ch.gates[1]) &&
      centers[ch.centers[0]].defined &&
      centers[ch.centers[1]].defined;
    if (both) union(ch.centers[0], ch.centers[1]);
  }

  const components = new Set<HDCenter>();
  for (const c of definedCenters) components.add(find(c));

  switch (components.size) {
    case 1:
      return 'SINGLE';
    case 2:
      return 'SPLIT';
    case 3:
      return 'TRIPLE_SPLIT';
    case 4:
      return 'QUAD_SPLIT';
    default:
      // 5+ defined components is theoretically possible but extremely
      // rare; bucket into QUAD_SPLIT for v1.
      return 'QUAD_SPLIT';
  }
}

function deriveIncarnationCross(
  personality: Record<HDPlanet, GateLine>,
  design: Record<HDPlanet, GateLine>,
): HumanDesignChart['incarnationCross'] {
  const pSun = personality.sun;
  const pEarth = personality.earth;
  const dSun = design.sun;
  const dEarth = design.earth;
  // The angle: Right Angle when personality sun line is 1-3, Left Angle
  // when 4-6, Juxtaposition when both personality sun + design sun are
  // line 4 — a single-gate fixed line that's its own category. Simplified
  // rule per Ra: Right (lines 1-3), Left (lines 4-6), Juxtaposition is
  // identified by the (PSun, DSun) line pair, but for v1 we use the
  // bucket Right/Left as the dominant convention.
  let angle: 'RIGHT' | 'LEFT' | 'JUXTAPOSITION';
  if (pSun.line >= 1 && pSun.line <= 3) angle = 'RIGHT';
  else if (pSun.line === 4 && dSun.line === 4) angle = 'JUXTAPOSITION';
  else angle = 'LEFT';

  const gates: [number, number, number, number] = [pSun.gate, pEarth.gate, dSun.gate, dEarth.gate];
  const name = resolveIncarnationCrossName(gates, angle);
  return { gates, angle, name };
}

/** Main entry. */
export function computeHumanDesign(birth: BirthInput): HumanDesignChart | null {
  const utc = localToUtc(birth);
  if (!utc) return null;

  let personalityLongitudes: PlanetaryLongitudes;
  try {
    personalityLongitudes = planetaryLongitudes(utc);
  } catch {
    return null;
  }

  let designUtc: EphemerisInput;
  let designLongitudes: PlanetaryLongitudes;
  try {
    designUtc = solveDesignTime(utc, personalityLongitudes.sun);
    designLongitudes = planetaryLongitudes(designUtc);
  } catch {
    return null;
  }

  const personality = activationsFrom(personalityLongitudes);
  const design = activationsFrom(designLongitudes);

  const activeGateSet = new Set<number>();
  for (const p of PLANET_ORDER) {
    activeGateSet.add(personality[p].gate);
    activeGateSet.add(design[p].gate);
  }
  const activeGates = [...activeGateSet].sort((a, b) => a - b);

  const { definedChannels, centers } = deriveChannelsAndCenters(activeGateSet);
  const type = deriveType(centers);
  const strategy = STRATEGY_FOR_TYPE[type];
  const authority = deriveAuthority(type, centers);
  const profile = {
    conscious: personality.sun.line as HDLine,
    unconscious: design.sun.line as HDLine,
  };
  const definition = deriveDefinition(activeGateSet, centers);
  const incarnationCross = deriveIncarnationCross(personality, design);

  return {
    type,
    strategy,
    authority,
    profile,
    definition,
    incarnationCross,
    activations: { personality, design },
    activeGates,
    definedChannels,
    centers,
  };
}
