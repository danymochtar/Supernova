import { describe, expect, it } from 'vitest';
import {
  contextFromInstant,
  personalCycles,
  personalDay,
  personalMonth,
  personalYear,
} from '../personal';

const dany = { year: 1992, month: 11, day: 22 };

describe('personalYear', () => {
  it('Dany 2026: m=11, d=22, y=2026→1; PY = 11+22+1 = 34 → 7', () => {
    const py = personalYear(dany, 2026);
    expect(py.compound).toBe(34);
    expect(py.reduced).toBe(7);
  });

  it('preserves master year (sum lands on 11/22/33)', () => {
    // Mary 1990-07-28 in 2030: m=7, d=1, y=2030→5; PY = 7+1+5 = 13 → 4 (KD13)
    const mary = { year: 1990, month: 7, day: 28 };
    const py = personalYear(mary, 2030);
    expect(py.compound).toBe(13);
    expect(py.reduced).toBe(4);
    expect(py.karmicDebt).toBe(13);
  });
});

describe('personalMonth and personalDay cascade', () => {
  it('Dany on 2026-05-03: PY=7, PM=7+5=12→3, PD=3+3=6', () => {
    const ctx = { year: 2026, month: 5, day: 3 };
    const pm = personalMonth(dany, ctx);
    expect(pm.compound).toBe(12);
    expect(pm.reduced).toBe(3);
    const pd = personalDay(dany, ctx);
    expect(pd.compound).toBe(6);
    expect(pd.reduced).toBe(6);
  });

  it('personalCycles returns the same triple as the individual functions', () => {
    const ctx = { year: 2026, month: 5, day: 3 };
    const cycles = personalCycles(dany, ctx);
    expect(cycles.personalYear).toEqual(personalYear(dany, ctx.year));
    expect(cycles.personalMonth).toEqual(personalMonth(dany, ctx));
    expect(cycles.personalDay).toEqual(personalDay(dany, ctx));
  });
});

// World Numerology reference (real user: Dany Mochtar, 17 May 1995, PY 2026 = 5).
// Personal cycles are single-digit: a month/day summing to a master (11/22/33)
// reduces to 2/4/6, it is NOT preserved as a master.
describe('personal cycles match World Numerology (single-digit, no master)', () => {
  const realDany = { year: 1995, month: 5, day: 17 };

  it('2026-05-25 → PM 10/1, PD 26/8', () => {
    const ctx = { year: 2026, month: 5, day: 25 };
    expect(personalYear(realDany, 2026).reduced).toBe(5);
    const pm = personalMonth(realDany, ctx);
    expect([pm.compound, pm.reduced]).toEqual([10, 1]);
    const pd = personalDay(realDany, ctx);
    expect([pd.compound, pd.reduced]).toEqual([26, 8]);
  });

  it('2026-06-30 → PM 11 reduces to 2 (not master), PD 32/5', () => {
    const ctx = { year: 2026, month: 6, day: 30 };
    const pm = personalMonth(realDany, ctx);
    expect([pm.compound, pm.reduced, pm.isMaster]).toEqual([11, 2, false]);
    const pd = personalDay(realDany, ctx);
    expect([pd.compound, pd.reduced]).toEqual([32, 5]);
  });

  it('2026-08-23 → PM 13/4 (karmic debt 13), PD 27/9', () => {
    const ctx = { year: 2026, month: 8, day: 23 };
    const pm = personalMonth(realDany, ctx);
    expect([pm.compound, pm.reduced]).toEqual([13, 4]);
    expect(pm.karmicDebt).toBe(13);
    const pd = personalDay(realDany, ctx);
    expect([pd.compound, pd.reduced]).toEqual([27, 9]);
  });
});

describe('contextFromInstant', () => {
  it('Asia/Jakarta returns Jakarta-local Y/M/D for a UTC instant', () => {
    // 2026-01-01 00:30 UTC → 2026-01-01 07:30 in Jakarta (UTC+7) — same date
    const utc = new Date('2026-01-01T00:30:00Z');
    const ctx = contextFromInstant(utc, 'Asia/Jakarta');
    expect(ctx).toEqual({ year: 2026, month: 1, day: 1 });
  });

  it('handles tz crossing midnight (UTC late evening → next day in Jakarta)', () => {
    // 2025-12-31 19:00 UTC → 2026-01-01 02:00 in Jakarta (UTC+7)
    const utc = new Date('2025-12-31T19:00:00Z');
    const ctx = contextFromInstant(utc, 'Asia/Jakarta');
    expect(ctx).toEqual({ year: 2026, month: 1, day: 1 });
  });

  it('Pacific/Honolulu (UTC-10) goes the other way', () => {
    // 2026-01-01 05:00 UTC → 2025-12-31 19:00 Honolulu
    const utc = new Date('2026-01-01T05:00:00Z');
    const ctx = contextFromInstant(utc, 'Pacific/Honolulu');
    expect(ctx).toEqual({ year: 2025, month: 12, day: 31 });
  });
});
