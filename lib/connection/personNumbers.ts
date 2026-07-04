/**
 * Compute a person's connection-relevant numbers. WRAPS the existing
 * `lifePath` + `soulUrge` in `lib/numerology/core.ts` (per Ground Rule
 * 1 — never modify the existing engine). Adds three details the
 * connection feature needs that the base engine doesn't expose:
 *
 *   - dayComponent / monthComponent / yearComponent (individual
 *     reductions before summing).
 *   - preReductionSum (the raw sum of those three before final
 *     reduction) — needed for karmic-debt detection when the sum
 *     itself lands on 13/14/16/19.
 *   - karmicDebt detection from the calendar birth day (13/14/16/19
 *     without reduction).
 */

import { lifePath, soulUrge } from '@/lib/numerology/core';
import { reducePreservingMasters } from '@/lib/numerology/reduce';
import type { BirthDate } from '@/lib/numerology/types';
import type { KarmicDebtNumber, PersonKarmicDebt, PersonNumbers } from './types';

const KARMIC_DEBT_NUMBERS: readonly KarmicDebtNumber[] = [13, 14, 16, 19] as const;

function asKarmicDebt(n: number): KarmicDebtNumber | null {
  return (KARMIC_DEBT_NUMBERS as readonly number[]).includes(n)
    ? (n as KarmicDebtNumber)
    : null;
}

/**
 * Build a `PersonNumbers` fingerprint for the connection engine.
 *
 * @param dob The birth date. Required.
 * @param fullName The person's full name. Optional — when absent, Soul
 *   Urge is null and downstream soul-urge signals will not fire (the
 *   plan's "LP-only reading" mode).
 */
export function personNumbers(dob: BirthDate, fullName?: string | null): PersonNumbers {
  const dayComponent = reducePreservingMasters(dob.day);
  const monthComponent = reducePreservingMasters(dob.month);
  const yearComponent = reducePreservingMasters(dob.year);
  const preReductionSum = dayComponent + monthComponent + yearComponent;

  // Reuse the existing lifePath — matches this algorithm exactly, so
  // .reduced is the same value we'd compute inline.
  const lp = lifePath(dob);

  // Karmic debt: calendar birth day wins over preReductionSum when both
  // apply (birth day is the more embodied signal). Plan §1.3 lists
  // both sources without a priority; we pick birth-day for consistency.
  const birthDayDebt = asKarmicDebt(dob.day);
  const sumDebt = asKarmicDebt(preReductionSum);
  const karmicDebt: PersonKarmicDebt | null = birthDayDebt
    ? { number: birthDayDebt, source: 'birthDay' }
    : sumDebt
      ? { number: sumDebt, source: 'preReductionSum' }
      : null;

  const isMasterDay = dob.day === 11 || dob.day === 22;

  // Soul Urge is optional (name may be missing).
  const trimmedName = fullName?.trim();
  let soulUrgeValue: number | null = null;
  let isSoulUrgeMaster = false;
  if (trimmedName) {
    const su = soulUrge(trimmedName);
    soulUrgeValue = su.reduced;
    isSoulUrgeMaster = su.isMaster;
  }

  return {
    lifePath: lp.reduced,
    dayComponent,
    monthComponent,
    yearComponent,
    preReductionSum,
    birthDay: dob.day,
    birthMonth: dob.month,
    karmicDebt,
    isMasterDay,
    soulUrge: soulUrgeValue,
    isSoulUrgeMaster,
  };
}
