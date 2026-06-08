import { describe, expect, it } from 'vitest';
import { combinationHarmony, pairHarmony } from '../harmony';

describe('pairHarmony', () => {
  it('canonical conflicts — the active↔receptive adjacent pairs', () => {
    // (1,2) is the WN PDF's "conflicting and less-than-harmonious"
    // combination — independence vs cooperation.
    expect(pairHarmony(1, 2)).toBe('conflict');
    expect(pairHarmony(2, 1)).toBe('conflict'); // symmetric
    expect(pairHarmony(3, 4)).toBe('conflict');
    expect(pairHarmony(4, 5)).toBe('conflict'); // canonical Decoz pair
    expect(pairHarmony(5, 6)).toBe('conflict');
    expect(pairHarmony(7, 8)).toBe('conflict');
  });

  it('4 vs 9 is the only friction in 9 universal harmony', () => {
    expect(pairHarmony(4, 9)).toBe('conflict');
  });

  it('9 universal harmony with every other digit', () => {
    expect(pairHarmony(1, 9)).toBe('harmony');
    expect(pairHarmony(2, 9)).toBe('harmony');
    expect(pairHarmony(3, 9)).toBe('harmony');
    expect(pairHarmony(5, 9)).toBe('harmony');
    expect(pairHarmony(6, 9)).toBe('harmony');
    expect(pairHarmony(7, 9)).toBe('harmony');
    expect(pairHarmony(8, 9)).toBe('harmony');
  });

  it('sacred trinity 3-6-9 — all pairs harmonious', () => {
    expect(pairHarmony(3, 6)).toBe('harmony');
    expect(pairHarmony(6, 9)).toBe('harmony');
    expect(pairHarmony(3, 9)).toBe('harmony');
  });

  it('same-family odd-odd reinforce', () => {
    expect(pairHarmony(1, 3)).toBe('harmony');
    expect(pairHarmony(1, 5)).toBe('harmony');
    expect(pairHarmony(1, 7)).toBe('harmony');
    expect(pairHarmony(3, 5)).toBe('harmony');
    expect(pairHarmony(5, 7)).toBe('harmony');
  });

  it('same-family even-even reinforce', () => {
    expect(pairHarmony(2, 6)).toBe('harmony');
    expect(pairHarmony(2, 8)).toBe('harmony');
    expect(pairHarmony(4, 6)).toBe('harmony');
    expect(pairHarmony(4, 8)).toBe('harmony');
    expect(pairHarmony(6, 8)).toBe('harmony');
  });

  it('same-number pairs always harmony — energy reinforces itself', () => {
    for (let n = 1; n <= 9; n++) {
      expect(pairHarmony(n, n)).toBe('harmony');
    }
  });

  it('mixed-family non-adjacent pairs are neutral', () => {
    expect(pairHarmony(1, 4)).toBe('neutral'); // active vs distant even
    expect(pairHarmony(1, 6)).toBe('neutral');
    expect(pairHarmony(1, 8)).toBe('neutral');
    expect(pairHarmony(2, 3)).toBe('neutral');
    expect(pairHarmony(2, 5)).toBe('neutral');
    expect(pairHarmony(2, 7)).toBe('neutral');
    expect(pairHarmony(3, 7)).toBe('neutral');
    expect(pairHarmony(3, 8)).toBe('neutral');
    expect(pairHarmony(4, 7)).toBe('neutral');
    expect(pairHarmony(5, 8)).toBe('neutral');
    expect(pairHarmony(6, 7)).toBe('neutral');
  });

  it('master compounds reduce to single digit before lookup', () => {
    // 11 → 2; (11, 1) should classify the same as (2, 1) = conflict.
    expect(pairHarmony(11, 1)).toBe('conflict');
    // 22 → 4; (22, 5) should be the canonical (4, 5) = conflict.
    expect(pairHarmony(22, 5)).toBe('conflict');
    // 33 → 6; (33, 9) should be the trinity (6, 9) = harmony.
    expect(pairHarmony(33, 9)).toBe('harmony');
  });

  it('two-digit compounds reduce via digital root', () => {
    // 19 → 1+9 → 10 → 1
    expect(pairHarmony(19, 2)).toBe('conflict');
    // 28 → 2+8 → 10 → 1
    expect(pairHarmony(28, 2)).toBe('conflict');
  });
});

describe('combinationHarmony', () => {
  it("WN PDF example: PD 1, day 10/1, PM 2, PY 8 — 1↔2 is the dominant conflict", () => {
    // The user's screenshot lists "today's numbers are 1, 10, 2, 8" and
    // calls out "conflicting and less-than-harmonious combination of 1
    // and 2". 10 reduces to 1, 8 is even.
    const out = combinationHarmony([1, 10, 2, 8]);
    expect(out.overallTone).toBe('mixed');
    expect(out.conflictCount).toBeGreaterThan(0);
    // The 1↔2 conflict shows up between PD and PM
    const oneTwo = out.pairs.find((p) => p.aReduced === 1 && p.bReduced === 2);
    expect(oneTwo?.harmony).toBe('conflict');
    // 2↔8 is same-family even — should harmonize, balancing things out
    const twoEight = out.pairs.find(
      (p) => p.aReduced === 2 && p.bReduced === 8,
    );
    expect(twoEight?.harmony).toBe('harmony');
  });

  it('all-harmonious day: 3, 6, 9 trinity', () => {
    const out = combinationHarmony([3, 6, 9]);
    expect(out.overallTone).toBe('harmonious');
    expect(out.conflictCount).toBe(0);
    expect(out.harmonyCount).toBe(3);
  });

  it('all-conflicting day: 1, 2 alone', () => {
    const out = combinationHarmony([1, 2]);
    expect(out.overallTone).toBe('conflicting');
    expect(out.conflictCount).toBe(1);
    expect(out.harmonyCount).toBe(0);
  });

  it('all-neutral day: 2, 3, 7 — mixed-family, none of the canonical pairs', () => {
    const out = combinationHarmony([2, 3, 7]);
    expect(out.overallTone).toBe('neutral');
    expect(out.conflictCount).toBe(0);
    expect(out.harmonyCount).toBe(0);
  });

  it('same-number pairs do not inflate harmonyCount', () => {
    // 5, 5, 5 — three identical digits, no pair adds info
    const out = combinationHarmony([5, 5, 5]);
    expect(out.harmonyCount).toBe(0);
    expect(out.overallTone).toBe('neutral');
  });
});
