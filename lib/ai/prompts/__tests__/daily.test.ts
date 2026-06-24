import { describe, expect, it } from 'vitest';
import { buildUserPrompt, parseReading, type DailyPromptInput } from '../daily';
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

describe('buildUserPrompt — WN-voice intent blocks', () => {
  it('splices personalDay + personalMonth intent blocks with the correct digits', () => {
    const out = buildUserPrompt(BASE);
    expect(out).toContain('<intent kind="personalDay" digit="5">');
    expect(out).toContain('<intent kind="personalMonth" digit="7">');
  });

  it('renders the new v2 schema fields (keywords, imagery, posture, per-domain CTA bullets)', () => {
    const out = buildUserPrompt(BASE);
    const day = out.split('<intent kind="personalDay"')[1]!.split('</intent>')[0]!;
    expect(day).toMatch(/keywords:.+/);
    expect(day).toMatch(/imagery:.+/);
    expect(day).toMatch(/posture:.+/);
    // Per-domain CTAs render as a label line + 2-3 sub-bullets:
    //   money:
    //     - Send the pitch you've been polishing
    //     - …
    expect(day).toMatch(/money:\n {2}- /);
    expect(day).toMatch(/career:\n {2}- /);
    expect(day).toMatch(/love:\n {2}- /);
    expect(day).toMatch(/social:\n {2}- /);
    expect(day).toMatch(/self:\n {2}- /);
    expect(day).toMatch(/watch_out:.+/);
  });

  it('uses the master compound for master personalDay (11 -> intent 11, not 2)', () => {
    const masterDay = { ...BASE, cycles: { ...BASE.cycles, personalDay: n(11, { master: true }) } };
    const out = buildUserPrompt(masterDay);
    expect(out).toContain('<intent kind="personalDay" digit="11">');
    expect(out).not.toContain('<intent kind="personalDay" digit="2">');
  });

  it('switches locale content (ja pack contains Japanese script, en does not)', () => {
    const en = buildUserPrompt(BASE);
    const ja = buildUserPrompt({ ...BASE, locale: 'ja' });
    expect(/[぀-ヿ]/.test(ja)).toBe(true);
    expect(/[぀-ヿ]/.test(en)).toBe(false);
  });

  it('keeps the existing prompt contract (profile, harmony, write instruction)', () => {
    const out = buildUserPrompt(BASE);
    expect(out).toContain('<profile>');
    expect(out).toContain('<harmony>');
    expect(out).toContain('Write the reading for 2026-06-23.');
    // The closing instruction must reference the new WN format markers,
    // not the old +/- bullets.
    expect(out).toContain('→ {domain}: {imperative}');
    expect(out).toContain('~ Awareness:');
    expect(out).not.toMatch(/3-5 `\+`\/`-` vibe/);
  });
});

describe('parseReading — new WN-voice closing format', () => {
  const NEW_FORMAT = `# Step Up Boldly

Hi Test, today feels like a fresh wind.

This is paragraph one, weaving the three threads.

This is paragraph two with the watch line embedded gently.

Today's affirmation sentence stands alone.

→ money: Send the pitch you've been polishing
→ career: Promote your work to one new person today
→ love: Say the thing you've been hinting at
→ self: Pick the option and commit

~ Awareness: Your edges are sharper today — others may feel pushed when you only mean to lead.`;

  it('extracts the title from the leading `# Title` line', () => {
    const out = parseReading(NEW_FORMAT);
    expect(out.title).toBe('Step Up Boldly');
  });

  it('parses each `→ {domain}: {text}` line into a typed action item', () => {
    const out = parseReading(NEW_FORMAT);
    expect(out.actions).toHaveLength(4);
    expect(out.actions[0]).toEqual({
      domain: 'money',
      text: "Send the pitch you've been polishing",
    });
    expect(out.actions[1]!.domain).toBe('career');
    expect(out.actions[2]!.domain).toBe('love');
    expect(out.actions[3]!.domain).toBe('self');
  });

  it('extracts the awareness line content and strips the `~ Awareness:` prefix', () => {
    const out = parseReading(NEW_FORMAT);
    expect(out.awareness).toBe(
      'Your edges are sharper today — others may feel pushed when you only mean to lead.',
    );
  });

  it('backfills `vibes` from `actions` so legacy render paths keep working', () => {
    const out = parseReading(NEW_FORMAT);
    expect(out.vibes).toHaveLength(4);
    expect(out.vibes.every((v) => v.kind === 'good')).toBe(true);
    expect(out.vibes[0]!.text).toBe("Send the pitch you've been polishing");
  });

  it('keeps the prose body and affirmation clean of action/awareness lines', () => {
    const out = parseReading(NEW_FORMAT);
    expect(out.body).not.toMatch(/→/);
    expect(out.body).not.toMatch(/~ Awareness/);
    expect(out.affirmation).toBe("Today's affirmation sentence stands alone.");
  });

  it('falls back gracefully to legacy +/- bullets for old cached readings', () => {
    const LEGACY = `# Old Title

Hi Test, today feels light.

Some prose here.

Another paragraph here.

Today's affirmation.

+ Lucky for creative pitch
- Skip transactional talks`;
    const out = parseReading(LEGACY);
    expect(out.actions).toHaveLength(0);
    expect(out.awareness).toBe('');
    expect(out.vibes).toHaveLength(2);
    expect(out.vibes[0]!.kind).toBe('good');
    expect(out.vibes[1]!.kind).toBe('skip');
  });

  it('is case-insensitive on domain tags but normalizes to lowercase', () => {
    const MIXED = `# Title

Greeting.

Para one.

Para two.

Affirmation.

→ Money: Pay the bill
→ CAREER: Promote your work
~ Awareness: Stay patient.`;
    const out = parseReading(MIXED);
    expect(out.actions[0]!.domain).toBe('money');
    expect(out.actions[1]!.domain).toBe('career');
  });
});
