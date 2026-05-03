import { lifePath } from './core';
import { makeResult, reducePreservingMasters } from './reduce';
import type {
  BirthDate,
  ChallengeSet,
  NumerologyResult,
  PeriodCycleSet,
  PinnacleSet,
} from './types';

/** Reduce a number to a single non-master digit (challenges convention). */
function reduceToSingleDigit(n: number): number {
  let x = Math.abs(n);
  while (x >= 10) {
    let s = 0;
    while (x > 0) {
      s += x % 10;
      x = Math.floor(x / 10);
    }
    x = s;
  }
  return x;
}

/**
 * Pinnacles (Hans Decoz). Each pinnacle's compound is the sum of two reduced
 * components, then reduced. Master numbers preserved.
 *
 * Age boundaries: 1st ends at age (36 − reducedLifePath), min 27. Master Life
 * Paths use their reduced single-digit form for this math (11 → 2, 22 → 4).
 * 2nd and 3rd each span 9 years; 4th runs to end of life.
 */
export function pinnacles(dob: BirthDate): PinnacleSet {
  const m = reducePreservingMasters(dob.month);
  const d = reducePreservingMasters(dob.day);
  const y = reducePreservingMasters(dob.year);
  const lp = lifePath(dob);

  const first = makeResult(m + d);
  const second = makeResult(d + y);
  const third = makeResult(first.reduced + second.reduced);
  const fourth = makeResult(m + y);

  // Master-aware: use the single-digit form for the boundary math
  const lpSingle = reduceToSingleDigit(lp.reduced);
  const firstEnd = Math.max(27, 36 - lpSingle);

  return {
    first,
    second,
    third,
    fourth,
    ageBoundaries: [firstEnd, firstEnd + 9, firstEnd + 18],
  };
}

/**
 * Challenges. Always single digits — masters NOT preserved at the m/d/y
 * reduction step, since challenges represent a "lack" expressed as 0–8.
 */
export function challenges(dob: BirthDate): ChallengeSet {
  const m = reduceToSingleDigit(dob.month);
  const d = reduceToSingleDigit(dob.day);
  const y = reduceToSingleDigit(dob.year);

  const first = makeResult(Math.abs(m - d));
  const second = makeResult(Math.abs(d - y));
  const third = makeResult(Math.abs(first.reduced - second.reduced));
  const fourth = makeResult(Math.abs(m - y));

  return { first, second, third, fourth };
}

/**
 * Period Cycles (Hans Decoz). Three cycles drawn from the reduced birth
 * month / day / year. Boundaries are the Personal Year 1 closest to age 28
 * and to age 56.
 */
export function periodCycles(dob: BirthDate): PeriodCycleSet {
  const first = makeResult(reducePreservingMasters(dob.month));
  const second = makeResult(reducePreservingMasters(dob.day));
  const third = makeResult(reducePreservingMasters(dob.year));

  return {
    first,
    second,
    third,
    ageBoundaries: [
      personalYearOneClosestToAge(dob, 28),
      personalYearOneClosestToAge(dob, 56),
    ],
  };
}

/**
 * Find the age at which the user is in a Personal Year 1 closest to the
 * given target age.
 *
 * PY repeats every 9 years. We scan ±9 years around the target and return the
 * age whose calendar year (birthYear + age) yields PY 1.
 */
function personalYearOneClosestToAge(dob: BirthDate, targetAge: number): number {
  const m = reducePreservingMasters(dob.month);
  const d = reducePreservingMasters(dob.day);

  let bestAge = targetAge;
  let bestDelta = Infinity;

  for (let age = targetAge - 8; age <= targetAge + 8; age++) {
    const calendarYear = dob.year + age;
    const yReduced = reducePreservingMasters(calendarYear);
    const py = reduceToSingleDigit(m + d + yReduced);
    if (py === 1) {
      const delta = Math.abs(age - targetAge);
      if (delta < bestDelta) {
        bestDelta = delta;
        bestAge = age;
      }
    }
  }
  return bestAge;
}

/**
 * Resolve which pinnacle, challenge, and period cycle are active at a given
 * age. Returns the 1-indexed slot (1–4 for pinnacles/challenges, 1–3 for
 * cycles).
 */
export function activeSlots(
  dob: BirthDate,
  ageNow: number,
): { pinnacle: 1 | 2 | 3 | 4; challenge: 1 | 2 | 3 | 4; cycle: 1 | 2 | 3 } {
  const p = pinnacles(dob);
  const c = periodCycles(dob);

  let pinnacleSlot: 1 | 2 | 3 | 4 = 4;
  if (ageNow < p.ageBoundaries[0]) pinnacleSlot = 1;
  else if (ageNow < p.ageBoundaries[1]) pinnacleSlot = 2;
  else if (ageNow < p.ageBoundaries[2]) pinnacleSlot = 3;

  // Challenges share the same age boundaries as pinnacles in Decoz convention.
  const challengeSlot = pinnacleSlot;

  let cycleSlot: 1 | 2 | 3 = 3;
  if (ageNow < c.ageBoundaries[0]) cycleSlot = 1;
  else if (ageNow < c.ageBoundaries[1]) cycleSlot = 2;

  return { pinnacle: pinnacleSlot, challenge: challengeSlot, cycle: cycleSlot };
}

export function pinnacleAt(set: PinnacleSet, slot: 1 | 2 | 3 | 4): NumerologyResult {
  return slot === 1 ? set.first : slot === 2 ? set.second : slot === 3 ? set.third : set.fourth;
}

export function challengeAt(set: ChallengeSet, slot: 1 | 2 | 3 | 4): NumerologyResult {
  return slot === 1 ? set.first : slot === 2 ? set.second : slot === 3 ? set.third : set.fourth;
}

export function cycleAt(set: PeriodCycleSet, slot: 1 | 2 | 3): NumerologyResult {
  return slot === 1 ? set.first : slot === 2 ? set.second : set.third;
}
