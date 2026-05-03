import { describe, expect, it } from 'vitest';
import { isYVowel, yRole } from '../yVowel';

function findY(token: string): number {
  return token.toUpperCase().indexOf('Y');
}

describe('yRole — heuristic + overrides', () => {
  it('Mary — Y at end after consonant is vowel', () => {
    expect(isYVowel('Mary', 3)).toBe(true);
  });

  it('Sandy — Y at end after consonant is vowel', () => {
    expect(isYVowel('Sandy', 4)).toBe(true);
  });

  it('Dany — Y at end after consonant is vowel', () => {
    expect(isYVowel('Dany', 3)).toBe(true);
  });

  it('Bryan — Y in middle between consonants is vowel', () => {
    expect(isYVowel('Bryan', 2)).toBe(true);
  });

  it('Yvonne — Y at start before consonant is vowel (only vowel sound there)', () => {
    expect(isYVowel('Yvonne', 0)).toBe(true);
  });

  it('Yves — Y is the only vowel-eligible letter, vowel', () => {
    expect(isYVowel('Yves', 0)).toBe(true);
  });

  it('Lynn — Y is the only vowel sound (no other pure vowels), vowel', () => {
    expect(isYVowel('Lynn', 1)).toBe(true);
  });

  it('Yes — Y at start followed by pure vowel is consonant', () => {
    expect(isYVowel('Yes', 0)).toBe(false);
  });

  it('Yusuf — Y at start followed by U is consonant', () => {
    expect(isYVowel('Yusuf', 0)).toBe(false);
  });

  it('Yanti — Y at start followed by A is consonant', () => {
    expect(isYVowel('Yanti', 0)).toBe(false);
  });

  it('Yolanda — Y at start followed by O is consonant', () => {
    expect(isYVowel('Yolanda', 0)).toBe(false);
  });

  it('Hayden (no override) — Y after pure vowel is consonant (diphthong)', () => {
    expect(isYVowel('Hayden', 2)).toBe(false);
  });

  it('throws when called on non-Y position', () => {
    expect(() => yRole('Mary', 0)).toThrow();
  });

  it('finds Y position via helper', () => {
    expect(findY('Bryan')).toBe(2);
  });
});
