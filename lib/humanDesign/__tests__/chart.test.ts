import { describe, expect, it } from 'vitest';
import { computeHumanDesign, type BirthInput } from '../chart';

/**
 * Fixture: Ra Uru Hu — the founder of Human Design — born April 9 1948
 * at 07:31 in Vienna, Austria. His chart is canonically published:
 *
 *   Type:            Manifestor
 *   Strategy:        Inform
 *   Authority:       Splenic
 *   Profile:         5/1
 *   Incarnation Cross: Left Angle Cross of the Clarion
 *                      (Gates 51 / 57 / 61 / 62)
 *
 * Matching this fixture validates: the ephemeris wrapper, the wheel
 * offset, the type/authority derivation, the design-time solver, and
 * the profile lookup. If this test ever breaks, the most likely culprit
 * is `WHEEL_OFFSET_DEG` or a wheel order regression.
 */
const RA_URU_HU: BirthInput = {
  year: 1948,
  month: 4,
  day: 9,
  birthTime: '07:31',
  timezone: 'Europe/Vienna',
  lat: 48.21,
  lon: 16.37,
};

describe('computeHumanDesign — Ra Uru Hu canonical chart', () => {
  const chart = computeHumanDesign(RA_URU_HU);

  it('chart is not null', () => {
    expect(chart).not.toBeNull();
  });

  it('Type is Manifestor', () => {
    expect(chart!.type).toBe('MANIFESTOR');
  });

  it('Strategy is Inform', () => {
    expect(chart!.strategy).toBe('INFORM');
  });

  it('Authority is Splenic', () => {
    expect(chart!.authority).toBe('SPLENIC');
  });

  it('Profile is 5/1', () => {
    expect(chart!.profile.conscious).toBe(5);
    expect(chart!.profile.unconscious).toBe(1);
  });

  it('Incarnation Cross gates are 51 / 57 / 61 / 62 in some order', () => {
    const expected = new Set([51, 57, 61, 62]);
    const actual = new Set(chart!.incarnationCross.gates);
    expect(actual).toEqual(expected);
  });
});

describe('computeHumanDesign — input validation', () => {
  const BAD: BirthInput = {
    year: 1990,
    month: 1,
    day: 1,
    birthTime: 'noon', // intentionally malformed
    timezone: 'UTC',
    lat: 0,
    lon: 0,
  };

  it('returns null on a malformed birthTime', () => {
    expect(computeHumanDesign(BAD)).toBeNull();
  });

  it('returns null on out-of-range hours', () => {
    expect(computeHumanDesign({ ...BAD, birthTime: '25:00' })).toBeNull();
  });
});

describe('computeHumanDesign — shape invariants', () => {
  const chart = computeHumanDesign(RA_URU_HU)!;

  it('exactly 13 personality + 13 design activations', () => {
    expect(Object.keys(chart.activations.personality)).toHaveLength(13);
    expect(Object.keys(chart.activations.design)).toHaveLength(13);
  });

  it('Personality Earth is wheel-opposite Personality Sun (180° on gate wheel)', () => {
    // Earth is 180° opposite Sun on the ecliptic — the wheel mapping
    // should reflect this as a specific gate pair. We don't pin the
    // specific opposite-gate value here (depends on WHEEL order) but
    // verify the two gates aren't equal.
    expect(chart.activations.personality.earth.gate).not.toBe(chart.activations.personality.sun.gate);
  });

  it('activeGates is sorted, unique, all 1-64', () => {
    const gs = chart.activeGates;
    for (let i = 1; i < gs.length; i++) expect(gs[i]!).toBeGreaterThan(gs[i - 1]!);
    for (const g of gs) {
      expect(g).toBeGreaterThanOrEqual(1);
      expect(g).toBeLessThanOrEqual(64);
    }
  });

  it('definition is one of the known buckets', () => {
    expect(['SINGLE', 'SPLIT', 'TRIPLE_SPLIT', 'QUAD_SPLIT', 'NONE']).toContain(chart.definition);
  });

  it('every center has a boolean defined + a gate list', () => {
    for (const k of [
      'HEAD',
      'AJNA',
      'THROAT',
      'G',
      'HEART',
      'SACRAL',
      'SOLAR_PLEXUS',
      'SPLEEN',
      'ROOT',
    ] as const) {
      expect(typeof chart.centers[k].defined).toBe('boolean');
      expect(Array.isArray(chart.centers[k].gates)).toBe(true);
    }
  });
});
