import { describe, expect, it } from 'vitest';
import { expression, personality, soulUrge } from '../core';
import { sanitizeNamePart } from '../../profile/sanitizeName';
import { internationalProfiles } from '../../../tests/fixtures/internationalProfiles';
import type { ExpectedNumber } from '../../../tests/fixtures/profiles';

function expectMatches(actual: ReturnType<typeof expression>, expected: ExpectedNumber, label: string) {
  expect(actual.compound, `${label} compound`).toBe(expected.compound);
  expect(actual.reduced, `${label} reduced`).toBe(expected.reduced);
  if (expected.isMaster) expect(actual.isMaster, `${label} isMaster`).toBe(true);
  if (expected.karmicDebt !== undefined) {
    expect(actual.karmicDebt, `${label} karmicDebt`).toBe(expected.karmicDebt);
  }
}

describe('international name fixtures (Pythagorean engine)', () => {
  for (const profile of internationalProfiles) {
    describe(profile.label, () => {
      it('expression matches hand-computed', () => {
        expectMatches(expression(profile.fullName), profile.expected.expression, 'expression');
      });
      it('soulUrge matches hand-computed', () => {
        expectMatches(soulUrge(profile.fullName), profile.expected.soulUrge, 'soulUrge');
      });
      it('personality matches hand-computed', () => {
        expectMatches(personality(profile.fullName), profile.expected.personality, 'personality');
      });

      if (profile.equivalentFullName) {
        it(`reads identically to ${profile.equivalentFullName} after Goodwin cap`, () => {
          expect(expression(profile.fullName).compound).toBe(
            expression(profile.equivalentFullName!).compound,
          );
          expect(soulUrge(profile.fullName).compound).toBe(
            soulUrge(profile.equivalentFullName!).compound,
          );
          expect(personality(profile.fullName).compound).toBe(
            personality(profile.equivalentFullName!).compound,
          );
        });
      }
    });
  }

  // Honorific-strip end-to-end: a name preceded by titles should sanitize down
  // to the plain Malay patronymic and read exactly the same.
  describe('honorific stripping pipeline', () => {
    it('Dr. Sabri Bin Basri reads as Sabri Bin Basri', () => {
      const cleaned = sanitizeNamePart('Dr. Sabri Bin Basri').cleaned;
      expect(cleaned).toBe('Sabri Bin Basri');
      expect(expression(cleaned).compound).toBe(60);
    });

    it('Drs. Hj. Sabri Bin Basri reads as Sabri Bin Basri', () => {
      const cleaned = sanitizeNamePart('Drs. Hj. Sabri Bin Basri').cleaned;
      expect(cleaned).toBe('Sabri Bin Basri');
      expect(expression(cleaned).compound).toBe(60);
    });
  });
});
