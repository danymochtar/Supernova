import { describe, expect, it } from 'vitest';
import { minorNumbers } from '../minor';
import { expression, personality, soulUrge } from '../core';

describe('Minor Numbers', () => {
  it('returns null for empty / whitespace / non-letter nicknames', () => {
    expect(minorNumbers(null)).toBeNull();
    expect(minorNumbers(undefined)).toBeNull();
    expect(minorNumbers('')).toBeNull();
    expect(minorNumbers('   ')).toBeNull();
    expect(minorNumbers('123')).toBeNull();
  });

  it('matches the full-name formulas applied to the nickname string', () => {
    const nick = 'Dany';
    const m = minorNumbers(nick);
    expect(m).not.toBeNull();
    expect(m!.minorExpression).toEqual(expression(nick));
    expect(m!.minorSoulUrge).toEqual(soulUrge(nick));
    expect(m!.minorPersonality).toEqual(personality(nick));
    expect(m!.source).toBe('Dany');
  });

  it('trims whitespace from the source', () => {
    expect(minorNumbers('  Noufal  ')!.source).toBe('Noufal');
  });
});
