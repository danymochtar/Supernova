import { describe, expect, it } from 'vitest';

/**
 * The cache-invalidation gate in `lib/ai/dailyReading.ts:~92` looks for
 * the new WN-voice `→ {domain}: …` closing-format marker. This test
 * pins that regex independently so a future tweak to the format
 * (changing the arrow, the domain set, or the colon spacing) can't
 * silently regress and leave users staring at stale readings.
 *
 * Keep this regex in sync with `dailyReading.ts`.
 */
const FRESH_MARKER = /^→\s*(?:money|career|love|social|self)\s*:/im;

const NEW_BODY = `# Step Up Boldly

Hi Test, today feels like a fresh wind.

Some prose here, woven with imagery.

More prose with practical advice.

Today's affirmation.

→ money: Send the pitch you've been polishing
→ career: Promote your work to one new person today
→ love: Say the thing you've been hinting at

~ Awareness: Your edges are sharper today.`;

const LEGACY_BODY = `# Old Title

Hi Test, today feels light.

Some prose here.

Another paragraph.

Today's affirmation.

+ Lucky for creative pitch
+ Good for journaling on direction
- Skip transactional talks
- Avoid fragile deep dives`;

describe('daily-reading cache invalidation', () => {
  it('treats new WN-voice format bodies as fresh', () => {
    expect(FRESH_MARKER.test(NEW_BODY)).toBe(true);
  });

  it('treats legacy +/- vibe-bullet bodies as stale (forces regeneration)', () => {
    expect(FRESH_MARKER.test(LEGACY_BODY)).toBe(false);
  });

  it('accepts the closing format regardless of which domain appears first', () => {
    const careerFirst = NEW_BODY.replace(
      '→ money: Send the pitch',
      '→ career: Promote your work',
    );
    expect(FRESH_MARKER.test(careerFirst)).toBe(true);
  });

  it('rejects bodies missing the closing format entirely (prose-only)', () => {
    const proseOnly = `# Title

Just a greeting.

A paragraph with no actions.

An affirmation but no closing list.`;
    expect(FRESH_MARKER.test(proseOnly)).toBe(false);
  });

  it('rejects malformed action lines (wrong arrow, unknown domain)', () => {
    expect(FRESH_MARKER.test('-> money: foo')).toBe(false); // ASCII arrow
    expect(FRESH_MARKER.test('→ work: do thing')).toBe(false); // unknown domain
    expect(FRESH_MARKER.test('* money: do thing')).toBe(false);
  });
});
