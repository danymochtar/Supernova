/**
 * TypeScript type unions for the Human Design module. These mirror the
 * Prisma enums declared in `prisma/schema.prisma` for the Profile model;
 * the string values match the Prisma enum members so a runtime cast is
 * safe (`hdType as HDType`).
 */

export type HDType =
  | 'GENERATOR'
  | 'MANIFESTING_GENERATOR'
  | 'MANIFESTOR'
  | 'PROJECTOR'
  | 'REFLECTOR';

export type HDStrategy = 'RESPOND' | 'INFORM' | 'WAIT_INVITATION' | 'WAIT_LUNAR';

export type HDAuthority =
  | 'EMOTIONAL'
  | 'SACRAL'
  | 'SPLENIC'
  | 'EGO'
  | 'SELF_PROJECTED'
  | 'MENTAL'
  | 'LUNAR'
  | 'NONE';

export type HDDefinition = 'SINGLE' | 'SPLIT' | 'TRIPLE_SPLIT' | 'QUAD_SPLIT' | 'NONE';

export type HDLine = 1 | 2 | 3 | 4 | 5 | 6;

export type HDCenter =
  | 'HEAD'
  | 'AJNA'
  | 'THROAT'
  | 'G'
  | 'HEART'
  | 'SACRAL'
  | 'SOLAR_PLEXUS'
  | 'SPLEEN'
  | 'ROOT';

/** 13 planetary activations carried per side (Personality + Design). */
export type HDPlanet =
  | 'sun'
  | 'earth'
  | 'moon'
  | 'northNode'
  | 'southNode'
  | 'mercury'
  | 'venus'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'
  | 'pluto';

export interface GateLine {
  gate: number;
  line: HDLine;
}

/** What strategy maps to each Type. Deterministic — no overrides. */
export const STRATEGY_FOR_TYPE: Record<HDType, HDStrategy> = {
  GENERATOR: 'RESPOND',
  MANIFESTING_GENERATOR: 'RESPOND',
  MANIFESTOR: 'INFORM',
  PROJECTOR: 'WAIT_INVITATION',
  REFLECTOR: 'WAIT_LUNAR',
};

/** Canonical center order — used for stable iteration / serialization. */
export const ALL_CENTERS: readonly HDCenter[] = [
  'HEAD',
  'AJNA',
  'THROAT',
  'G',
  'HEART',
  'SACRAL',
  'SOLAR_PLEXUS',
  'SPLEEN',
  'ROOT',
] as const;

export interface HDIncarnationCross {
  /** Resolved name (e.g., "Right Angle Cross of the Sphinx"). `null` when
   *  the gate-quartet doesn't match a known entry — caller can fall back
   *  to displaying `gates` directly. */
  name: string | null;
  /** [PSun, PEarth, DSun, DEarth]. */
  gates: [number, number, number, number];
  angle: 'RIGHT' | 'LEFT' | 'JUXTAPOSITION';
}

/** Full HD chart — what `computeHumanDesign(birth)` returns, what we
 *  cache to `Profile.hdChart` JSON, and what the UI reads from. */
export interface HumanDesignChart {
  type: HDType;
  strategy: HDStrategy;
  authority: HDAuthority;
  profile: { conscious: HDLine; unconscious: HDLine };
  definition: HDDefinition;
  incarnationCross: HDIncarnationCross;
  activations: {
    personality: Record<HDPlanet, GateLine>;
    design: Record<HDPlanet, GateLine>;
  };
  activeGates: number[];
  definedChannels: number[];
  centers: Record<HDCenter, { defined: boolean; gates: number[] }>;
}
