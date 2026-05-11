import { describe, expect, it } from 'vitest';
import { sanitizeNamePart } from '../sanitizeName';

describe('sanitizeNamePart', () => {
  it('passes a plain name through unchanged', () => {
    const r = sanitizeNamePart('Sabri');
    expect(r.cleaned).toBe('Sabri');
    expect(r.stripped).toEqual([]);
  });

  it('strips English titles (Dr., Mr., Prof.)', () => {
    expect(sanitizeNamePart('Dr. Sabri').cleaned).toBe('Sabri');
    expect(sanitizeNamePart('Mr Anwar').cleaned).toBe('Anwar');
    expect(sanitizeNamePart('Prof. Habibie').cleaned).toBe('Habibie');
  });

  it('strips English post-nominals (Jr., Sr., III)', () => {
    expect(sanitizeNamePart('Henry Smith Jr.').cleaned).toBe('Henry Smith');
    expect(sanitizeNamePart('William III').cleaned).toBe('William');
  });

  it('strips Indonesian degree titles (Drs., Ir., Hj., S.H., S.E.)', () => {
    expect(sanitizeNamePart('Drs. Soekarno').cleaned).toBe('Soekarno');
    expect(sanitizeNamePart('Ir. Joko Widodo').cleaned).toBe('Joko Widodo');
    expect(sanitizeNamePart('Hj. Megawati').cleaned).toBe('Megawati');
    expect(sanitizeNamePart('Sabri Basri, S.H.').cleaned).toBe('Sabri Basri,');
    expect(sanitizeNamePart('Anwar S.E.').cleaned).toBe('Anwar');
  });

  it('strips stacked titles', () => {
    const r = sanitizeNamePart('Dr. Drs. Hj. Sabri Bin Basri');
    expect(r.cleaned).toBe('Sabri Bin Basri');
    expect(r.stripped.length).toBe(3);
  });

  it('keeps patronymic particles (bin, binti, von, de, Mc)', () => {
    expect(sanitizeNamePart('Sabri Bin Basri').cleaned).toBe('Sabri Bin Basri');
    expect(sanitizeNamePart('Megawati Binti Sukarno').cleaned).toBe('Megawati Binti Sukarno');
    expect(sanitizeNamePart('Ludwig van Beethoven').cleaned).toBe('Ludwig van Beethoven');
    expect(sanitizeNamePart('John McGovern').cleaned).toBe('John McGovern');
  });

  it('returns the stripped list in input order', () => {
    const r = sanitizeNamePart('Dr. Hj. Sabri S.H.');
    expect(r.stripped).toEqual(['Dr.', 'Hj.', 'S.H.']);
  });

  it('collapses whitespace introduced by removal', () => {
    expect(sanitizeNamePart('Dr.   Sabri').cleaned).toBe('Sabri');
    expect(sanitizeNamePart('Sabri    III').cleaned).toBe('Sabri');
  });

  it('does not strip embedded letters inside larger words', () => {
    // "Hindrasari" contains "Hjj" pattern only if we mis-anchor — verify no
    // accidental matching of "dr" inside it.
    expect(sanitizeNamePart('Hindrasari').cleaned).toBe('Hindrasari');
    expect(sanitizeNamePart('Drsila').cleaned).toBe('Drsila');
  });

  it('returns empty string when input is all honorifics', () => {
    const r = sanitizeNamePart('Dr. Hj.');
    expect(r.cleaned).toBe('');
    expect(r.stripped).toEqual(['Dr.', 'Hj.']);
  });
});
