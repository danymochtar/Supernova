import { describe, expect, it } from 'vitest';
import { activeTransit, essenceAt, nextEssenceShift } from '../essence';

describe('Essence Cycle — Dany Mochtar fixture', () => {
  const names = { firstName: 'Dany', lastName: 'Mochtar' };

  it('Physical Transit at age 30 is Y (cycle 2, ages 27-33)', () => {
    const t = activeTransit('Dany', 30);
    expect(t).not.toBeNull();
    expect(t!.letter).toBe('Y');
    expect(t!.value).toBe(7);
    expect(t!.rangeStart).toBe(27);
    expect(t!.rangeEnd).toBe(33);
    expect(t!.cycleIndex).toBe(2);
  });

  it('Spiritual Transit at age 30 is R (cycle 1, ages 24-32)', () => {
    const t = activeTransit('Mochtar', 30);
    expect(t).not.toBeNull();
    expect(t!.letter).toBe('R');
    expect(t!.value).toBe(9);
    expect(t!.rangeStart).toBe(24);
    expect(t!.rangeEnd).toBe(32);
    expect(t!.cycleIndex).toBe(1);
  });

  it('Essence at age 30 is 16/7 with karmic debt 16 preserved', () => {
    const frame = essenceAt(names, 30);
    expect(frame.physical?.letter).toBe('Y');
    expect(frame.spiritual?.letter).toBe('R');
    expect(frame.mental).toBeNull();
    expect(frame.essence.compound).toBe(16);
    expect(frame.essence.reduced).toBe(7);
    expect(frame.essence.karmicDebt).toBe(16);
    expect(frame.letters).toBe('Y/R');
  });

  it('Essence at age 0 is D + M = 4 + 4 = 8', () => {
    const frame = essenceAt(names, 0);
    expect(frame.physical?.letter).toBe('D');
    expect(frame.spiritual?.letter).toBe('M');
    expect(frame.essence.compound).toBe(8);
    expect(frame.essence.reduced).toBe(8);
  });

  it('Next shift from age 30 is at age 33 (Spiritual R → M; Physical Y still has 1 year left)', () => {
    // Physical Y range 27-33, Spiritual R range 24-32 — R expires first.
    const frame = essenceAt(names, 30);
    const shift = nextEssenceShift(frame);
    expect(shift).not.toBeNull();
    expect(shift!.age).toBe(33);
    expect(shift!.ends).toEqual(['spiritual']);
  });

  it('At age 33, Y is still Physical but Spiritual is now M; Essence = 7 + 4 = 11/master', () => {
    const frame = essenceAt(names, 33);
    expect(frame.physical?.letter).toBe('Y');
    expect(frame.spiritual?.letter).toBe('M');
    expect(frame.essence.compound).toBe(11);
    expect(frame.essence.isMaster).toBe(true);
  });

  it('Physical Transit at age 16 is Y (final year of cycle 1)', () => {
    const t = activeTransit('Dany', 16);
    expect(t!.letter).toBe('Y');
    expect(t!.cycleIndex).toBe(1);
    expect(t!.rangeEnd).toBe(16);
  });

  it('Physical Transit at age 17 rolls into D (start of cycle 2)', () => {
    const t = activeTransit('Dany', 17);
    expect(t!.letter).toBe('D');
    expect(t!.cycleIndex).toBe(2);
    expect(t!.rangeStart).toBe(17);
  });
});
