import { birthday, expression, lifePath, personality, soulUrge } from './core';
import { challenges, periodCycles, pinnacles } from './cycles';
import { karmicLessons } from './karmic';
import type { BirthDate, CoreProfile } from './types';

/** Build the full static numerology profile from a name + DOB. */
export function buildCoreProfile(fullName: string, dob: BirthDate): CoreProfile {
  return {
    lifePath: lifePath(dob),
    expression: expression(fullName),
    soulUrge: soulUrge(fullName),
    personality: personality(fullName),
    birthday: birthday(dob),
    karmicLessons: karmicLessons(fullName),
    pinnacles: pinnacles(dob),
    challenges: challenges(dob),
    periodCycles: periodCycles(dob),
  };
}
