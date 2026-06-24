import { describe, expect, it } from 'vitest';
import { dailyIntent, type DailyIntent } from '../dailyIntents';
import { LOCALE_CODES } from '@/lib/i18n/locales';

const STRING_FIELDS: Array<keyof DailyIntent> = ['posture', 'watch_out'];
const ARRAY_FIELDS: Array<keyof DailyIntent> = [
  'keywords',
  'imagery',
  'money',
  'career',
  'love',
  'social',
  'self',
];

const MIN_LENGTHS: Partial<Record<keyof DailyIntent, number>> = {
  keywords: 8,
  imagery: 2,
  money: 2,
  career: 2,
  love: 2,
  social: 2,
  self: 2,
};

const ALL_KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33] as const;

describe('dailyIntent', () => {
  it('returns the v2 WN-voice shape for each single digit in every shipped locale', () => {
    for (const locale of LOCALE_CODES) {
      for (const digit of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
        const intent = dailyIntent(digit, locale);
        expect(intent, `${locale} digit ${digit}`).not.toBeNull();
        for (const field of STRING_FIELDS) {
          const value = intent![field];
          expect(typeof value, `${locale} ${digit} ${field}`).toBe('string');
          expect((value as string).length, `${locale} ${digit} ${field}`).toBeGreaterThan(0);
        }
        for (const field of ARRAY_FIELDS) {
          const value = intent![field];
          expect(Array.isArray(value), `${locale} ${digit} ${field}`).toBe(true);
          const min = MIN_LENGTHS[field] ?? 1;
          expect(
            (value as string[]).length,
            `${locale} ${digit} ${field} length`,
          ).toBeGreaterThanOrEqual(min);
        }
      }
    }
  });

  it('every CTA domain string is a non-empty short imperative (no double-domain leakage)', () => {
    for (const locale of LOCALE_CODES) {
      for (const digit of ALL_KEYS) {
        const intent = dailyIntent(digit, locale);
        expect(intent).not.toBeNull();
        for (const domain of ['money', 'career', 'love', 'social', 'self'] as const) {
          for (const cta of intent![domain]) {
            expect(typeof cta).toBe('string');
            expect(cta.length).toBeGreaterThan(0);
            // Hard guard: CTAs must NOT contain the closing-format markers
            // — those belong only in the rendered prompt output, not in
            // the source content. A leaked "→" or "~ Awareness" here
            // would inject a parse-confusing bullet into the LLM context.
            expect(cta, `${locale} ${digit} ${domain} contains →`).not.toMatch(/→/);
            expect(cta, `${locale} ${digit} ${domain} contains ~ Awareness`).not.toMatch(/~\s*Awareness/i);
          }
        }
      }
    }
  });

  it('returns master-specific entries for 11 / 22 / 33 (not the reduced form)', () => {
    for (const locale of LOCALE_CODES) {
      const master11 = dailyIntent(11, locale);
      const reduced2 = dailyIntent(2, locale);
      expect(master11).not.toBeNull();
      expect(reduced2).not.toBeNull();
      expect(master11!.posture).not.toBe(reduced2!.posture);

      const master22 = dailyIntent(22, locale);
      const reduced4 = dailyIntent(4, locale);
      expect(master22!.posture).not.toBe(reduced4!.posture);

      const master33 = dailyIntent(33, locale);
      const reduced6 = dailyIntent(6, locale);
      expect(master33!.posture).not.toBe(reduced6!.posture);
    }
  });

  it('returns null for unknown digits', () => {
    expect(dailyIntent(0, 'en')).toBeNull();
    expect(dailyIntent(10, 'en')).toBeNull();
    expect(dailyIntent(12, 'en')).toBeNull();
    expect(dailyIntent(-1, 'en')).toBeNull();
    expect(dailyIntent(99, 'en')).toBeNull();
  });

  it('falls back to ID when a locale has no registered pack', () => {
    const idEntry = dailyIntent(5, 'id');
    const fallback = dailyIntent(5, 'xx' as unknown as 'id');
    expect(fallback).not.toBeNull();
    expect(fallback!.posture).toBe(idEntry!.posture);
  });

  it('every shipped locale covers all 12 keys (1-9 + 11, 22, 33)', () => {
    for (const locale of LOCALE_CODES) {
      for (const key of ALL_KEYS) {
        expect(dailyIntent(key, locale), `${locale} key ${key}`).not.toBeNull();
      }
    }
  });
});
