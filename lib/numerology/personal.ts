import { toZonedTime } from 'date-fns-tz';
import { makeResult, reducePreservingMasters } from './reduce';
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

/** Personal Month = reduce(PY.reduced + currentMonth). */
export function personalMonth(dob: BirthDate, ctx: PersonalContext): NumerologyResult {
  const py = personalYear(dob, ctx.year);
  return makeResult(py.reduced + ctx.month);
}

/** Personal Day = reduce(PM.reduced + currentDay). */
export function personalDay(dob: BirthDate, ctx: PersonalContext): NumerologyResult {
  const pm = personalMonth(dob, ctx);
  return makeResult(pm.reduced + ctx.day);
}

/** All three personal cycles for a given (year, month, day) in user's tz. */
export function personalCycles(dob: BirthDate, ctx: PersonalContext): PersonalCycles {
  const py = personalYear(dob, ctx.year);
  const pm = makeResult(py.reduced + ctx.month);
  const pd = makeResult(pm.reduced + ctx.day);
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
