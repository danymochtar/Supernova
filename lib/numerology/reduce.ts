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
