import { describe, expect, it } from 'vitest';
import {
  GATE_ARC,
  LINE_ARC,
  WHEEL,
  WHEEL_OFFSET_DEG,
  gateLineStartDeg,
  longitudeToGateLine,
} from '../wheel';

describe('HD wheel — constants', () => {
  it('contains exactly 64 unique gates', () => {
    expect(WHEEL).toHaveLength(64);
    expect(new Set(WHEEL).size).toBe(64);
  });

  it('every gate is between 1 and 64', () => {
    for (const g of WHEEL) {
      expect(g).toBeGreaterThanOrEqual(1);
      expect(g).toBeLessThanOrEqual(64);
    }
  });

  it('GATE_ARC = 5.625° and LINE_ARC = 0.9375°', () => {
    expect(GATE_ARC).toBeCloseTo(5.625);
    expect(LINE_ARC).toBeCloseTo(0.9375);
  });
});

describe('longitudeToGateLine — wheel anchor', () => {
  it('Gate 41 Line 1 starts exactly at the wheel anchor', () => {
    const r = longitudeToGateLine(WHEEL_OFFSET_DEG);
    expect(r.gate).toBe(41);
    expect(r.line).toBe(1);
  });

  it('one gate-arc past the anchor → Gate 19 Line 1', () => {
    const r = longitudeToGateLine(WHEEL_OFFSET_DEG + GATE_ARC);
    expect(r.gate).toBe(19);
    expect(r.line).toBe(1);
  });

  it('two gate-arcs past the anchor → Gate 13 Line 1', () => {
    const r = longitudeToGateLine(WHEEL_OFFSET_DEG + 2 * GATE_ARC);
    expect(r.gate).toBe(13);
    expect(r.line).toBe(1);
  });
});

describe('longitudeToGateLine — line cusps within a gate', () => {
  // Picking a known gate; the same boundary math applies to all.
  const baseGate = WHEEL_OFFSET_DEG; // Gate 41 starts here.

  it('just before the line-1→line-2 cusp returns line 1', () => {
    const r = longitudeToGateLine(baseGate + LINE_ARC - 1e-9);
    expect(r.line).toBe(1);
  });

  it('at the line-2 cusp returns line 2', () => {
    const r = longitudeToGateLine(baseGate + LINE_ARC + 1e-9);
    expect(r.line).toBe(2);
  });

  it('line 6 is the last line before the next gate', () => {
    const r = longitudeToGateLine(baseGate + 5 * LINE_ARC + 1e-9);
    expect(r.line).toBe(6);
  });

  it('one tick past line 6 wraps into the next gate at line 1', () => {
    const r = longitudeToGateLine(baseGate + GATE_ARC + 1e-9);
    expect(r.gate).toBe(WHEEL[1]); // Gate 19
    expect(r.line).toBe(1);
  });
});

describe('longitudeToGateLine — full wheel wrap', () => {
  it('360° wraps to 0° and lands in the same gate as ecliptic 0°', () => {
    const at0 = longitudeToGateLine(0);
    const at360 = longitudeToGateLine(360);
    expect(at360.gate).toBe(at0.gate);
    expect(at360.line).toBe(at0.line);
  });

  it('negative inputs are normalized into [0, 360)', () => {
    const a = longitudeToGateLine(-30);
    const b = longitudeToGateLine(330);
    expect(a.gate).toBe(b.gate);
    expect(a.line).toBe(b.line);
  });

  it('thrown on non-finite input', () => {
    expect(() => longitudeToGateLine(NaN)).toThrow();
    expect(() => longitudeToGateLine(Infinity)).toThrow();
  });
});

describe('gateLineStartDeg — inverse round-trip', () => {
  it('every (gate, line) round-trips back to the same gate/line', () => {
    for (const gate of WHEEL) {
      for (const line of [1, 2, 3, 4, 5, 6] as const) {
        const start = gateLineStartDeg(gate, line);
        // Step a small epsilon INTO the line range to avoid landing on
        // the previous line's right edge due to floating point.
        const probe = longitudeToGateLine(start + LINE_ARC / 4);
        expect(probe.gate, `gate ${gate} line ${line} start=${start}`).toBe(gate);
        expect(probe.line, `gate ${gate} line ${line} start=${start}`).toBe(line);
      }
    }
  });

  it('rejects unknown gate numbers', () => {
    expect(() => gateLineStartDeg(0, 1)).toThrow();
    expect(() => gateLineStartDeg(65, 1)).toThrow();
  });
});
