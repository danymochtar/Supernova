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

interface Labels {
  /** Section heading (e.g. "Zodiak"). */
  sectionTitle: string;
  /** Row labels. */
  sun: string;
  moon: string;
  rising: string;
  /** Modal section heading for the In Love riff. */
  inLove: string;
  /** Modal section heading for element + modality summary. */
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
 * Optional supplementary section on the Person detail page. The Sun row
 * always renders (derived from DOB); Moon and Rising render only when
 * the user has entered them — otherwise the row is replaced with a
 * gentle hint linking back to the edit page.
 */
export function ZodiacSection({ dob, moonSign, risingSign, locale, labels }: Props) {
  const [active, setActive] = useState<{
    label: string;
    sign: ZodiacSign;
  } | null>(null);

  const sun = sunSignFromDob(dob);
  const rows: Array<{ label: string; sign: ZodiacSign | null }> = [
    { label: labels.sun, sign: sun },
    { label: labels.moon, sign: moonSign },
    { label: labels.rising, sign: risingSign },
  ];

  return (
    <>
      <section className="border-border space-y-3 rounded-2xl border bg-surface-1 p-4">
        <h2 className="text-sm font-semibold">{labels.sectionTitle}</h2>
        <ul className="space-y-1.5">
          {rows.map((row) => (
            <li key={row.label}>
              {row.sign ? (
                <button
                  type="button"
                  onClick={() => setActive({ label: row.label, sign: row.sign! })}
                  className="press-soft hover:bg-surface-2 flex w-full items-center gap-3 rounded-xl bg-surface-2/40 px-3 py-2.5 text-left transition-colors"
                >
                  <span className="font-serif text-2xl">{GLYPH[row.sign]}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
                      {row.label}
                    </p>
                    <p className="text-sm font-medium capitalize">
                      {labels.signNames[row.sign]}
                    </p>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {zodiacMeaning(row.sign, locale).keyword}
                  </span>
                </button>
              ) : (
                <div className="border-border/60 flex items-center gap-3 rounded-xl border border-dashed px-3 py-2.5">
                  <span className="text-muted-foreground/60 font-serif text-2xl">·</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
                      {row.label}
                    </p>
                    <p className="text-muted-foreground text-xs italic">
                      {labels.missingHint}
                    </p>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
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
