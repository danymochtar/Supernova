/**
 * Pair analysis engine — compares two `PersonNumbers` fingerprints and
 * emits a `ConnectionReading`. Pure math; no i18n or UI concerns.
 *
 * See `soulconnectionfeatureplan.md` §1.5–§1.6 for the source spec.
 */

import { reducePreservingMasters, reduceToDigit } from '@/lib/numerology/reduce';
import type {
  ConnectionReading,
  ConnectionType,
  PersonNumbers,
  Signal,
  SignalKey,
  Undertone,
} from './types';

/** Natural-match groups — signals compatibility when both people fall
 *  into the same group after full reduction (masters flattened). */
const NATURAL_MATCH_GROUPS: readonly ReadonlySet<number>[] = [
  new Set([1, 5, 7]),
  new Set([2, 4, 8]),
  new Set([3, 6, 9]),
];

/** Which group does a digit belong to? Digits are already 1-9. */
function groupOf(digit: number): number {
  for (let i = 0; i < NATURAL_MATCH_GROUPS.length; i++) {
    if (NATURAL_MATCH_GROUPS[i]!.has(digit)) return i;
  }
  return -1;
}

/** Two digits share a natural-match group? Both must reduce fully
 *  (masters flattened) so 11 and 2 compare as same. */
function sameGroupFor(a: number | null, b: number | null): boolean {
  if (a == null || b == null) return false;
  const ga = groupOf(reduceToDigit(a));
  const gb = groupOf(reduceToDigit(b));
  return ga >= 0 && ga === gb;
}

/** Mirror-date test — three interpretations, any of them qualifies:
 *    1. dayA === monthB && monthA === dayB (cross reflection)
 *    2. dayA === dayB && monthA === monthB (same date, different year)
 *    3. Two-digit reversal (e.g. day 12 ↔ day 21). Applies when both
 *       days are between 10 and 31 and their digits reverse.
 */
function isMirrorDate(a: PersonNumbers, b: PersonNumbers): boolean {
  if (a.birthDay === b.birthMonth && a.birthMonth === b.birthDay) return true;
  if (a.birthDay === b.birthDay && a.birthMonth === b.birthMonth) return true;
  const reverseTwoDigit = (n: number): number | null => {
    if (n < 10 || n > 99) return null;
    const tens = Math.floor(n / 10);
    const units = n % 10;
    const rev = units * 10 + tens;
    return rev >= 10 && rev <= 99 ? rev : null;
  };
  const revDayA = reverseTwoDigit(a.birthDay);
  if (revDayA !== null && revDayA === b.birthDay) return true;
  const revMonA = reverseTwoDigit(a.birthMonth);
  if (revMonA !== null && revMonA === b.birthMonth) return true;
  return false;
}

/** Same life path — treats 11↔2 (and 22↔4, 33↔6) as a SOFT match by
 *  design, but only when the base numbers compare equal in the
 *  master-preserved form. The plan documents this as "soft" — we still
 *  return true here since it's a twin-flame signal; UI presents it. */
function isSameLifePath(a: PersonNumbers, b: PersonNumbers): boolean {
  if (a.lifePath === b.lifePath) return true;
  // 11 vs 2 (or 22 vs 4, 33 vs 6): a soft match — treat as sameLP.
  return reduceToDigit(a.lifePath) === reduceToDigit(b.lifePath) && (
    a.lifePath !== reduceToDigit(a.lifePath) || b.lifePath !== reduceToDigit(b.lifePath)
  );
}

/** Weight table — total 100 possible when everything hits + amplified
 *  + pairKarmicDebt. Kept in one place for easy tuning; strength score
 *  in the reading struct is the sum of weights of hit signals, capped. */
const SIGNAL_WEIGHTS: Record<SignalKey, number> = {
  sameGroup: 25,
  soulUrgeMatch: 20,
  soulUrgeHarmonic: 10,
  pairKarmicDebt: 10,
  eitherPersonKarmicDebt: 0, // undertone signal, no strength score
  sameLifePath: 15,
  combinedIsEleven: 15,
  mirrorDate: 15,
  amplified: 10,
};

/**
 * Analyze a pair. Returns a fully populated `ConnectionReading`.
 */
export function analyzePair(a: PersonNumbers, b: PersonNumbers): ConnectionReading {
  const pairSumRaw = a.lifePath + b.lifePath;
  const relationshipNumber = reducePreservingMasters(pairSumRaw);
  const pairKarmicDebtSet = new Set<number>([13, 14, 16, 19]);
  const pairKarmicDebt = pairKarmicDebtSet.has(pairSumRaw);

  // Soul Urge signals (available only when both people have names).
  const bothHaveSoulUrge = a.soulUrge !== null && b.soulUrge !== null;
  const soulUrgeMatch = bothHaveSoulUrge && a.soulUrge === b.soulUrge;
  const soulUrgeHarmonic = bothHaveSoulUrge && sameGroupFor(a.soulUrge, b.soulUrge);

  // Twin-flame markers.
  const sameLifePath = isSameLifePath(a, b);
  const combinedIsEleven = pairSumRaw === 11 || relationshipNumber === 2;
  const mirrorDate = isMirrorDate(a, b);

  // Group + karmic.
  const sameGroup = sameGroupFor(a.lifePath, b.lifePath);
  const eitherPersonKarmicDebt = a.karmicDebt !== null || b.karmicDebt !== null;

  // Amplified: either person has ≥1 master among {LP, birth day, Soul Urge}.
  const amplified =
    [11, 22, 33].includes(a.lifePath) ||
    [11, 22, 33].includes(b.lifePath) ||
    a.isMasterDay ||
    b.isMasterDay ||
    a.isSoulUrgeMaster ||
    b.isSoulUrgeMaster;

  const signals: Signal[] = (
    [
      'sameGroup',
      'soulUrgeMatch',
      'soulUrgeHarmonic',
      'pairKarmicDebt',
      'eitherPersonKarmicDebt',
      'sameLifePath',
      'combinedIsEleven',
      'mirrorDate',
      'amplified',
    ] as SignalKey[]
  ).map((key) => {
    const hit: boolean =
      key === 'sameGroup'
        ? sameGroup
        : key === 'soulUrgeMatch'
          ? soulUrgeMatch
          : key === 'soulUrgeHarmonic'
            ? soulUrgeHarmonic
            : key === 'pairKarmicDebt'
              ? pairKarmicDebt
              : key === 'eitherPersonKarmicDebt'
                ? eitherPersonKarmicDebt
                : key === 'sameLifePath'
                  ? sameLifePath
                  : key === 'combinedIsEleven'
                    ? combinedIsEleven
                    : key === 'mirrorDate'
                      ? mirrorDate
                      : /* amplified */ amplified;
    return { key, hit, weight: SIGNAL_WEIGHTS[key] };
  });

  // Additional adjacency: relationshipNumber in {2, 6} is a "harmony
  // number" — supports SOULMATE classification and adds a small +10.
  const harmonyRelationshipNumber =
    relationshipNumber === 2 || relationshipNumber === 6;

  // Primary classification (priority order per §1.6).
  let primary: ConnectionType;
  const twinFlameMarkers = [sameLifePath, combinedIsEleven, mirrorDate];
  const hardTwinFlameHits = twinFlameMarkers.filter(Boolean).length;
  if (sameLifePath && (combinedIsEleven || mirrorDate)) {
    primary = 'TWIN_FLAME';
  } else if (hardTwinFlameHits >= 2) {
    primary = 'TWIN_FLAME';
  } else if (pairKarmicDebt) {
    primary = 'KARMIC';
  } else if (
    sameGroup ||
    soulUrgeMatch ||
    (soulUrgeHarmonic && harmonyRelationshipNumber)
  ) {
    primary = 'SOULMATE';
  } else {
    primary = 'NEUTRAL';
  }

  const undertones: Undertone[] = [];
  if (eitherPersonKarmicDebt && primary !== 'KARMIC') {
    undertones.push('karmicUndertone');
  }
  if (amplified) undertones.push('amplified');

  // Strength score — sum of weights of hit signals + harmony bonus.
  let strength = 0;
  for (const s of signals) if (s.hit) strength += s.weight;
  if (harmonyRelationshipNumber) strength += 10;
  if (strength < 0) strength = 0;
  if (strength > 100) strength = 100;

  return {
    primary,
    undertones,
    strength,
    relationshipNumber,
    pairSumRaw,
    signals,
    a,
    b,
  };
}
