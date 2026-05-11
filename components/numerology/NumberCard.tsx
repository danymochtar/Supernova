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
  /** Type key for meaning lookup. Omit to disable click-to-expand. */
  type?: MeaningType;
  meaning?: string | null;
  comingSoonLabel?: string;
}

export function NumberCard({
  label,
  hint,
  result,
  locale = 'id',
  type,
  meaning,
  comingSoonLabel = 'Detailed description coming soon.',
}: Props) {
  const [open, setOpen] = useState(false);
  const explainable = type !== undefined;

  const inner = (
    <>
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{label}</p>
      <div className="mt-2">
        <CompoundReduced result={result} locale={locale} size="lg" />
      </div>
      {hint ? <p className="text-muted-foreground mt-1 text-xs">{hint}</p> : null}
    </>
  );

  if (!explainable) {
    return (
      <div className="border-border rounded-xl border bg-surface-1 p-4">
        {inner}
      </div>
    );
  }

  return (
    <div
      className={`border-border press-soft overflow-hidden rounded-xl border bg-surface-1 transition-colors ${
        open ? 'ring-primary/30 ring-1' : 'hover:bg-surface-2'
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full p-4 text-left"
      >
        {inner}
      </button>
      {open ? (
        <div className="border-border border-t px-4 py-3 text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
          {meaning ?? <span className="text-muted-foreground italic">{comingSoonLabel}</span>}
        </div>
      ) : null}
    </div>
  );
}
