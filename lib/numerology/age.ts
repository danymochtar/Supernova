import type { BirthDate } from './types';
import type { PersonalContext } from './personal';

/** Whole-year age at the given local date in the user's timezone. */
export function ageAt(dob: BirthDate, ctx: PersonalContext): number {
  let age = ctx.year - dob.year;
  const beforeBirthday =
    ctx.month < dob.month || (ctx.month === dob.month && ctx.day < dob.day);
  if (beforeBirthday) age -= 1;
  return Math.max(0, age);
}
