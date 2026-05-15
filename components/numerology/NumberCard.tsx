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
  /** Tighter padding + smaller number; used when the card sits in a
   * multi-column row on mobile (Minor + Bridge sections). */
  compact?: boolean;
}

export function NumberCard({
  label,
  hint,
  result,
  locale = 'id',
  type,
  meaning,
  comingSoonLabel = 'Detailed description coming soon.',
  compact = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const explainable = type !== undefined;

  const padding = compact ? 'p-3' : 'p-4';
  const numberSize = compact ? 'md' : 'lg';
  const labelClass = compact
    ? 'text-[10px] font-semibold uppercase tracking-wider line-clamp-2'
    : 'text-xs font-medium uppercase tracking-wide';
  const hintClass = compact
    ? 'text-muted-foreground mt-1 text-[11px] leading-snug line-clamp-2'
    : 'text-muted-foreground mt-1 text-xs';

  const inner = (
    <>
      <p className={`text-muted-foreground ${labelClass}`}>{label}</p>
      <div className={compact ? 'mt-1.5' : 'mt-2'}>
        <CompoundReduced result={result} locale={locale} size={numberSize} />
      </div>
      {hint ? <p className={hintClass}>{hint}</p> : null}
    </>
  );

  if (!explainable) {
    return (
      <div className={`border-border rounded-xl border bg-surface-1 ${padding}`}>
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
        className={`w-full ${padding} text-left`}
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
