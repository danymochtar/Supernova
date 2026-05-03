'use client';

import { useState } from 'react';
import type { NumerologyResult } from '@/lib/numerology';
import type { Locale } from '@/lib/i18n/config';
import type { MeaningType } from '@/lib/numerology/meanings';
import { CompoundReduced } from './CompoundReduced';

interface Props {
  label: string;
  hint?: string;
  result: NumerologyResult;
  locale?: Locale;
  /** Type key for meaning lookup. Omit to disable the expand-to-explain affordance. */
  type?: MeaningType;
  meaning?: string | null;
  /** I18n labels for the toggle. Defaults to English if not provided. */
  expandLabel?: string;
  collapseLabel?: string;
  comingSoonLabel?: string;
}

export function NumberCard({
  label,
  hint,
  result,
  locale = 'id',
  type,
  meaning,
  expandLabel = 'What does this mean?',
  collapseLabel = 'Hide',
  comingSoonLabel = 'Detailed description coming soon.',
}: Props) {
  const [open, setOpen] = useState(false);
  const explainable = type !== undefined;

  return (
    <div className="border-border rounded-xl border bg-white/50 p-4 dark:bg-neutral-900/50">
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{label}</p>
      <div className="mt-2">
        <CompoundReduced result={result} locale={locale} size="lg" />
      </div>
      {hint ? <p className="text-muted-foreground mt-1 text-xs">{hint}</p> : null}

      {explainable ? (
        <>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="text-primary mt-3 text-xs font-medium underline-offset-4 hover:underline"
          >
            {open ? collapseLabel : expandLabel}
          </button>
          {open ? (
            <div className="border-border mt-3 border-t pt-3 text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
              {meaning ?? <span className="text-muted-foreground italic">{comingSoonLabel}</span>}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
