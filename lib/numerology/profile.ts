import { balanceNumber } from './balance';
import { cornerstone } from './cornerstone';
import { birthday, expression, lifePath, personality, soulUrge } from './core';
import { challenges, periodCycles, pinnacles } from './cycles';
import { hiddenPassion } from './hiddenPassion';
import { karmicLessons } from './karmic';
import { maturityNumber } from './maturity';
import { planesOfExpression } from './planesOfExpression';
import { rationalThought } from './rationalThought';
import { subconsciousSelf } from './subconsciousSelf';
import type { BirthDate, CoreProfile } from './types';

/** Build the full static numerology profile from a name + DOB. */
export function buildCoreProfile(fullName: string, dob: BirthDate): CoreProfile {
  const lp = lifePath(dob);
  const ex = expression(fullName);
  return {
    lifePath: lp,
    expression: ex,
    soulUrge: soulUrge(fullName),
    personality: personality(fullName),
    birthday: birthday(dob),
    karmicLessons: karmicLessons(fullName),
    pinnacles: pinnacles(dob),
    challenges: challenges(dob),
    periodCycles: periodCycles(dob),
    maturity: maturityNumber(lp, ex),
    hiddenPassion: hiddenPassion(fullName),
    balance: balanceNumber(fullName),
    cornerstone: cornerstone(fullName),
    subconsciousSelf: subconsciousSelf(fullName),
    rationalThought: rationalThought(fullName, dob),
    planes: planesOfExpression(fullName),
  };
}
