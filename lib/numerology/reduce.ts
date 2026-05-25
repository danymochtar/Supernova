import type { NumerologyResult } from './types';

const KARMIC_DEBTS = new Set([13, 14, 16, 19]);
const MASTERS = new Set([11, 22, 33]);

function digitSum(n: number): number {
  let s = 0;
  let x = Math.abs(n);
  while (x > 0) {
    s += x % 10;
    x = Math.floor(x / 10);
  }
  return s;
}

/**
 * Reduce a number to a single digit, preserving master numbers (11, 22, 33)
 * at any step they appear as a sum.
 */
export function reducePreservingMasters(n: number): number {
  let current = Math.abs(n);
  if (MASTERS.has(current) || current < 10) return current;
  while (current >= 10 && !MASTERS.has(current)) {
    current = digitSum(current);
  }
  return current;
}

/**
 * Reduce all the way to a single digit 1–9, WITHOUT preserving masters.
 * Used for the temporal personal cycles (Personal Year/Month/Day), which
 * World Numerology / Decoz always reduce to a single digit — master numbers
 * live in the core chart, not in these cycles. (e.g. a Personal Month that
 * sums to 11 is a "2 month", not an "11 month".)
 */
export function reduceToDigit(n: number): number {
  let current = Math.abs(n);
  while (current >= 10) {
    current = digitSum(current);
  }
  return current;
}

/** Build a NumerologyResult from a compound, applying master + karmic-debt detection. */
export function makeResult(compound: number): NumerologyResult {
  const reduced = reducePreservingMasters(compound);
  const isMaster = MASTERS.has(reduced);
  const result: NumerologyResult = { compound, reduced, isMaster };
  if (KARMIC_DEBTS.has(compound)) {
    result.karmicDebt = compound as 13 | 14 | 16 | 19;
  }
  return result;
}

/**
 * Like {@link makeResult} but for the personal cycles: master sums (11/22/33)
 * reduce to a single digit (2/4/6) rather than being preserved, matching
 * World Numerology's daily/monthly forecasts. Karmic-debt compounds
 * (13/14/16/19) are still flagged.
 */
export function makeCycleResult(compound: number): NumerologyResult {
  const result: NumerologyResult = {
    compound,
    reduced: reduceToDigit(compound),
    isMaster: false,
  };
  if (KARMIC_DEBTS.has(compound)) {
    result.karmicDebt = compound as 13 | 14 | 16 | 19;
  }
  return result;
}
