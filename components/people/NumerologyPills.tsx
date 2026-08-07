'use client';

import { useState } from 'react';
import type { NumerologyResult } from '@/lib/numerology';
import type { Locale } from '@/lib/i18n/config';
import type { MeaningType } from '@/lib/numerology/meanings';
import { formatNumerology } from '@/lib/numerology';
import { Modal } from '@/components/layout/Modal';
import { renderInlineMd } from '@/components/qa/inlineMd';
import { CompoundReduced } from '@/components/numerology/CompoundReduced';

interface Pill {
  key: string;
  /** Short label — SHORT (2-3 chars) e.g. "LP", "EX", "SU", "P", "BD". */
  short: string;
  /** Full label for the modal header ("Life Path"). */
  full: string;
  /** Numerology result — the pill shows the reduced digit (+ master badge
   *  if applicable); the modal shows the full compound/reduced form. */
  result: NumerologyResult;
  /** Type key for the meaning-lookup fallback text in the modal. */
  type: MeaningType;
  /** Deterministic general meaning of the number for this type. */
  meaning: string | null;
}

interface Props {
  pills: readonly Pill[];
  locale: Locale;
  comingSoonLabel: string;
}

/**
 * Compact horizontal row of numerology pills — one per core number
 * (Life Path, Expression, Soul Urge, Personality, Birthday). Sits inside
 * the identity hero on the Person detail page so the person's "shape"
 * is visible above the fold; tapping a pill opens the same modal the
 * detailed NumberCard uses. Pattern mirrors the placement rows in the
 * Zodiak card — surface the number, tap for the meaning.
 */
export function NumerologyPills({ pills, locale, comingSoonLabel }: Props) {
  const [active, setActive] = useState<Pill | null>(null);

  return (
    <>
      <div
        className="scroll-px-1 flex snap-x snap-mandatory gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="group"
        aria-label="Numerologi inti"
      >
        {pills.map((pill) => {
          const text = formatNumerology(pill.result);
          return (
            <button
              key={pill.key}
              type="button"
              onClick={() => setActive(pill)}
              className={`press-soft snap-start shrink-0 rounded-full border px-2.5 py-1 transition-colors ${
                pill.result.isMaster
                  ? 'border-primary/40 bg-primary/10 hover:bg-primary/15'
                  : 'border-border bg-white/60 hover:bg-white/80 dark:bg-neutral-900/40 dark:hover:bg-neutral-900/60'
              }`}
            >
              <span
                className={`text-[9px] font-semibold uppercase tracking-[0.16em] ${
                  pill.result.isMaster ? 'text-primary/80' : 'text-muted-foreground'
                }`}
              >
                {pill.short}
              </span>{' '}
              <span
                className={`font-mono text-sm font-semibold tabular-nums ${
                  pill.result.isMaster ? 'text-primary' : 'text-foreground'
                }`}
              >
                {text}
              </span>
            </button>
          );
        })}
      </div>

      <Modal
        open={active !== null}
        onClose={() => setActive(null)}
        title={
          active ? (
            <h3 className="font-serif text-2xl font-semibold tracking-tight">
              {active.full}
            </h3>
          ) : (
            ''
          )
        }
      >
        {active ? (
          <div className="space-y-4">
            <CompoundReduced result={active.result} locale={locale} size="lg" />
            {active.meaning ? (
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-200">
                {renderInlineMd(active.meaning)}
              </p>
            ) : (
              <p className="text-muted-foreground text-sm italic">{comingSoonLabel}</p>
            )}
          </div>
        ) : null}
      </Modal>
    </>
  );
}
