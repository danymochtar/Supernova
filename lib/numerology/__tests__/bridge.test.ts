import { describe, expect, it } from 'vitest';
import { bridges } from '../bridge';
import { makeResult } from '../reduce';

const result = (compound: number) => makeResult(compound);

describe('Bridge Numbers', () => {
  it('returns 0 when both numbers in a pair are identical', () => {
    const b = bridges({
      lifePath: result(5),
      expression: result(5),
      soulUrge: result(7),
      personality: result(7),
    });
    expect(b.lifePathExpression.reduced).toBe(0);
    expect(b.soulUrgePersonality.reduced).toBe(0);
  });

  it('returns absolute difference for plain single-digit pairs', () => {
    const b = bridges({
      lifePath: result(1),
      expression: result(7),
      soulUrge: result(3),
      personality: result(8),
    });
    expect(b.lifePathExpression.reduced).toBe(6); // |1 - 7|
    expect(b.soulUrgePersonality.reduced).toBe(5); // |3 - 8|
  });

  it('reduces master numbers (11→2, 22→4, 33→6) before computing the bridge', () => {
    const b = bridges({
      lifePath: result(11), // master, single-digit form is 2
      expression: result(7),
      soulUrge: result(22), // master, single-digit form is 4
      personality: result(9),
    });
    expect(b.lifePathExpression.reduced).toBe(5); // |2 - 7|
    expect(b.soulUrgePersonality.reduced).toBe(5); // |4 - 9|
  });

  it('handles karmic-debt compounds — the bridge sees their reduced form', () => {
    // Compound 14 (karmic) reduces to 5. Bridge against an Expression of 9
    // should be |5 - 9| = 4.
    const lp = result(14);
    expect(lp.karmicDebt).toBe(14);
    const b = bridges({
      lifePath: lp,
      expression: result(9),
      soulUrge: result(2),
      personality: result(2),
    });
    expect(b.lifePathExpression.reduced).toBe(4);
    expect(b.soulUrgePersonality.reduced).toBe(0);
  });

  it('largest possible bridge is 8 (|1 − 9|)', () => {
    const b = bridges({
      lifePath: result(1),
      expression: result(9),
      soulUrge: result(9),
      personality: result(1),
    });
    expect(b.lifePathExpression.reduced).toBe(8);
    expect(b.soulUrgePersonality.reduced).toBe(8);
  });
});
