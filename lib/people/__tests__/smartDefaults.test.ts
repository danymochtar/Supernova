import { describe, expect, it } from 'vitest';
import {
  JAKARTA_DEFAULT,
  KUALA_LUMPUR_DEFAULT,
  SUGGESTED_BIRTH_TIME,
  guessBirthCityFromName,
} from '../smartDefaults';

describe('SUGGESTED_BIRTH_TIME', () => {
  it('is 12:00 (noon) — the astrological unknown-birth-time convention', () => {
    expect(SUGGESTED_BIRTH_TIME).toBe('12:00');
  });
});

describe('guessBirthCityFromName — Malay Islamic particles → Kuala Lumpur', () => {
  it('matches "bin"', () => {
    expect(guessBirthCityFromName('Ahmad bin Abdullah', 'ms')).toEqual(KUALA_LUMPUR_DEFAULT);
    expect(guessBirthCityFromName('Ahmad bin Abdullah', 'id')).toEqual(KUALA_LUMPUR_DEFAULT);
    // Malay marker wins over the id-locale Indonesia fallback.
    expect(guessBirthCityFromName('Muhammad bin Ali', 'id')).toEqual(KUALA_LUMPUR_DEFAULT);
  });

  it('matches "binti" and "bt."', () => {
    expect(guessBirthCityFromName('Siti Nurhaliza binti Tarudin', 'id')).toEqual(KUALA_LUMPUR_DEFAULT);
    expect(guessBirthCityFromName('Aisyah bt. Hassan', 'en')).toEqual(KUALA_LUMPUR_DEFAULT);
  });

  it('is case-insensitive', () => {
    expect(guessBirthCityFromName('AHMAD BIN ABDULLAH', 'id')).toEqual(KUALA_LUMPUR_DEFAULT);
    expect(guessBirthCityFromName('siti BINTI hasan', 'id')).toEqual(KUALA_LUMPUR_DEFAULT);
  });

  it('does not false-positive on English names containing "bin" as a substring', () => {
    // Robin, Sabina, Rubin, etc. — no whitespace boundary before "bin".
    expect(guessBirthCityFromName('Robin Williams', 'en')).toBeNull();
    expect(guessBirthCityFromName('Sabina', 'en')).toBeNull();
    expect(guessBirthCityFromName('Benjamin Rubin', 'en')).toBeNull();
  });
});

describe('guessBirthCityFromName — Indonesian locale fallback → Jakarta', () => {
  it('when locale is id and no Malay particle → Jakarta', () => {
    expect(guessBirthCityFromName('Sabri Rahman', 'id')).toEqual(JAKARTA_DEFAULT);
    expect(guessBirthCityFromName('Dewi Kartika', 'id')).toEqual(JAKARTA_DEFAULT);
    expect(guessBirthCityFromName('Budi Susilo', 'id')).toEqual(JAKARTA_DEFAULT);
  });

  it('when locale is en and no Malay particle → null (no guess)', () => {
    expect(guessBirthCityFromName('John Smith', 'en')).toBeNull();
    expect(guessBirthCityFromName('Elena Rodriguez', 'es')).toBeNull();
    expect(guessBirthCityFromName('田中太郎', 'ja')).toBeNull();
  });
});

describe('guessBirthCityFromName — edge cases', () => {
  it('empty / whitespace → null', () => {
    expect(guessBirthCityFromName('', 'id')).toBeNull();
    expect(guessBirthCityFromName('   ', 'id')).toBeNull();
    expect(guessBirthCityFromName('\n\t', 'id')).toBeNull();
  });

  it('no locale + no Malay particle → null', () => {
    expect(guessBirthCityFromName('Sabri Rahman')).toBeNull();
    expect(guessBirthCityFromName('Anonymous Name')).toBeNull();
  });

  it('Malay particle wins even without a locale hint', () => {
    expect(guessBirthCityFromName('Ahmad bin Abdullah')).toEqual(KUALA_LUMPUR_DEFAULT);
  });
});
