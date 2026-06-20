import { describe, expect, it } from 'vitest';
import { zodiacModifier } from '../zodiacModifier';

// Reference DOBs picked so the derived Sun signs are known:
//   1995-05-17 → Taurus    (earth, fixed)
//   1995-08-10 → Leo       (fire, fixed)
//   1995-09-15 → Virgo     (earth, mutable)
//   1995-12-25 → Capricorn (earth, cardinal)
//   1995-07-25 → Leo       (fire, fixed) — Sun-Sun match w/ 1995-08-10
//   1995-02-10 → Aquarius  (air, fixed) — Leo's opposite (magnetic)
//   1995-04-10 → Aries     (fire, cardinal)
//   1995-07-05 → Cancer    (water, cardinal)
//   1995-10-10 → Libra     (air, cardinal) — Aries's opposite (magnetic)
const TAURUS = { year: 1995, month: 5, day: 17 };
const LEO_A = { year: 1995, month: 8, day: 10 };
const LEO_B = { year: 1995, month: 7, day: 25 };
const AQUARIUS = { year: 1995, month: 2, day: 10 };
const ARIES = { year: 1995, month: 4, day: 10 };
const CANCER = { year: 1995, month: 7, day: 5 };
const LIBRA = { year: 1995, month: 10, day: 10 };

describe('zodiacModifier', () => {
  it('Sun-Sun harmony (same sign) on Sun-only data → +1', () => {
    const out = zodiacModifier({
      meDob: LEO_A,
      meMoon: null,
      meRising: null,
      themDob: LEO_B,
      themMoon: null,
      themRising: null,
    });
    expect(out).not.toBeNull();
    expect(out!.delta).toBe(1);
    expect(out!.harmonyCount).toBe(1);
    expect(out!.tensionCount).toBe(0);
    expect(out!.totalPairs).toBe(1);
  });

  it('Sun-Sun magnetic (opposite signs) → 0 → returns null', () => {
    // Leo ↔ Aquarius are opposites → 'magnetic'. Magnetic contributes 0
    // to the math, so the overall delta is zero → modifier returns null.
    const out = zodiacModifier({
      meDob: LEO_A,
      meMoon: null,
      meRising: null,
      themDob: AQUARIUS,
      themMoon: null,
      themRising: null,
    });
    expect(out).toBeNull();
  });

  it('Sun-Sun tension (incompatible elements) → -1', () => {
    // Leo (fire) ↔ Taurus (earth, non-opposite) → 'tension'.
    const out = zodiacModifier({
      meDob: LEO_A,
      meMoon: null,
      meRising: null,
      themDob: TAURUS,
      themMoon: null,
      themRising: null,
    });
    expect(out).not.toBeNull();
    expect(out!.delta).toBe(-1);
    expect(out!.tensionCount).toBe(1);
  });

  it('caps positive delta at +3 even when 5 harmony pairs', () => {
    // Identical placements on both sides → every available pair lands
    // as harmony. With moon + rising on both, total pairs = 5 → raw 5
    // → cap +3.
    const out = zodiacModifier({
      meDob: TAURUS,
      meMoon: 'cancer',
      meRising: 'virgo',
      themDob: TAURUS,
      themMoon: 'cancer',
      themRising: 'virgo',
    });
    expect(out).not.toBeNull();
    expect(out!.delta).toBe(3);
    expect(out!.harmonyCount).toBe(5);
    expect(out!.totalPairs).toBe(5);
  });

  it('caps negative delta at -3 on stacked tensions', () => {
    // me: Sun Leo (fire) / Moon Leo / Rising Sagittarius (fire)
    // them: Sun Cancer (water) / Moon Pisces / Rising Scorpio (water)
    // All five pair categories land as fire ↔ water tension. Raw -5 → cap -3.
    const out = zodiacModifier({
      meDob: LEO_A,
      meMoon: 'leo',
      meRising: 'sagittarius',
      themDob: CANCER,
      themMoon: 'pisces',
      themRising: 'scorpio',
    });
    expect(out).not.toBeNull();
    expect(out!.delta).toBe(-3);
    expect(out!.tensionCount).toBeGreaterThanOrEqual(3);
  });

  it('mix cancels toward zero — net 0 returns null', () => {
    // me: Sun Aries (fire) / Moon Cancer (water)
    // them: Sun Libra (air) / Moon Cancer (water)
    // pairs:
    //   sun-sun: Aries ↔ Libra → magnetic (0)
    //   moon-moon: Cancer ↔ Cancer → harmony (+1)
    //   sun-moon: Aries ↔ Cancer → fire+water tension (-1)
    // raw 0 → null.
    const out = zodiacModifier({
      meDob: ARIES,
      meMoon: 'cancer',
      meRising: null,
      themDob: LIBRA,
      themMoon: 'cancer',
      themRising: null,
    });
    expect(out).toBeNull();
  });

  it('magnetic pairs do not contribute to the tally', () => {
    // Sun-Sun magnetic only → delta 0 → null (covered above), but also
    // assert via counters that no harmony / tension was credited.
    const out = zodiacModifier({
      meDob: LEO_A,
      meMoon: null,
      meRising: null,
      themDob: AQUARIUS,
      themMoon: null,
      themRising: null,
    });
    expect(out).toBeNull();
  });
});
