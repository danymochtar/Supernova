import { describe, expect, it } from 'vitest';
import { ZODIAC_SIGNS } from '../signs';
import { planetSignMeaning, shadowMeaning, transitMoonBlurb } from '../content';

describe('planet + shadow + transit content packs', () => {
  it('has Venus + Mars entries for all 12 signs in id & en', () => {
    for (const sign of ZODIAC_SIGNS) {
      for (const planet of ['venus', 'mars'] as const) {
        for (const locale of ['id', 'en'] as const) {
          const m = planetSignMeaning(planet, sign, locale);
          expect(m.keyword).toBeTruthy();
          expect(m.essence).toBeTruthy();
        }
      }
    }
  });

  it('has a shadow paragraph for every sign in id & en', () => {
    for (const sign of ZODIAC_SIGNS) {
      expect(shadowMeaning(sign, 'id')).toMatch(/./);
      expect(shadowMeaning(sign, 'en')).toMatch(/./);
    }
  });

  it('has a transit-moon blurb for every sign in id & en', () => {
    for (const sign of ZODIAC_SIGNS) {
      expect(transitMoonBlurb(sign, 'id')).toMatch(/./);
      expect(transitMoonBlurb(sign, 'en')).toMatch(/./);
    }
  });
});
