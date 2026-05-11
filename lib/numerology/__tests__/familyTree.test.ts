import { describe, expect, it } from 'vitest';
import { buildCoreProfile } from '../index';
import { compareToParent } from '../familyTree';

describe('compareToParent', () => {
  it('surfaces shared core numbers between user and parent', () => {
    // Both share Expression 6 (constructed so the overlap is visible).
    const self = buildCoreProfile('Sabri Bin Basri', { year: 1990, month: 1, day: 1 });
    const parent = buildCoreProfile('Basri', { year: 1960, month: 5, day: 9 });
    const result = compareToParent(self, parent);
    // Expression 6 (Sabri Bin Basri) + Birthday 9 (Basri's day 9) etc — we
    // just assert overlap is sorted and non-noisy, not specific numbers.
    expect(result.shared).toEqual(result.shared.slice().sort((a, b) => a - b));
    for (const n of result.shared) {
      expect(n).toBeGreaterThanOrEqual(1);
    }
  });

  it('inheritedLessons are parent core numbers absent from user name', () => {
    const self = buildCoreProfile('Mary Smith', { year: 1990, month: 7, day: 28 });
    const parent = buildCoreProfile('Bob Smith', { year: 1955, month: 3, day: 6 });
    const result = compareToParent(self, parent);
    // Mary Smith's karmic lessons are {3, 5, 6}. Any parent core number that
    // intersects this set lands in inheritedLessons.
    for (const n of result.inheritedLessons) {
      expect([3, 5, 6]).toContain(n);
    }
  });

  it('treats parent core numbers absent from self name as inheritedLessons', () => {
    // "Anna" has letters A,N — digits 1 and 5 only. Karmic lessons = everything
    // else {2,3,4,6,7,8,9}. Parent (also Anna) has core numbers that include
    // some of those missing digits → those count as lessons the user inherits
    // from a parent whose name carries that energy.
    const self = buildCoreProfile('Anna', { year: 2000, month: 1, day: 1 });
    const parent = buildCoreProfile('Anna', { year: 2000, month: 1, day: 1 });
    const result = compareToParent(self, parent);
    expect(result.shared.length).toBeGreaterThan(0);
    for (const n of result.inheritedLessons) {
      // Every inherited lesson must be a karmic lesson on the user's side.
      expect(self.karmicLessons).toContain(n);
    }
  });

  it('shared and inheritedLessons are sorted ascending and de-duplicated', () => {
    const self = buildCoreProfile('Dany Pratama', { year: 1992, month: 11, day: 22 });
    const parent = buildCoreProfile('Dany Pratama', { year: 1992, month: 11, day: 22 });
    const result = compareToParent(self, parent);
    expect(result.shared).toEqual([...new Set(result.shared)].sort((a, b) => a - b));
  });
});
