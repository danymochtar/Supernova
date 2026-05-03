import { describe, expect, it } from 'vitest';
import { lifePath } from '../core';
import { referenceProfiles } from '../../../tests/fixtures/profiles';

describe('lifePath', () => {
  for (const profile of referenceProfiles) {
    it(profile.label, () => {
      const result = lifePath(profile.dob);
      expect(result.compound).toBe(profile.expected.lifePath.compound);
      expect(result.reduced).toBe(profile.expected.lifePath.reduced);
      if (profile.expected.lifePath.karmicDebt !== undefined) {
        expect(result.karmicDebt).toBe(profile.expected.lifePath.karmicDebt);
      } else {
        expect(result.karmicDebt).toBeUndefined();
      }
    });
  }
});
