import { describe, expect, it } from 'vitest';
import { dailyIntent, type DailyIntent } from '../dailyIntents';
import { LOCALE_CODES } from '@/lib/i18n/locales';

const REQUIRED_FIELDS: Array<keyof DailyIntent> = [
  'keywords',
  'posture',
  'money',
  'career',
  'love',
  'social',
  'self',
  'watch_out',
];

const ALL_KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33] as const;

describe('dailyIntent', () => {
  it('returns the full intent shape for each single digit in every shipped locale', () => {
    for (const locale of LOCALE_CODES) {
      for (const digit of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
        const intent = dailyIntent(digit, locale);
        expect(intent, `${locale} digit ${digit}`).not.toBeNull();
        for (const field of REQUIRED_FIELDS) {
          expect(intent![field], `${locale} digit ${digit} field ${field}`).toBeTruthy();
        }
        expect(Array.isArray(intent!.keywords)).toBe(true);
        expect(intent!.keywords.length).toBeGreaterThan(0);
      }
    }
  });

  it('returns master-specific entries for 11 / 22 / 33 (not the reduced form)', () => {
    for (const locale of LOCALE_CODES) {
      const master = dailyIntent(11, locale);
      const reducedTwo = dailyIntent(2, locale);
      expect(master).not.toBeNull();
      expect(reducedTwo).not.toBeNull();
      // The master pack must be a distinct entry from the reduced digit it
      // would collapse to — otherwise the master flavor is being lost.
      expect(master!.posture).not.toBe(reducedTwo!.posture);

      const master22 = dailyIntent(22, locale);
      const reducedFour = dailyIntent(4, locale);
      expect(master22!.posture).not.toBe(reducedFour!.posture);

      const master33 = dailyIntent(33, locale);
      const reducedSix = dailyIntent(6, locale);
      expect(master33!.posture).not.toBe(reducedSix!.posture);
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
    // Cast through unknown so we can pass a locale that isn't in the union
    // — we want to assert the runtime fallback behaviour explicitly.
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
