import { describe, expect, it } from 'vitest';
import { ELEMENT, GLYPH, MODALITY, ZODIAC_SIGNS, sunSignFromDob } from '../signs';

describe('sunSignFromDob', () => {
  it('Dany 1995-05-17 → Taurus', () => {
    expect(sunSignFromDob({ month: 5, day: 17 })).toBe('taurus');
  });

  it('Aries cusp boundaries', () => {
    expect(sunSignFromDob({ month: 3, day: 20 })).toBe('pisces');
    expect(sunSignFromDob({ month: 3, day: 21 })).toBe('aries');
    expect(sunSignFromDob({ month: 4, day: 19 })).toBe('aries');
    expect(sunSignFromDob({ month: 4, day: 20 })).toBe('taurus');
  });

  it('Cancer cusp boundaries', () => {
    expect(sunSignFromDob({ month: 6, day: 20 })).toBe('gemini');
    expect(sunSignFromDob({ month: 6, day: 21 })).toBe('cancer');
    expect(sunSignFromDob({ month: 7, day: 22 })).toBe('cancer');
    expect(sunSignFromDob({ month: 7, day: 23 })).toBe('leo');
  });

  it('Capricorn wraps the year-end', () => {
    expect(sunSignFromDob({ month: 12, day: 21 })).toBe('sagittarius');
    expect(sunSignFromDob({ month: 12, day: 22 })).toBe('capricorn');
    expect(sunSignFromDob({ month: 12, day: 31 })).toBe('capricorn');
    expect(sunSignFromDob({ month: 1, day: 1 })).toBe('capricorn');
    expect(sunSignFromDob({ month: 1, day: 19 })).toBe('capricorn');
    expect(sunSignFromDob({ month: 1, day: 20 })).toBe('aquarius');
  });

  it('Pisces ends just before Aries (Mar 20 / Mar 21)', () => {
    expect(sunSignFromDob({ month: 2, day: 19 })).toBe('pisces');
    expect(sunSignFromDob({ month: 3, day: 20 })).toBe('pisces');
  });

  it('every sign has element + modality + glyph defined', () => {
    for (const sign of ZODIAC_SIGNS) {
      expect(ELEMENT[sign]).toBeDefined();
      expect(MODALITY[sign]).toBeDefined();
      expect(GLYPH[sign]).toBeDefined();
    }
  });

  it('elements have exactly 3 signs each (triplicities)', () => {
    const counts: Record<string, number> = { fire: 0, earth: 0, air: 0, water: 0 };
    for (const sign of ZODIAC_SIGNS) counts[ELEMENT[sign]] = (counts[ELEMENT[sign]] ?? 0) + 1;
    expect(counts.fire).toBe(3);
    expect(counts.earth).toBe(3);
    expect(counts.air).toBe(3);
    expect(counts.water).toBe(3);
  });

  it('modalities have exactly 4 signs each (quadruplicities)', () => {
    const counts: Record<string, number> = { cardinal: 0, fixed: 0, mutable: 0 };
    for (const sign of ZODIAC_SIGNS) counts[MODALITY[sign]] = (counts[MODALITY[sign]] ?? 0) + 1;
    expect(counts.cardinal).toBe(4);
    expect(counts.fixed).toBe(4);
    expect(counts.mutable).toBe(4);
  });
});
