/**
 * Aggregate stats over the user's saved People — feeds the infographic
 * hero on the People list. Pure math, no UI concerns.
 *
 * Kept in `lib/people/` alongside the other pure helpers so both the
 * list page and any future dashboard widget can share the same shape.
 */

import { buildCoreProfile } from '@/lib/numerology';
import type { PersonView } from '@/lib/db/repositories/person';
import type { BirthDate } from '@/lib/numerology/types';
import { analyzePair, personNumbers, type ConnectionType } from '@/lib/connection';
import { ELEMENT, sunSignFromDob } from '@/lib/zodiac/signs';

export interface CircleStats {
  /** Total people in the user's circle. */
  total: number;
  /** How many carry each connection type vs the user. */
  connections: Record<ConnectionType, number>;
  /** How many fall into each Western element (fire / earth / air / water). */
  elements: Record<'fire' | 'earth' | 'air' | 'water', number>;
  /** The Life Path digit that appears most often across the circle, plus
   *  its count. `null` when the circle is empty. */
  topLifePath: { value: number; count: number } | null;
}

interface UserFacet {
  fullName: string;
  dob: BirthDate;
}

/**
 * Aggregate a set of People against the user's own profile. Uses the
 * (already efficient) pure connection engine to classify each pair; the
 * whole aggregation typically runs in well under 5ms for ≤50 people.
 */
export function computeCircleStats(
  user: UserFacet,
  people: readonly PersonView[],
): CircleStats {
  const connections: CircleStats['connections'] = {
    TWIN_FLAME: 0,
    SOULMATE: 0,
    KARMIC: 0,
    NEUTRAL: 0,
  };
  const elements: CircleStats['elements'] = {
    fire: 0,
    earth: 0,
    air: 0,
    water: 0,
  };
  const lifePathCounts = new Map<number, number>();

  const userNumbers = personNumbers(user.dob, user.fullName);

  for (const p of people) {
    // Connection type.
    const reading = analyzePair(
      userNumbers,
      personNumbers(p.dob, p.fullName),
    );
    connections[reading.primary] += 1;

    // Element via Sun sign (no birth-time needed).
    const sun = sunSignFromDob(p.dob);
    elements[ELEMENT[sun]] += 1;

    // Life Path — reuse buildCoreProfile so master handling matches
    // the rest of the app exactly.
    const core = buildCoreProfile(p.fullName, p.dob);
    const lp = core.lifePath.reduced;
    lifePathCounts.set(lp, (lifePathCounts.get(lp) ?? 0) + 1);
  }

  let topLifePath: CircleStats['topLifePath'] = null;
  for (const [value, count] of lifePathCounts) {
    if (!topLifePath || count > topLifePath.count) {
      topLifePath = { value, count };
    }
  }

  return {
    total: people.length,
    connections,
    elements,
    topLifePath,
  };
}
