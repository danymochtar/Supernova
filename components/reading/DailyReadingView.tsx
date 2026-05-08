'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import { parseReading } from '@/lib/ai/prompts/daily';
import { renderInlineMd } from '@/components/qa/inlineMd';

const STAIR_COLORS = [
  'text-primary',
  'text-accent',
  'text-emerald-600 dark:text-emerald-400',
  'text-rose-500 dark:text-rose-400',
];

interface Props {
  body: string | null;
  /** Pre-localized "TUESDAY, MAY 4" style date label. */
  dateLabel: string;
  /** Pre-localized day theme name, e.g. "Take Charge". */
  dayTitle: string;
  /** WN-style "today's numbers": Personal Day reduced + compound + the compound's digits.
   * Rendered as a small staircase that doubles as the toggle button. */
  todaysNumbers?: number[];
  /** Pre-rendered Personal Day / Month / Year cards to reveal when the
   * user taps the triple. Stays mounted but hidden when collapsed so the
   * inner click-to-expand-meaning state survives. */
  numbers?: ReactNode;
  /** "Show numbers" / "Hide numbers" labels. */
  showLabel?: string;
  hideLabel?: string;
  /** UI strings (already translated). */
  labels: {
    affirmation: string;
    fallback: string;
  };
}

/**
 * Hero card for today's reading. Auto-generated server-side — there is no
 * manual generate button. The triple in the corner doubles as a tap target
 * that reveals Personal Day / Month / Year cards underneath, each of which
 * itself opens to show the meaning. Defaults closed so the page is calm.
 */
export function DailyReadingView({
  body,
  dateLabel,
  dayTitle,
  todaysNumbers,
  numbers,
  showLabel = 'Lihat angka hari ini',
  hideLabel = 'Sembunyikan angka',
  labels,
}: Props) {
  const [showNumbers, setShowNumbers] = useState(false);

  if (!body) {
    return (
      <section className="border-border rounded-3xl border bg-gradient-to-br from-primary/10 to-accent/10 p-6 text-center dark:from-primary/20 dark:to-accent/20">
        <Sparkles className="text-primary mx-auto mb-3 h-6 w-6" aria-hidden />
        <p className="text-muted-foreground text-sm">{labels.fallback}</p>
      </section>
    );
  }

  const parsed = parseReading(body);
  const paragraphs = parsed.body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const headlineTitle = parsed.title || dayTitle;

  const tripleCanToggle = Boolean(todaysNumbers && todaysNumbers.length > 0 && numbers);

  return (
    <section className="border-border overflow-hidden rounded-3xl border bg-white shadow-sm dark:bg-neutral-900">
      {tripleCanToggle ? (
        <button
          type="button"
          onClick={() => setShowNumbers((v) => !v)}
          aria-expanded={showNumbers}
          aria-label={showNumbers ? hideLabel : showLabel}
          className="press-soft flex w-full items-center justify-between gap-2 bg-gradient-to-r from-accent via-accent to-amber-300 px-5 py-3 text-left text-amber-950 transition-colors hover:from-accent/95 hover:to-amber-300/95"
        >
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {dateLabel}
          </p>
          <ChevronDown
            className={`h-4 w-4 shrink-0 transition-transform ${showNumbers ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>
      ) : (
        <div className="bg-gradient-to-r from-accent via-accent to-amber-300 px-5 py-3 text-amber-950">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {dateLabel}
          </p>
        </div>
      )}

      <div className="space-y-5 px-6 py-6 sm:px-7">
        {tripleCanToggle && showNumbers ? (
          <div className="border-border/60 -mx-6 -mt-6 border-b bg-amber-50/40 px-6 py-5 dark:bg-amber-950/10 sm:-mx-7 sm:px-7">
            {numbers}
          </div>
        ) : null}

        {headlineTitle ? (
          <div className="flex items-start justify-between gap-4">
            <h2 className="font-serif text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              {headlineTitle}
            </h2>
            {todaysNumbers && todaysNumbers.length > 0 ? (
              <div className="font-serif relative -mt-1 flex shrink-0 items-end gap-1 text-2xl font-semibold leading-none tracking-tight sm:text-3xl">
                {todaysNumbers.map((n, i) => (
                  <span
                    key={i}
                    className={STAIR_COLORS[i % STAIR_COLORS.length]}
                    style={{ transform: `translateY(${i * 0.2}rem)` }}
                  >
                    {n}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-3 text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-200">
          {parsed.greeting ? (
            <p className="text-foreground font-medium">{renderInlineMd(parsed.greeting)}</p>
          ) : null}
          {paragraphs.map((p, i) => (
            <p key={i}>{renderInlineMd(p)}</p>
          ))}
        </div>

        {parsed.affirmation ? (
          <div className="border-accent/60 border-l-[3px] bg-accent/5 px-4 py-3 dark:bg-accent/10">
            <p className="text-muted-foreground mb-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
              {labels.affirmation}
            </p>
            <p className="font-serif text-base italic leading-snug text-neutral-800 dark:text-neutral-100">
              {renderInlineMd(parsed.affirmation)}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
