'use client';

import { useState } from 'react';
import { Modal } from '@/components/layout/Modal';
import {
  GLYPH,
  sunSignFromDob,
  zodiacMeaning,
  type ZodiacSign,
} from '@/lib/zodiac';
import type { Locale } from '@/lib/i18n/config';
import type { BirthDate } from '@/lib/numerology/types';

type PlacementKey = 'sun' | 'moon' | 'rising';

interface Labels {
  /** Section heading (e.g. "Zodiak Sabri"). */
  sectionTitle: string;
  /** Row labels — the "SUN" / "MOON" / "RISING" chips. */
  sun: string;
  moon: string;
  rising: string;
  /** Role headings — "what this placement means about you". Displayed
   *  as the bold heading under the label chip, mirroring the Tinder
   *  Astrology "About You" pattern. */
  sunRole: string;
  moonRole: string;
  risingRole: string;
  /** Modal section headings. */
  inLove: string;
  classification: string;
  /** Hint shown when moon or rising hasn't been entered. */
  missingHint: string;
  /** Localized name per sign id. Pre-computed on the server because this
   *  component is `'use client'` — function props can't cross the
   *  server→client boundary in Next.js 14 (they aren't serializable). */
  signNames: Record<ZodiacSign, string>;
}

interface Props {
  dob: BirthDate;
  moonSign: ZodiacSign | null;
  risingSign: ZodiacSign | null;
  locale: Locale;
  labels: Labels;
}

/**
 * Per-placement decorative token — emoji + label tint colour. Modeled on
 * Tinder Astrology's About You card: warm sun, cool moon, pastel cloud
 * for the rising. Small colored label + big serif heading + body.
 */
const PLACEMENT_TOKENS: Record<
  PlacementKey,
  { emoji: string; label: string; tint: string }
> = {
  sun: { emoji: '☀️', label: 'sun', tint: 'text-amber-600 dark:text-amber-300' },
  moon: {
    emoji: '🌙',
    label: 'moon',
    tint: 'text-indigo-600 dark:text-indigo-300',
  },
  rising: {
    emoji: '✨',
    label: 'rising',
    tint: 'text-rose-600 dark:text-rose-300',
  },
};

/**
 * Editorial-style zodiac card on the Person detail page — modeled on
 * Tinder Astrology's "About You" screen. Each of the three placements
 * (Sun / Moon / Rising) renders as a hero row: decorative emoji on the
 * left, small colored label with the sign name + glyph, bold serif
 * heading giving the placement's role in the person's chart (e.g.
 * "Kepribadian inti"), then a body paragraph pulled from the zodiac
 * meanings pack. Tap the row → modal with the full essence + in-love
 * riff.
 *
 * Sun is always shown (derived from DOB). Moon and Rising render only
 * when the user has entered them — otherwise the row shows the role
 * heading dimmed with a hint that points back to the profile edit page.
 */
export function ZodiacSection({ dob, moonSign, risingSign, locale, labels }: Props) {
  const [active, setActive] = useState<{
    label: string;
    sign: ZodiacSign;
  } | null>(null);

  const sun = sunSignFromDob(dob);
  const rows: Array<{
    key: PlacementKey;
    label: string;
    role: string;
    sign: ZodiacSign | null;
  }> = [
    { key: 'sun', label: labels.sun, role: labels.sunRole, sign: sun },
    { key: 'moon', label: labels.moon, role: labels.moonRole, sign: moonSign },
    {
      key: 'rising',
      label: labels.rising,
      role: labels.risingRole,
      sign: risingSign,
    },
  ];

  return (
    <>
      <section className="border-border rounded-3xl border bg-gradient-to-br from-white via-white to-amber-50/40 px-5 py-6 shadow-sm dark:from-neutral-950 dark:via-neutral-950 dark:to-indigo-950/30">
        <h2 className="font-serif text-2xl font-semibold tracking-tight">
          {labels.sectionTitle}
        </h2>

        <div className="mt-5 space-y-6">
          {rows.map((row) => {
            const tokens = PLACEMENT_TOKENS[row.key];
            if (!row.sign) {
              return (
                <EmptyPlacement
                  key={row.key}
                  emoji={tokens.emoji}
                  label={row.label}
                  role={row.role}
                  missingHint={labels.missingHint}
                />
              );
            }
            const meaning = zodiacMeaning(row.sign, locale);
            return (
              <FilledPlacement
                key={row.key}
                emoji={tokens.emoji}
                label={row.label}
                labelTint={tokens.tint}
                signName={labels.signNames[row.sign]}
                glyph={GLYPH[row.sign]}
                heading={row.role}
                bodyKeyword={meaning.keyword}
                bodyEssence={meaning.essence}
                onOpen={() => setActive({ label: row.label, sign: row.sign! })}
              />
            );
          })}
        </div>
      </section>

      <Modal
        open={active !== null}
        onClose={() => setActive(null)}
        title={
          active ? (
            <h3 className="font-serif text-xl font-semibold tracking-tight capitalize">
              {labels.signNames[active.sign]}
            </h3>
          ) : (
            ''
          )
        }
      >
        {active ? <ZodiacDetail sign={active.sign} locale={locale} labels={labels} /> : null}
      </Modal>
    </>
  );
}

function FilledPlacement({
  emoji,
  label,
  labelTint,
  signName,
  glyph,
  heading,
  bodyKeyword,
  bodyEssence,
  onOpen,
}: {
  emoji: string;
  label: string;
  labelTint: string;
  signName: string;
  glyph: string;
  heading: string;
  bodyKeyword: string;
  bodyEssence: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="press-soft group flex w-full items-start gap-4 text-left transition-opacity hover:opacity-90"
    >
      <span
        className="text-[40px] leading-none select-none"
        aria-hidden
      >
        {emoji}
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <p
          className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] ${labelTint}`}
        >
          <span>{label}</span>
          <span className="text-muted-foreground/60">·</span>
          <span className="capitalize">{signName}</span>
          <span className="font-serif text-[13px] leading-none">{glyph}</span>
        </p>
        <h3 className="font-serif text-[19px] font-semibold leading-snug tracking-tight">
          {heading}
        </h3>
        <p className="text-muted-foreground text-[13px] leading-relaxed">
          <span className="text-foreground font-medium">{bodyKeyword}.</span>{' '}
          {bodyEssence}
        </p>
      </div>
    </button>
  );
}

function EmptyPlacement({
  emoji,
  label,
  role,
  missingHint,
}: {
  emoji: string;
  label: string;
  role: string;
  missingHint: string;
}) {
  return (
    <div className="flex w-full items-start gap-4 opacity-55">
      <span
        className="text-[40px] leading-none select-none grayscale"
        aria-hidden
      >
        {emoji}
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.18em]">
          {label}
        </p>
        <h3 className="text-muted-foreground font-serif text-[19px] font-semibold leading-snug tracking-tight">
          {role}
        </h3>
        <p className="text-muted-foreground text-[13px] italic leading-relaxed">
          {missingHint}
        </p>
      </div>
    </div>
  );
}

function ZodiacDetail({
  sign,
  locale,
  labels,
}: {
  sign: ZodiacSign;
  locale: Locale;
  labels: Labels;
}) {
  const m = zodiacMeaning(sign, locale);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="font-serif text-4xl">{GLYPH[sign]}</span>
        <div>
          <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
            {labels.classification}
          </p>
          <p className="text-sm">{m.element} · {m.modality}</p>
        </div>
      </div>
      <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
        {m.essence}
      </p>
      <div className="space-y-1">
        <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
          {labels.inLove}
        </p>
        <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/85">
          {m.inLove}
        </p>
      </div>
    </div>
  );
}
