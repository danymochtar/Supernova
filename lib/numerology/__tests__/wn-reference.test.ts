import { describe, expect, it } from 'vitest';
import { buildCoreProfile } from '../profile';
import { bridges } from '../bridge';
import { activeSlots, pinnacleAt, challengeAt, cycleAt } from '../cycles';
import { personalCycles } from '../personal';
import { WN_DANY } from '../../../tests/fixtures/wn-dany';

/**
 * Pins our engine against Hans Decoz's World Numerology output for one
 * canonical fixture. If you ever change how letters are summed, masters
 * preserved, or pinnacle/cycle math is done, this test catches the
 * regression. See `tests/fixtures/wn-dany.ts` for the raw values + their
 * source PDF pages.
 */
describe('WN reference — Dany Mochtar (17 May 1995)', () => {
  const core = buildCoreProfile(WN_DANY.birthName, WN_DANY.dob);

  it('Life Path = 19/10/1', () => {
    expect(core.lifePath.compound).toBe(WN_DANY.lifePath.compound);
    expect(core.lifePath.reduced).toBe(WN_DANY.lifePath.reduced);
  });

  it('Expression = 41/5 (per-name-part reduction, preserving masters in subtotals)', () => {
    expect(core.expression.compound).toBe(WN_DANY.expression.compound);
    expect(core.expression.reduced).toBe(WN_DANY.expression.reduced);
  });

  it("Soul Urge (Heart's Desire) = 15/6", () => {
    expect(core.soulUrge.compound).toBe(WN_DANY.soulUrge.compound);
    expect(core.soulUrge.reduced).toBe(WN_DANY.soulUrge.reduced);
  });

  it('Personality = 17/8', () => {
    expect(core.personality.compound).toBe(WN_DANY.personality.compound);
    expect(core.personality.reduced).toBe(WN_DANY.personality.reduced);
  });

  it('Birthday = 17/8', () => {
    expect(core.birthday.compound).toBe(WN_DANY.birthday.compound);
    expect(core.birthday.reduced).toBe(WN_DANY.birthday.reduced);
  });

  it('Karmic Lessons = [] (all 1-9 present)', () => {
    expect(core.karmicLessons).toEqual(WN_DANY.karmicLessons);
  });

  it('Period Cycles = 5 / 8 / 6', () => {
    const c1 = cycleAt(core.periodCycles, 1);
    const c2 = cycleAt(core.periodCycles, 2);
    const c3 = cycleAt(core.periodCycles, 3);
    expect(c1.reduced).toBe(WN_DANY.periodCycles.first.reduced);
    expect(c2.reduced).toBe(WN_DANY.periodCycles.second.reduced);
    expect(c3.reduced).toBe(WN_DANY.periodCycles.third.reduced);
  });

  it('Pinnacles = 4 / 5 / 9 / 11 (master preserved at slot 4)', () => {
    expect(pinnacleAt(core.pinnacles, 1).reduced).toBe(WN_DANY.pinnacles.first);
    expect(pinnacleAt(core.pinnacles, 2).reduced).toBe(WN_DANY.pinnacles.second);
    expect(pinnacleAt(core.pinnacles, 3).reduced).toBe(WN_DANY.pinnacles.third);
    const p4 = pinnacleAt(core.pinnacles, 4);
    expect(p4.reduced).toBe(WN_DANY.pinnacles.fourth);
    expect(p4.isMaster).toBe(true);
  });

  it('Challenges = 3 / 2 / 1 / 1', () => {
    expect(challengeAt(core.challenges, 1).reduced).toBe(WN_DANY.challenges.first);
    expect(challengeAt(core.challenges, 2).reduced).toBe(WN_DANY.challenges.second);
    expect(challengeAt(core.challenges, 3).reduced).toBe(WN_DANY.challenges.third);
    expect(challengeAt(core.challenges, 4).reduced).toBe(WN_DANY.challenges.fourth);
  });

  it('First Pinnacle ends at age 35 (36 − reducedLifePath)', () => {
    // Active slots at age 35 — boundary should flip to slot 2.
    const slotsAt34 = activeSlots(WN_DANY.dob, 34);
    const slotsAt35 = activeSlots(WN_DANY.dob, 35);
    expect(slotsAt34.pinnacle).toBe(1);
    expect(slotsAt35.pinnacle).toBe(2);
  });

  it('Bridges = 4 (LP↔Expr) / 2 (SU↔Pers) / 7 (LP↔Birthday)', () => {
    const b = bridges({
      lifePath: core.lifePath,
      expression: core.expression,
      soulUrge: core.soulUrge,
      personality: core.personality,
      birthday: core.birthday,
    });
    expect(b.lifePathExpression.reduced).toBe(WN_DANY.bridges.lifePathExpression);
    expect(b.soulUrgePersonality.reduced).toBe(WN_DANY.bridges.soulUrgePersonality);
    expect(b.lifePathBirthday.reduced).toBe(WN_DANY.bridges.lifePathBirthday);
  });

  it('Personal Year 2026 = 5; PM June 2026 = 2', () => {
    const cycles = personalCycles(WN_DANY.dob, { year: 2026, month: 6, day: 1 });
    expect(cycles.personalYear.reduced).toBe(WN_DANY.personalYear2026);
    expect(cycles.personalMonth.reduced).toBe(WN_DANY.personalMonths2026[6]);
  });
});
