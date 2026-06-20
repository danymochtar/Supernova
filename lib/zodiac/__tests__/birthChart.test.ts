import { describe, expect, it } from 'vitest';
import { computeMoonAndRising } from '../birthChart';

describe('computeMoonAndRising', () => {
  it('Dany 1995-05-17 08:00 Asia/Jakarta — sun-consistent Moon + Rising', () => {
    // The library's Sun for this input is Taurus (matches sunSignFromDob).
    // The Moon and Rising depend on the time of day in Jakarta; we
    // pin the result to make any future ephemeris drift visible in CI.
    const out = computeMoonAndRising({
      year: 1995,
      month: 5,
      day: 17,
      birthTime: '08:00',
      timezone: 'Asia/Jakarta',
    });
    expect(out.moon).toBe('sagittarius');
    expect(out.rising).toBe('gemini');
  });

  it('returns nulls on malformed birthTime', () => {
    const out = computeMoonAndRising({
      year: 1995,
      month: 5,
      day: 17,
      birthTime: '25:99',
      timezone: 'Asia/Jakarta',
    });
    expect(out.moon).toBeNull();
    expect(out.rising).toBeNull();
  });

  it('returns nulls on empty birthTime', () => {
    const out = computeMoonAndRising({
      year: 1995,
      month: 5,
      day: 17,
      birthTime: '',
      timezone: 'Asia/Jakarta',
    });
    expect(out.moon).toBeNull();
    expect(out.rising).toBeNull();
  });

  it('falls back to (0, 0) lat/lon for unknown timezone — still returns a sign', () => {
    const out = computeMoonAndRising({
      year: 1995,
      month: 5,
      day: 17,
      birthTime: '08:00',
      timezone: 'Some/Unknown',
    });
    // Should not throw; moon should resolve (moon is barely lat/lon-dependent).
    expect(out.moon).not.toBeNull();
  });
});
