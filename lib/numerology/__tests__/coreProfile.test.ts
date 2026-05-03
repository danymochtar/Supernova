import { describe, expect, it } from 'vitest';
import { birthday, expression, personality, soulUrge } from '../core';
import { karmicLessons } from '../karmic';
import { referenceProfiles, type ExpectedNumber } from '../../../tests/fixtures/profiles';

function expectMatches(actual: ReturnType<typeof expression>, expected: ExpectedNumber, label: string) {
  expect(actual.compound, `${label} compound`).toBe(expected.compound);
  expect(actual.reduced, `${label} reduced`).toBe(expected.reduced);
  if (expected.isMaster) {
    expect(actual.isMaster, `${label} isMaster`).toBe(true);
  }
  if (expected.karmicDebt !== undefined) {
    expect(actual.karmicDebt, `${label} karmicDebt`).toBe(expected.karmicDebt);
  } else {
    expect(actual.karmicDebt, `${label} no karmicDebt`).toBeUndefined();
  }
}

describe('core profile (expression / soulUrge / personality / birthday / karmicLessons)', () => {
  for (const profile of referenceProfiles) {
    describe(profile.label, () => {
      it('expression', () => {
        expectMatches(expression(profile.fullName), profile.expected.expression, 'expression');
      });
      it('soulUrge', () => {
        expectMatches(soulUrge(profile.fullName), profile.expected.soulUrge, 'soulUrge');
      });
      it('personality', () => {
        expectMatches(personality(profile.fullName), profile.expected.personality, 'personality');
      });
      it('birthday', () => {
        expectMatches(birthday(profile.dob), profile.expected.birthday, 'birthday');
      });
      it('karmicLessons', () => {
        expect(karmicLessons(profile.fullName)).toEqual(profile.expected.karmicLessons);
      });
    });
  }
});
