/**
 * The Human Design wheel — pure math converting ecliptic longitude
 * (0-360°) to a gate (1-64) and line (1-6).
 *
 * REFERENCE — Jovian Archive canonical convention:
 * The wheel anchor is Gate 41, Line 1 starting at 1°50' Aquarius (which
 * corresponds to ecliptic longitude 301.833°, where 0° Aries = 0°). This
 * is the date Sun "enters Gate 41" — January 22 in the tropical zodiac.
 * Each gate spans exactly 360°/64 = 5.625°; each line within a gate spans
 * 5.625°/6 = 0.9375°.
 *
 * As the Sun's ecliptic longitude advances through the zodiac (forward
 * direction: Aries → Taurus → … → Pisces → Aries), it advances through
 * the gate sequence below in array order: Gate 41 → 19 → 13 → 49 → 30
 * → 55 → … (the published HD "wheel of the mandala" order).
 */

import type { GateLine, HDLine } from './types';

/**
 * The 64 I Ching gates in the order they appear on the HD wheel,
 * starting at the wheel anchor (Gate 41 at 1°50' Aquarius) and going
 * forward through the zodiac.
 *
 * This list is canonical — verified against the Jovian Archive
 * bodygraph software's published wheel. DO NOT reorder without
 * re-running the cusp + fixture tests in `__tests__/wheel.test.ts`.
 */
export const WHEEL: readonly number[] = [
  41, 19, 13, 49, 30, 55, 37, 63, 22, 36,
  25, 17, 21, 51, 42, 3, 27, 24, 2, 23,
  8, 20, 16, 35, 45, 12, 15, 52, 39, 53,
  62, 56, 31, 33, 7, 4, 29, 59, 40, 64,
  47, 6, 46, 18, 48, 57, 32, 50, 28, 44,
  1, 43, 14, 34, 9, 5, 26, 11, 10, 58,
  38, 54, 61, 60,
];

/** Ecliptic degree where the wheel begins — Gate 41 Line 1. */
export const WHEEL_OFFSET_DEG = 301.833;

/** 360° / 64 gates. */
export const GATE_ARC = 360 / 64;

/** GATE_ARC / 6 lines. */
export const LINE_ARC = GATE_ARC / 6;

/**
 * Convert an ecliptic longitude (in degrees, 0-360) to a gate + line.
 *
 * The math:
 *   1. Shift the longitude so the wheel anchor (Gate 41) is at 0.
 *   2. Modulo 360 to handle the wrap.
 *   3. Floor-divide by 5.625° to find the gate index (0-63).
 *   4. Modulo 5.625° to find the position within the gate.
 *   5. Floor-divide by 0.9375° to find the line (0-5), +1 for 1-6 range.
 *
 * Examples:
 *   longitudeToGateLine(301.833) → { gate: 41, line: 1 }   (wheel start)
 *   longitudeToGateLine(307.458) → { gate: 19, line: 1 }   (one gate later)
 *   longitudeToGateLine(0)       → { gate: 17, line: ? }   (around mid-Mar)
 */
export function longitudeToGateLine(deg: number): GateLine {
  if (!Number.isFinite(deg)) {
    throw new Error(`longitudeToGateLine: non-finite input ${deg}`);
  }
  // Two mods to normalize any input (including negatives) into [0, 360).
  const wrapped = ((deg % 360) + 360) % 360;
  const shifted = ((wrapped - WHEEL_OFFSET_DEG) % 360 + 360) % 360;
  const gateIndex = Math.floor(shifted / GATE_ARC);
  // Defensive clamp — only triggers at the 360° boundary due to FP.
  const safeIndex = gateIndex >= WHEEL.length ? WHEEL.length - 1 : gateIndex;
  const within = shifted - safeIndex * GATE_ARC;
  const rawLine = Math.floor(within / LINE_ARC) + 1;
  const line = (rawLine > 6 ? 6 : rawLine) as HDLine;
  return { gate: WHEEL[safeIndex]!, line };
}

/** Inverse helper for tests: take a (gate, line) and return the START
 *  ecliptic longitude of that line. Useful for asserting cusp boundaries. */
export function gateLineStartDeg(gate: number, line: HDLine): number {
  const idx = WHEEL.indexOf(gate);
  if (idx < 0) throw new Error(`Unknown gate: ${gate}`);
  const startShifted = idx * GATE_ARC + (line - 1) * LINE_ARC;
  return (startShifted + WHEEL_OFFSET_DEG) % 360;
}
