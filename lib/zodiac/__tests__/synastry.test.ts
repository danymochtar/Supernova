import { describe, expect, it } from 'vitest';
import { classifyPair, synastry } from '../synastry';

describe('classifyPair', () => {
  it('same sign → harmony', () => {
    expect(classifyPair('leo', 'leo')).toBe('harmony');
    expect(classifyPair('cancer', 'cancer')).toBe('harmony');
  });

  it('opposing signs → magnetic', () => {
    expect(classifyPair('aries', 'libra')).toBe('magnetic');
    expect(classifyPair('libra', 'aries')).toBe('magnetic');
    expect(classifyPair('taurus', 'scorpio')).toBe('magnetic');
    expect(classifyPair('cancer', 'capricorn')).toBe('magnetic');
    expect(classifyPair('leo', 'aquarius')).toBe('magnetic');
    expect(classifyPair('virgo', 'pisces')).toBe('magnetic');
    expect(classifyPair('gemini', 'sagittarius')).toBe('magnetic');
  });

  it('same element (non-opposite) → harmony', () => {
    // Fire-fire (non-opposite combinations)
    expect(classifyPair('aries', 'leo')).toBe('harmony');
    expect(classifyPair('leo', 'sagittarius')).toBe('harmony');
    // Water-water
    expect(classifyPair('cancer', 'pisces')).toBe('harmony');
    expect(classifyPair('scorpio', 'pisces')).toBe('harmony');
  });

  it('fire + air → harmony (complementary elements)', () => {
    expect(classifyPair('aries', 'gemini')).toBe('harmony');
    expect(classifyPair('leo', 'libra')).toBe('harmony');
    expect(classifyPair('sagittarius', 'aquarius')).toBe('harmony');
  });

  it('opposite signs win over element rules — magnetic, not harmony', () => {
    // Leo (fire) ↔ Aquarius (air) are also a fire+air complement, but
    // they're directly opposite — magnetic supersedes.
    expect(classifyPair('leo', 'aquarius')).toBe('magnetic');
    // Gemini (air) ↔ Sagittarius (fire) — same story.
    expect(classifyPair('gemini', 'sagittarius')).toBe('magnetic');
  });

  it('earth + water → harmony (complementary elements)', () => {
    expect(classifyPair('taurus', 'cancer')).toBe('harmony');
    expect(classifyPair('virgo', 'scorpio')).toBe('harmony');
    expect(classifyPair('capricorn', 'pisces')).toBe('harmony');
  });

  it('fire + water (non-opposite) → tension', () => {
    expect(classifyPair('aries', 'cancer')).toBe('tension');
    expect(classifyPair('leo', 'scorpio')).toBe('tension');
    expect(classifyPair('sagittarius', 'pisces')).toBe('tension');
  });

  it('earth + fire → tension', () => {
    expect(classifyPair('taurus', 'leo')).toBe('tension');
    expect(classifyPair('virgo', 'sagittarius')).toBe('tension');
  });

  it('classifyPair is symmetric', () => {
    expect(classifyPair('aries', 'cancer')).toBe(classifyPair('cancer', 'aries'));
    expect(classifyPair('leo', 'aquarius')).toBe(classifyPair('aquarius', 'leo'));
  });
});

describe('synastry', () => {
  const userFull = { sun: 'taurus' as const, moon: 'leo' as const, rising: 'libra' as const };
  const personFull = { sun: 'cancer' as const, moon: 'pisces' as const, rising: 'scorpio' as const };

  it('full placements → all 5 pair categories', () => {
    const out = synastry(userFull, personFull);
    expect(out.partial).toBe(false);
    expect(out.pairs.map((p) => p.category)).toEqual([
      'sun-sun',
      'moon-moon',
      'rising-rising',
      'sun-moon',
      'sun-rising',
    ]);
  });

  it('user missing moon/rising → still get sun-sun + crosses to person', () => {
    const userSunOnly = { sun: 'taurus' as const, moon: null, rising: null };
    const out = synastry(userSunOnly, personFull);
    // Sun-Sun + sun-moon + sun-rising (crosses use user.sun)
    expect(out.pairs.map((p) => p.category)).toEqual([
      'sun-sun',
      'sun-moon',
      'sun-rising',
    ]);
    expect(out.partial).toBe(true);
  });

  it('person missing moon/rising → only sun-sun', () => {
    const personSunOnly = { sun: 'cancer' as const, moon: null, rising: null };
    const out = synastry(userFull, personSunOnly);
    expect(out.pairs.map((p) => p.category)).toEqual(['sun-sun']);
    expect(out.partial).toBe(true);
  });

  it('both missing all moon/rising → only sun-sun, partial true', () => {
    const sunOnly = { sun: 'aries' as const, moon: null, rising: null };
    const out = synastry(sunOnly, sunOnly);
    expect(out.pairs).toHaveLength(1);
    expect(out.pairs[0]?.category).toBe('sun-sun');
    expect(out.partial).toBe(true);
  });

  it('moon-moon classification uses moon signs (not sun)', () => {
    const user = { sun: 'aries' as const, moon: 'cancer' as const, rising: null };
    const person = { sun: 'aries' as const, moon: 'cancer' as const, rising: null };
    const out = synastry(user, person);
    const moonPair = out.pairs.find((p) => p.category === 'moon-moon');
    expect(moonPair?.classification).toBe('harmony'); // same sign
  });

  it('sun-moon cross uses user.sun vs person.moon', () => {
    const user = { sun: 'aries' as const, moon: null, rising: null };
    const person = { sun: 'taurus' as const, moon: 'libra' as const, rising: null };
    const out = synastry(user, person);
    const cross = out.pairs.find((p) => p.category === 'sun-moon');
    expect(cross?.userSign).toBe('aries');
    expect(cross?.personSign).toBe('libra');
    expect(cross?.classification).toBe('magnetic'); // aries↔libra
  });
});
