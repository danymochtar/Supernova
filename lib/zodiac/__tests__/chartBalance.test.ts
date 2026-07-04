import { describe, expect, it } from 'vitest';
import { computeChartBalance } from '../chartBalance';

describe('computeChartBalance', () => {
  it('returns zero counts + null dominants when no placements', () => {
    const b = computeChartBalance([null, null, null]);
    expect(b.total).toBe(0);
    expect(b.elements.fire).toBe(0);
    expect(b.elements.earth).toBe(0);
    expect(b.elements.air).toBe(0);
    expect(b.elements.water).toBe(0);
    expect(b.dominantElement).toBeNull();
    expect(b.dominantModality).toBeNull();
    expect(b.missingElements).toEqual(['fire', 'earth', 'air', 'water']);
  });

  it('counts a single sun-only chart', () => {
    const b = computeChartBalance(['taurus', null, null, null, null]);
    expect(b.total).toBe(1);
    expect(b.elements.earth).toBe(1);
    expect(b.elements.fire).toBe(0);
    expect(b.dominantElement).toBe('earth');
    expect(b.dominantModality).toBe('fixed');
    expect(b.missingElements).toEqual(['fire', 'air', 'water']);
  });

  it('picks the majority element with a clear win', () => {
    const b = computeChartBalance(['taurus', 'virgo', 'capricorn', 'leo', 'gemini']);
    // 3 earth (Taurus/Virgo/Capricorn), 1 fire (Leo), 1 air (Gemini)
    expect(b.total).toBe(5);
    expect(b.elements.earth).toBe(3);
    expect(b.elements.fire).toBe(1);
    expect(b.elements.air).toBe(1);
    expect(b.dominantElement).toBe('earth');
    expect(b.missingElements).toEqual(['water']);
  });

  it('breaks element ties in fire → earth → air → water order', () => {
    // 1 fire, 1 earth — tie at 1
    const b = computeChartBalance(['aries', 'taurus']);
    expect(b.dominantElement).toBe('fire');
  });

  it('picks the majority modality', () => {
    const b = computeChartBalance(['aries', 'cancer', 'libra', 'gemini', 'sagittarius']);
    // 3 cardinal (Aries/Cancer/Libra), 2 mutable (Gemini/Sagittarius)
    expect(b.dominantModality).toBe('cardinal');
  });

  it('reports which elements are missing when partial coverage', () => {
    // All fire — missing earth/air/water
    const b = computeChartBalance(['aries', 'leo', 'sagittarius']);
    expect(b.dominantElement).toBe('fire');
    expect(b.missingElements).toEqual(['earth', 'air', 'water']);
  });

  it('reports empty missingElements when all four covered', () => {
    const b = computeChartBalance(['aries', 'taurus', 'gemini', 'cancer']);
    expect(b.missingElements).toEqual([]);
  });

  it('ignores null slots in the input array', () => {
    const b = computeChartBalance(['aries', null, 'leo', null, null]);
    expect(b.total).toBe(2);
    expect(b.elements.fire).toBe(2);
    expect(b.dominantElement).toBe('fire');
  });
});
