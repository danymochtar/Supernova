import { describe, expect, it } from 'vitest';
import type { NumerologyResult } from '@/lib/numerology';
import { pairScore } from '../score';

function n(reduced: number, compound = reduced): NumerologyResult {
  return { compound, reduced, isMaster: [11, 22, 33].includes(reduced) };
}

describe('pairScore — McCants 3-family Natural Matches', () => {
  // Mind family: 1, 5, 7
  // Creative family: 3, 6, 9
  // Structure family: 2, 4, 8
  it('in-family pairs land at or above 80 (Natural Match)', () => {
    const naturals: Array<[number, number]> = [
      [1, 5], [5, 7], [3, 6], [3, 9], [6, 9], [2, 4], [2, 8], [4, 8],
    ];
    for (const [a, b] of naturals) {
      expect(pairScore(n(a), n(b)), `${a}-${b}`).toBeGreaterThanOrEqual(80);
    }
  });

  it('1-7 in-family is favorable but lower than 1-5 / 5-7 (Decoz tension)', () => {
    const oneSeven = pairScore(n(1), n(7));
    const oneFive = pairScore(n(1), n(5));
    expect(oneSeven).toBeGreaterThanOrEqual(70);
    expect(oneSeven).toBeLessThan(oneFive);
  });
});

describe('pairScore — Decoz power-struggle pairs', () => {
  it('1-1 / 1-8 / 8-8 land in the power-struggle band (<= 42)', () => {
    expect(pairScore(n(1), n(1))).toBeLessThanOrEqual(42);
    expect(pairScore(n(1), n(8))).toBeLessThanOrEqual(42);
    expect(pairScore(n(8), n(8))).toBeLessThanOrEqual(42);
  });

  it('5-5 is the exception — Decoz says favorable', () => {
    expect(pairScore(n(5), n(5))).toBeGreaterThanOrEqual(70);
  });
});

describe('pairScore — challenge pairs from the doc', () => {
  it('Challenge pairs land in the 38-50 friction band', () => {
    const challenges: Array<[number, number]> = [
      [2, 5], [3, 4], [4, 5], [5, 6], [5, 8], [6, 7], [7, 8],
    ];
    for (const [a, b] of challenges) {
      const s = pairScore(n(a), n(b));
      expect(s, `${a}-${b}`).toBeLessThanOrEqual(50);
      expect(s, `${a}-${b}`).toBeGreaterThanOrEqual(35);
    }
  });
});

describe('pairScore — master numbers reduce to root for the layer', () => {
  it('11 vs 8 reads like 2 vs 8 (Structure family Natural Match)', () => {
    expect(pairScore(n(11, 11), n(8))).toBe(pairScore(n(2), n(8)));
  });
  it('22 vs 1 reads like 4 vs 1', () => {
    expect(pairScore(n(22, 22), n(1))).toBe(pairScore(n(4), n(1)));
  });
  it('33 vs 9 reads like 6 vs 9 (Creative family Natural Match)', () => {
    expect(pairScore(n(33, 33), n(9))).toBe(pairScore(n(6), n(9)));
  });
});

describe('pairScore — symmetry + cross bump', () => {
  it('a vs b == b vs a for any digit pair', () => {
    for (let a = 1; a <= 9; a++) {
      for (let b = 1; b <= 9; b++) {
        expect(pairScore(n(a), n(b))).toBe(pairScore(n(b), n(a)));
      }
    }
  });

  it('cross-component flag adds +4', () => {
    expect(pairScore(n(2), n(7), true) - pairScore(n(2), n(7), false)).toBe(4);
  });
});
