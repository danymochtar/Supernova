import { toZonedTime } from 'date-fns-tz';
import { makeCycleResult, makeResult, reducePreservingMasters, reduceToDigit } from './reduce';
import type { BirthDate, NumerologyResult, PersonalCycles } from './types';

export interface PersonalContext {
  /** Calendar year in user's timezone (e.g. 2026). */
  year: number;
  /** Calendar month in user's timezone, 1–12. */
  month: number;
  /** Calendar day-of-month in user's timezone, 1–31. */
  day: number;
}

/**
 * Personal Year = reduce(reducedBirthMonth + reducedBirthDay + reducedCurrentYear).
 * Calendar-year convention: PY rolls over on Jan 1 in the user's timezone.
 */
export function personalYear(dob: BirthDate, currentYear: number): NumerologyResult {
  const m = reducePreservingMasters(dob.month);
  const d = reducePreservingMasters(dob.day);
  const y = reducePreservingMasters(currentYear);
  return makeResult(m + d + y);
}

/**
 * Birthday-anchored Personal Year (Decoz / Millman / World Numerology).
 *
 * PY rolls over on the user's birthday — not Jan 1. Before the birthday in
 * the current calendar year, the user is still in the cycle that started
 * on their LAST birthday (so we use last year's number). On/after the
 * birthday, we use this year's.
 *
 * For someone born 17 May 1995 looking at 4 May 2026 (13 days pre-birthday):
 *   year-of-cycle-start = 2025
 *   PY = 5 + 8 + 9 = 22 → 4
 *
 * Use this when surfacing "what year of life am I in" — it tracks the
 * user's lived rhythm. Use the calendar variant when the question is
 * "what's the energy of calendar 2026 for me".
 */
export function personalYearBirthdayAnchored(
  dob: BirthDate,
  ctx: PersonalContext,
): NumerologyResult {
  const beforeBirthday =
    ctx.month < dob.month || (ctx.month === dob.month && ctx.day < dob.day);
  const cycleStartYear = beforeBirthday ? ctx.year - 1 : ctx.year;
  return personalYear(dob, cycleStartYear);
}

/**
 * Personal Month = reduceToDigit(PY-as-single-digit + currentMonth).
 *
 * Reduced to a single digit (masters NOT preserved) to match World
 * Numerology: a month summing to 11 is a "2 month", not an "11 month". The
 * Personal Year feeds in as a single digit so the cascade stays 1–9.
 */
export function personalMonth(dob: BirthDate, ctx: PersonalContext): NumerologyResult {
  const py = personalYear(dob, ctx.year);
  return makeCycleResult(reduceToDigit(py.reduced) + ctx.month);
}

/** Personal Day = reduceToDigit(PM-single-digit + currentDay). Single-digit. */
export function personalDay(dob: BirthDate, ctx: PersonalContext): NumerologyResult {
  const pm = personalMonth(dob, ctx);
  return makeCycleResult(pm.reduced + ctx.day);
}

/** All three personal cycles for a given (year, month, day) in user's tz. */
export function personalCycles(dob: BirthDate, ctx: PersonalContext): PersonalCycles {
  const py = personalYear(dob, ctx.year);
  const pm = makeCycleResult(reduceToDigit(py.reduced) + ctx.month);
  const pd = makeCycleResult(pm.reduced + ctx.day);
  return { personalYear: py, personalMonth: pm, personalDay: pd };
}

/**
 * Convert a UTC instant + IANA timezone (e.g. "Asia/Jakarta") into the user's
 * local calendar year/month/day. Use this at the request boundary, then pass
 * the resulting PersonalContext into the pure functions above.
 */
export function contextFromInstant(now: Date, timezone: string): PersonalContext {
  const local = toZonedTime(now, timezone);
  return {
    year: local.getFullYear(),
    month: local.getMonth() + 1,
    day: local.getDate(),
  };
}
