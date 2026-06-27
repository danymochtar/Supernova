/**
 * Static mapping of the 9 Human Design centers to their gates, plus the
 * subset of "motor" centers (Sacral / Solar Plexus / Heart / Root) whose
 * connection to the Throat determines Manifestor vs Manifesting Generator
 * vs Generator vs Projector typing.
 *
 * The center-to-gate mapping is canonical per the Jovian Archive. A few
 * gates legitimately belong to two centers — 5 and 14 reach the Sacral
 * via channels but are anchored at the G center; we include them in both
 * lists since either center "claims" the gate for definition purposes
 * (in practice, the channel definition logic decides which centers light
 * up; the per-center gate list is just for UI tap-to-detail).
 */

import type { HDCenter } from './types';

/**
 * Canonical gates anchored at each center. Used for:
 *   - Listing "your active gates within this center" in detail modals.
 *   - Cross-checking the center-definition logic (a center is defined
 *     iff at least one of its channels is fully activated — see
 *     `channels.ts` for the channel list).
 */
export const CENTER_GATES: Record<HDCenter, readonly number[]> = {
  HEAD: [64, 61, 63],
  AJNA: [47, 24, 4, 17, 43, 11],
  THROAT: [62, 23, 56, 35, 12, 45, 33, 8, 31, 7, 1, 13, 20, 16, 62],
  G: [25, 46, 22, 36, 2, 15, 5, 14, 1, 7, 13, 10],
  HEART: [21, 40, 26, 51],
  SACRAL: [34, 5, 14, 29, 59, 9, 3, 42, 27],
  SOLAR_PLEXUS: [36, 22, 37, 6, 49, 55, 30],
  SPLEEN: [48, 57, 44, 50, 32, 28, 18],
  ROOT: [58, 38, 54, 53, 60, 52, 19, 39, 41],
} as const;

/** Motor centers — Sacral + Heart + Solar Plexus + Root. These can
 *  drive the Throat (the only manifesting center) into motor expression. */
export const MOTOR_CENTERS: readonly HDCenter[] = [
  'SACRAL',
  'HEART',
  'SOLAR_PLEXUS',
  'ROOT',
] as const;

export const THROAT_CENTER: HDCenter = 'THROAT';
export const SACRAL_CENTER: HDCenter = 'SACRAL';

/** Returns the (canonical) center this gate belongs to, or null if the
 *  gate number isn't valid. Used by chart compute when listing each
 *  center's *active* gates. Resolution priority for the 5 dual-anchor
 *  gates is: SACRAL > G (matches the Jovian bodygraph display). */
export function centerForGate(gate: number): HDCenter | null {
  // Manual priority order — SACRAL first to claim 5/14 from G.
  const order: HDCenter[] = [
    'SACRAL',
    'HEART',
    'SOLAR_PLEXUS',
    'ROOT',
    'SPLEEN',
    'G',
    'AJNA',
    'HEAD',
    'THROAT',
  ];
  for (const c of order) {
    if (CENTER_GATES[c].includes(gate)) return c;
  }
  return null;
}
