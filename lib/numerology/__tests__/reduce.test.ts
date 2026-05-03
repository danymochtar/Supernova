import { describe, expect, it } from 'vitest';
import { makeResult, reducePreservingMasters } from '../reduce';

describe('reducePreservingMasters', () => {
  it('returns single digits unchanged', () => {
    expect(reducePreservingMasters(0)).toBe(0);
    expect(reducePreservingMasters(7)).toBe(7);
  });

  it('reduces multi-digit non-masters to single digit', () => {
    expect(reducePreservingMasters(15)).toBe(6);
    expect(reducePreservingMasters(28)).toBe(1);
    expect(reducePreservingMasters(1990)).toBe(1);
  });

  it('preserves master numbers 11, 22, 33', () => {
    expect(reducePreservingMasters(11)).toBe(11);
    expect(reducePreservingMasters(22)).toBe(22);
    expect(reducePreservingMasters(33)).toBe(33);
  });

  it('preserves a master number that appears mid-reduction', () => {
    // 119 → 1+1+9 = 11 (master, stop here)
    expect(reducePreservingMasters(119)).toBe(11);
  });

  it('reduces past a non-master compound to its single digit', () => {
    // 38 → 11? no: 3+8 = 11, master, stop. Sanity check with 39 → 12 → 3
    expect(reducePreservingMasters(39)).toBe(3);
  });
});

describe('makeResult', () => {
  it('flags karmic debt 19', () => {
    const r = makeResult(19);
    expect(r).toEqual({ compound: 19, reduced: 1, isMaster: false, karmicDebt: 19 });
  });

  it('flags master without karmic debt', () => {
    const r = makeResult(11);
    expect(r).toEqual({ compound: 11, reduced: 11, isMaster: true });
  });

  it('flags neither for ordinary compound', () => {
    const r = makeResult(15);
    expect(r).toEqual({ compound: 15, reduced: 6, isMaster: false });
  });
});
