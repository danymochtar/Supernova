import { describe, expect, it } from 'vitest';
import { activeSlots, challenges, periodCycles, pinnacles } from '../cycles';
import { referenceProfiles } from '../../../tests/fixtures/profiles';

describe('pinnacles', () => {
  for (const profile of referenceProfiles) {
    describe(profile.label, () => {
      const result = pinnacles(profile.dob);
      const expected = profile.expected.pinnacles;

      it('first', () => {
        expect(result.first.compound).toBe(expected.first.compound);
        expect(result.first.reduced).toBe(expected.first.reduced);
        if (expected.first.karmicDebt) expect(result.first.karmicDebt).toBe(expected.first.karmicDebt);
        if (expected.first.isMaster) expect(result.first.isMaster).toBe(true);
      });
      it('second', () => {
        expect(result.second.compound).toBe(expected.second.compound);
        expect(result.second.reduced).toBe(expected.second.reduced);
        if (expected.second.karmicDebt) expect(result.second.karmicDebt).toBe(expected.second.karmicDebt);
        if (expected.second.isMaster) expect(result.second.isMaster).toBe(true);
      });
      it('third', () => {
        expect(result.third.compound).toBe(expected.third.compound);
        expect(result.third.reduced).toBe(expected.third.reduced);
        if (expected.third.karmicDebt) expect(result.third.karmicDebt).toBe(expected.third.karmicDebt);
        if (expected.third.isMaster) expect(result.third.isMaster).toBe(true);
      });
      it('fourth', () => {
        expect(result.fourth.compound).toBe(expected.fourth.compound);
        expect(result.fourth.reduced).toBe(expected.fourth.reduced);
        if (expected.fourth.karmicDebt) expect(result.fourth.karmicDebt).toBe(expected.fourth.karmicDebt);
        if (expected.fourth.isMaster) expect(result.fourth.isMaster).toBe(true);
      });
      it('age boundaries', () => {
        expect(result.ageBoundaries).toEqual(expected.ageBoundaries);
      });
    });
  }
});

describe('challenges', () => {
  for (const profile of referenceProfiles) {
    it(profile.label, () => {
      const result = challenges(profile.dob);
      const expected = profile.expected.challenges;
      expect(result.first.compound).toBe(expected.first.compound);
      expect(result.second.compound).toBe(expected.second.compound);
      expect(result.third.compound).toBe(expected.third.compound);
      expect(result.fourth.compound).toBe(expected.fourth.compound);
    });
  }
});

describe('periodCycles', () => {
  it('Mary Smith — three cycles match reduced m/d/y', () => {
    const dob = { year: 1990, month: 7, day: 28 };
    const c = periodCycles(dob);
    expect(c.first.reduced).toBe(7); // month
    expect(c.second.reduced).toBe(1); // day 28→1
    expect(c.third.reduced).toBe(1); // year 1990→1
    // boundaries are PY-1 ages near 28 and 56; they exist and are integers in a reasonable range
    expect(c.ageBoundaries[0]).toBeGreaterThanOrEqual(20);
    expect(c.ageBoundaries[0]).toBeLessThanOrEqual(36);
    expect(c.ageBoundaries[1]).toBeGreaterThanOrEqual(48);
    expect(c.ageBoundaries[1]).toBeLessThanOrEqual(64);
  });

  it('Yvonne Tan — master birthday day cycle preserved', () => {
    const dob = { year: 1985, month: 3, day: 11 };
    const c = periodCycles(dob);
    expect(c.first.reduced).toBe(3);
    expect(c.second.reduced).toBe(11);
    expect(c.second.isMaster).toBe(true);
    expect(c.third.reduced).toBe(5);
  });
});

describe('activeSlots', () => {
  it('Mary Smith at age 20 → first pinnacle', () => {
    const slots = activeSlots({ year: 1990, month: 7, day: 28 }, 20);
    expect(slots.pinnacle).toBe(1);
    expect(slots.challenge).toBe(1);
  });

  it('Mary Smith at age 27 → second pinnacle (first ends at 27)', () => {
    const slots = activeSlots({ year: 1990, month: 7, day: 28 }, 27);
    expect(slots.pinnacle).toBe(2);
  });

  it('Mary Smith at age 50 → fourth pinnacle', () => {
    const slots = activeSlots({ year: 1990, month: 7, day: 28 }, 50);
    expect(slots.pinnacle).toBe(4);
  });
});
