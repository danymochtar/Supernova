import { describe, expect, it } from 'vitest';
import { analyzePair, personNumbers } from '..';

/**
 * Fixture assertions from soulconnectionfeatureplan.md §8. These pin
 * the calculation to the spec; changes to the engine should either
 * update these OR (much better) match the spec exactly.
 */

const FIXTURE_A = { fullName: 'DANY MOCHTAR', dob: { year: 1995, month: 5, day: 17 } };
const FIXTURE_B = { fullName: 'SABRI BIN BASRI', dob: { year: 1990, month: 9, day: 22 } };

describe('personNumbers — Fixture A (Dany Mochtar, 1995-05-17)', () => {
  const p = personNumbers(FIXTURE_A.dob, FIXTURE_A.fullName);

  it('reduces components separately: day 17→8, month 5, year 1995→6', () => {
    expect(p.dayComponent).toBe(8);
    expect(p.monthComponent).toBe(5);
    expect(p.yearComponent).toBe(6);
  });

  it('preReductionSum = 8 + 5 + 6 = 19', () => {
    expect(p.preReductionSum).toBe(19);
  });

  it('lifePath = 1 (from 19 → 10 → 1)', () => {
    expect(p.lifePath).toBe(1);
  });

  it('karmicDebt: 19 from preReductionSum', () => {
    expect(p.karmicDebt).toEqual({ number: 19, source: 'preReductionSum' });
  });

  it('soulUrge = 6 (DANY vowels A+Y, MOCHTAR vowels O+A per Y-rule)', () => {
    expect(p.soulUrge).toBe(6);
  });

  it('no master day (17)', () => {
    expect(p.isMasterDay).toBe(false);
  });
});

describe('personNumbers — Fixture B (Sabri bin Basri, 1990-09-22)', () => {
  const p = personNumbers(FIXTURE_B.dob, FIXTURE_B.fullName);

  it('birth day 22 is preserved as a master component', () => {
    expect(p.dayComponent).toBe(22);
    expect(p.isMasterDay).toBe(true);
  });

  it('month 9, year 1990 → 1, preReductionSum = 22 + 9 + 1 = 32', () => {
    expect(p.monthComponent).toBe(9);
    expect(p.yearComponent).toBe(1);
    expect(p.preReductionSum).toBe(32);
  });

  it('lifePath = 5 (32 → 5)', () => {
    expect(p.lifePath).toBe(5);
  });

  it('no karmicDebt (32 not in {13,14,16,19}; birth day 22 not karmic)', () => {
    expect(p.karmicDebt).toBeNull();
  });

  it('soulUrge = 11 (master preserved)', () => {
    expect(p.soulUrge).toBe(11);
    expect(p.isSoulUrgeMaster).toBe(true);
  });
});

describe('analyzePair — Fixture A ↔ Fixture B', () => {
  const a = personNumbers(FIXTURE_A.dob, FIXTURE_A.fullName);
  const b = personNumbers(FIXTURE_B.dob, FIXTURE_B.fullName);
  const reading = analyzePair(a, b);

  it('pairSumRaw = 1 + 5 = 6', () => {
    expect(reading.pairSumRaw).toBe(6);
  });

  it('pairKarmicDebt = false (6 not in karmic set)', () => {
    expect(reading.signals.find((s) => s.key === 'pairKarmicDebt')?.hit).toBe(false);
  });

  it('relationshipNumber = 6', () => {
    expect(reading.relationshipNumber).toBe(6);
  });

  it('sameGroup = true (LP 1 and 5 both in {1,5,7})', () => {
    expect(reading.signals.find((s) => s.key === 'sameGroup')?.hit).toBe(true);
  });

  it('all twin-flame markers = false', () => {
    for (const key of ['sameLifePath', 'combinedIsEleven', 'mirrorDate'] as const) {
      expect(reading.signals.find((s) => s.key === key)?.hit).toBe(false);
    }
  });

  it('primary = SOULMATE', () => {
    expect(reading.primary).toBe('SOULMATE');
  });

  it('undertones include amplified (B has masters) + karmicUndertone (A carries debt 19)', () => {
    expect(reading.undertones).toContain('amplified');
    expect(reading.undertones).toContain('karmicUndertone');
  });

  it('strength = 45 (25 sameGroup + 10 rel# 6 harmony + 10 amplified)', () => {
    expect(reading.strength).toBe(45);
  });
});

describe('additional edge cases', () => {
  it('karmicDebt from birth day 13', () => {
    const p = personNumbers({ year: 1990, month: 6, day: 13 });
    expect(p.karmicDebt).toEqual({ number: 13, source: 'birthDay' });
  });

  it('karmicDebt from birth day 14', () => {
    const p = personNumbers({ year: 1990, month: 6, day: 14 });
    expect(p.karmicDebt?.number).toBe(14);
    expect(p.karmicDebt?.source).toBe('birthDay');
  });

  it('karmicDebt from birth day 16 (birth-day source wins over preReductionSum)', () => {
    const p = personNumbers({ year: 1990, month: 6, day: 16 });
    expect(p.karmicDebt?.number).toBe(16);
    expect(p.karmicDebt?.source).toBe('birthDay');
  });

  it('karmicDebt from birth day 19', () => {
    const p = personNumbers({ year: 1990, month: 6, day: 19 });
    expect(p.karmicDebt?.number).toBe(19);
    expect(p.karmicDebt?.source).toBe('birthDay');
  });

  it('mirrorDate — day 11 vs day 11 cross', () => {
    // Same day both people → mirrorDate hit path #2 (same day + same month).
    const a = personNumbers({ year: 1990, month: 5, day: 11 });
    const b = personNumbers({ year: 1992, month: 5, day: 11 });
    const reading = analyzePair(a, b);
    expect(reading.signals.find((s) => s.key === 'mirrorDate')?.hit).toBe(true);
  });

  it('mirrorDate — cross reflection (dayA/monthA swap with dayB/monthB)', () => {
    const a = personNumbers({ year: 1990, month: 3, day: 5 });
    const b = personNumbers({ year: 1992, month: 5, day: 3 });
    expect(analyzePair(a, b).signals.find((s) => s.key === 'mirrorDate')?.hit).toBe(true);
  });

  it('mirrorDate — two-digit day reversal (12 ↔ 21)', () => {
    const a = personNumbers({ year: 1990, month: 6, day: 12 });
    const b = personNumbers({ year: 1992, month: 6, day: 21 });
    expect(analyzePair(a, b).signals.find((s) => s.key === 'mirrorDate')?.hit).toBe(true);
  });

  it('two LP 11s → sameLifePath true; TWIN_FLAME reachable', () => {
    // LP 11 needs dob whose day+month+year components sum to 11 or 20/38/etc.
    // 1988-02-09 → 9 + 2 + 8 (1988→26→8) = 19 → 1. Try harder.
    // Use dob 1970-09-11: day 11 (master), month 9, year 1970→17→8. Sum 28→10→1. No.
    // 2000-09-11: day 11, month 9, year 2000→2. Sum 22 → master. LP 22. Not 11.
    // 1988-08-05: 5 + 8 + 8 = 21 → 3. No.
    // Manual: to get LP 11 from components → need three components summing to 11 or 20 or 29 (→11 after reduce).
    // day+month+year (reduced) = 11 or 29. E.g., day 5, month 3, year → 3 (reducing to give 11). year 2001 → 3. Days 5, month 3, year 2001 → 5+3+3=11. LP 11.
    const a = personNumbers({ year: 2001, month: 3, day: 5 });
    const b = personNumbers({ year: 2001, month: 3, day: 5 });
    expect(a.lifePath).toBe(11);
    expect(b.lifePath).toBe(11);
    const reading = analyzePair(a, b);
    expect(reading.signals.find((s) => s.key === 'sameLifePath')?.hit).toBe(true);
    expect(reading.primary).toBe('TWIN_FLAME');
  });

  it('leading Y + vowel ("YUSUF") → Y not counted as vowel', () => {
    const p = personNumbers({ year: 1990, month: 1, day: 1 }, 'YUSUF');
    // vowels in YUSUF = U (3) + U (3) = 6. soulUrge = 6.
    expect(p.soulUrge).toBe(6);
  });

  it('missing fullName → LP-only reading, soulUrge = null', () => {
    const a = personNumbers({ year: 1995, month: 5, day: 17 });
    const b = personNumbers({ year: 1990, month: 9, day: 22 });
    expect(a.soulUrge).toBeNull();
    expect(b.soulUrge).toBeNull();
    const reading = analyzePair(a, b);
    // Soul-urge signals must be dark.
    expect(reading.signals.find((s) => s.key === 'soulUrgeMatch')?.hit).toBe(false);
    expect(reading.signals.find((s) => s.key === 'soulUrgeHarmonic')?.hit).toBe(false);
    // Reading still valid; primary computed from LP+group signals only.
    expect(reading.primary).toBe('SOULMATE');
  });
});
