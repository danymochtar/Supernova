import { describe, expect, it } from 'vitest';
import { buildUserPrompt, type DailyPromptInput } from '../daily';
import type { NumerologyResult } from '@/lib/numerology';

function n(value: number, opts: { master?: boolean; karmic?: 13 | 14 | 16 | 19 } = {}): NumerologyResult {
  const isMaster = opts.master ?? false;
  return {
    compound: value,
    reduced: isMaster ? (value === 11 ? 2 : value === 22 ? 4 : 6) : value,
    isMaster,
    ...(opts.karmic ? { karmicDebt: opts.karmic } : {}),
  };
}

const BASE: DailyPromptInput = {
  locale: 'en',
  fullName: 'Test User',
  firstName: 'Test',
  todayLocal: { year: 2026, month: 6, day: 23, weekday: 'Tuesday' },
  age: 30,
  dayTitle: 'A 5 Day',
  personalYearBirthdayAnchored: n(7),
  core: {
    lifePath: n(3),
    expression: n(4),
    soulUrge: n(6),
    personality: n(7),
    birthday: n(5),
  },
  cycles: {
    personalYear: n(1),
    personalMonth: n(7),
    personalDay: n(5),
  },
  active: {
    pinnacle: { slot: 2, result: n(8) },
    challenge: { slot: 2, result: n(1) },
    cycle: { slot: 2, result: n(9) },
  },
  karmicLessons: [4, 7],
};

describe('buildUserPrompt — intent blocks', () => {
  it('splices personalDay + personalMonth intent blocks with the correct digits', () => {
    const out = buildUserPrompt(BASE);
    expect(out).toContain('<intent kind="personalDay" digit="5">');
    expect(out).toContain('<intent kind="personalMonth" digit="7">');
  });

  it('includes all required intent fields per block in the en locale', () => {
    const out = buildUserPrompt(BASE);
    const day = out.split('<intent kind="personalDay"')[1]!.split('</intent>')[0]!;
    expect(day).toMatch(/keywords:.+/);
    expect(day).toMatch(/posture:.+/);
    expect(day).toMatch(/money:.+/);
    expect(day).toMatch(/career:.+/);
    expect(day).toMatch(/love:.+/);
    expect(day).toMatch(/social:.+/);
    expect(day).toMatch(/self:.+/);
    expect(day).toMatch(/watch_out:.+/);
  });

  it('uses the master compound for master personalDay (11 -> intent 11, not 2)', () => {
    const masterDay = { ...BASE, cycles: { ...BASE.cycles, personalDay: n(11, { master: true }) } };
    const out = buildUserPrompt(masterDay);
    expect(out).toContain('<intent kind="personalDay" digit="11">');
    expect(out).not.toContain('<intent kind="personalDay" digit="2">');
  });

  it('uses the master compound for master personalMonth (22 -> intent 22, not 4)', () => {
    const masterMonth = { ...BASE, cycles: { ...BASE.cycles, personalMonth: n(22, { master: true }) } };
    const out = buildUserPrompt(masterMonth);
    expect(out).toContain('<intent kind="personalMonth" digit="22">');
    expect(out).not.toContain('<intent kind="personalMonth" digit="4">');
  });

  it('switches locale content (ja pack contains Japanese script, en does not)', () => {
    const en = buildUserPrompt(BASE);
    const ja = buildUserPrompt({ ...BASE, locale: 'ja' });
    // Hiragana/katakana presence proves ja-locale content loaded.
    expect(/[぀-ヿ]/.test(ja)).toBe(true);
    expect(/[぀-ヿ]/.test(en)).toBe(false);
  });

  it('keeps the existing prompt contract (profile, harmony, write instruction)', () => {
    const out = buildUserPrompt(BASE);
    expect(out).toContain('<profile>');
    expect(out).toContain('<harmony>');
    expect(out).toContain('Write the reading for 2026-06-23.');
  });

  it('intent blocks appear after the harmony block', () => {
    const out = buildUserPrompt(BASE);
    const harmonyIdx = out.indexOf('</harmony>');
    const intentIdx = out.indexOf('<intent kind="personalDay"');
    expect(harmonyIdx).toBeGreaterThan(-1);
    expect(intentIdx).toBeGreaterThan(harmonyIdx);
  });
});
