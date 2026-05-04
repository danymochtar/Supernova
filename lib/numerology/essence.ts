import { letterValue } from './letterMap';
import { makeResult } from './reduce';
import type { NumerologyResult } from './types';

/**
 * Essence Cycle (Decoz / Hans Decoz "Numerology: Key to Your Inner Self").
 *
 * Each letter of a name persists for a number of years equal to its
 * Pythagorean value. Walk through the letters cyclically as the user
 * ages — the currently-active letter is the user's "Transit" for that
 * name. Three names yield three Transits:
 *
 *   - Physical Transit  → first name
 *   - Mental Transit    → middle name (if any)
 *   - Spiritual Transit → last name
 *
 * The Essence at any age is the sum of the active Transits, preserving
 * karmic debts (13/14/16/19) so e.g. an Essence of 16 stays 16/7 rather
 * than collapsing to a plain 7. That's the whole point — an Essence
 * year carrying karmic debt feels nothing like a non-debt 7 year.
 *
 * Worked example for "DANY MOCHTAR" at age 30:
 *   DANY (cycle len 4+1+5+7 = 17): 30 % 17 = 13 → in Y (covers 10-16
 *     within cycle, ages 27-33 in cycle 2). Physical = Y = 7.
 *   MOCHTAR (cycle len 4+6+3+8+2+1+9 = 33): age 30 in cycle 1, walk
 *     M(0-3) O(4-9) C(10-12) H(13-20) T(21-22) A(23) R(24-32). Spiritual
 *     = R = 9.
 *   Essence = 7 + 9 = 16 → 16/7 (karmic debt).
 */

/** Strip non-letters and uppercase. Returns the letter array. */
function letters(name: string): string[] {
  return name.toUpperCase().replace(/[^A-Z]/g, '').split('');
}

export interface TransitInfo {
  /** Active letter at this age (uppercase). */
  letter: string;
  /** Pythagorean value of the letter (1-9). Equals years it persists. */
  value: number;
  /** Inclusive age range during which this exact letter-occurrence is active. */
  rangeStart: number;
  rangeEnd: number;
  /** Which traversal of the name we're in (1-indexed; cycle 2 for DANY starts at age 17). */
  cycleIndex: number;
}

/**
 * Active Transit letter for a name at a given age. Returns null when
 * the name has no scoreable letters (empty / all whitespace).
 */
export function activeTransit(name: string, age: number): TransitInfo | null {
  const ls = letters(name);
  if (ls.length === 0) return null;
  const values = ls.map(letterValue);
  const total = values.reduce((s, v) => s + v, 0);
  if (total === 0) return null;

  const cycleIndex = Math.floor(age / total);
  const positionInCycle = age - cycleIndex * total;

  let acc = 0;
  for (let i = 0; i < ls.length; i++) {
    const v = values[i]!;
    if (positionInCycle < acc + v) {
      const baseAge = cycleIndex * total + acc;
      return {
        letter: ls[i]!,
        value: v,
        rangeStart: baseAge,
        rangeEnd: baseAge + v - 1,
        cycleIndex: cycleIndex + 1,
      };
    }
    acc += v;
  }
  // Should never reach — total covers the whole cycle.
  return null;
}

/**
 * Build the full Transit timeline for a name across N years from `fromAge`.
 * Each entry covers a contiguous age range with one letter active.
 *
 * Stops as soon as `rangeStart > toAge`, so callers can cheaply ask for
 * "next 30 years from age 30".
 */
export function transitTimeline(
  name: string,
  fromAge: number,
  toAge: number,
): TransitInfo[] {
  const ls = letters(name);
  if (ls.length === 0) return [];
  const values = ls.map(letterValue);
  const total = values.reduce((s, v) => s + v, 0);
  if (total === 0) return [];

  const out: TransitInfo[] = [];
  const startCycle = Math.floor(fromAge / total);
  let cycle = startCycle;
  while (true) {
    let acc = 0;
    for (let i = 0; i < ls.length; i++) {
      const v = values[i]!;
      const baseAge = cycle * total + acc;
      if (baseAge > toAge) return out;
      if (baseAge + v - 1 >= fromAge) {
        out.push({
          letter: ls[i]!,
          value: v,
          rangeStart: baseAge,
          rangeEnd: baseAge + v - 1,
          cycleIndex: cycle + 1,
        });
      }
      acc += v;
    }
    cycle += 1;
    // Safety stop — shouldn't trigger in practice.
    if (cycle > startCycle + 30) return out;
  }
}

export interface EssenceFrame {
  age: number;
  physical: TransitInfo | null;
  mental: TransitInfo | null;
  spiritual: TransitInfo | null;
  /** Sum of active Transit values; preserves karmic debt. */
  essence: NumerologyResult;
  /** Active letters joined for display, e.g. "Y/R" or "Y/M/R". */
  letters: string;
}

/**
 * Essence at a single age — sums whichever Transits are present.
 * If middle name is empty/missing, mental is null and ignored from the sum.
 */
export function essenceAt(
  names: { firstName: string; middleName?: string | null; lastName?: string | null },
  age: number,
): EssenceFrame {
  const physical = activeTransit(names.firstName, age);
  const mental = names.middleName ? activeTransit(names.middleName, age) : null;
  const spiritual = names.lastName ? activeTransit(names.lastName, age) : null;

  const sum =
    (physical?.value ?? 0) + (mental?.value ?? 0) + (spiritual?.value ?? 0);

  const lettersDisplay = [physical?.letter, mental?.letter, spiritual?.letter]
    .filter(Boolean)
    .join('/');

  return {
    age,
    physical,
    mental,
    spiritual,
    essence: makeResult(sum),
    letters: lettersDisplay,
  };
}

/**
 * Years until the *next* Essence change — i.e. when any of the active
 * Transit letters expires. Returns the age at which the next shift happens.
 *
 * If two Transits expire on the same age we still return that age once;
 * callers can describe it as a "double shift" using the frame at that age.
 */
export function nextEssenceShift(frame: EssenceFrame): { age: number; ends: ('physical' | 'mental' | 'spiritual')[] } | null {
  const candidates: { kind: 'physical' | 'mental' | 'spiritual'; endAge: number }[] = [];
  if (frame.physical) candidates.push({ kind: 'physical', endAge: frame.physical.rangeEnd });
  if (frame.mental) candidates.push({ kind: 'mental', endAge: frame.mental.rangeEnd });
  if (frame.spiritual) candidates.push({ kind: 'spiritual', endAge: frame.spiritual.rangeEnd });
  if (candidates.length === 0) return null;
  const minEnd = Math.min(...candidates.map((c) => c.endAge));
  return {
    age: minEnd + 1,
    ends: candidates.filter((c) => c.endAge === minEnd).map((c) => c.kind),
  };
}

/**
 * Build a sequence of EssenceFrames covering each distinct (Physical,
 * Mental, Spiritual) combination from `fromAge` to `toAge`. Each frame's
 * `age` is the age at which that combination starts; the next frame's
 * age - 1 is when it ends.
 */
export function essenceTimeline(
  names: { firstName: string; middleName?: string | null; lastName?: string | null },
  fromAge: number,
  toAge: number,
): EssenceFrame[] {
  const out: EssenceFrame[] = [];
  let age = fromAge;
  while (age <= toAge) {
    const frame = essenceAt(names, age);
    out.push(frame);
    const next = nextEssenceShift(frame);
    if (!next || next.age > toAge) break;
    age = next.age;
  }
  return out;
}
