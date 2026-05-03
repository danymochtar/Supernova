import { describe, expect, it } from 'vitest';
import { lifePath } from '../core';
import { referenceProfiles } from '../../../tests/fixtures/profiles';

/**
 * These tests are EXPECTED TO FAIL until M1 lands `lifePath` in `core.ts`.
 * They lock the contract: month, day, year reduced separately first
 * (preserving masters at each step), then summed, then reduced.
 */
describe.skip('lifePath (M1 — implementation pending)', () => {
  for (const profile of referenceProfiles) {
    it(`matches expected for ${profile.label}`, () => {
      const result = lifePath(profile.dob);
      expect(result.compound).toBe(profile.expected.lifePath.compound);
      expect(result.reduced).toBe(profile.expected.lifePath.reduced);
      if (profile.expected.lifePath.isMaster !== undefined) {
        expect(result.isMaster).toBe(profile.expected.lifePath.isMaster);
      }
    });
  }
});
