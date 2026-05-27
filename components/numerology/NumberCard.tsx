'use client';

import { useState } from 'react';
import type { NumerologyResult } from '@/lib/numerology';
import type { Locale } from '@/lib/i18n/config';
import type { MeaningType } from '@/lib/numerology/meanings';
import { CompoundReduced } from './CompoundReduced';
import { Modal } from '@/components/layout/Modal';
import { renderInlineMd } from '@/components/qa/inlineMd';

interface Props {
  label: string;
  hint?: string;
  result: NumerologyResult;
  locale?: Locale;
  /** Type key for meaning lookup. */
  type?: MeaningType;
  /** Deterministic general meaning of the number. */
  meaning?: string | null;
  /** Personalized AI prose for this number — shown first in the detail
   *  popup, above the general meaning. */
  aiBody?: string | null;
  comingSoonLabel?: string;
  /** Tighter padding + smaller number; used in multi-column grids. */
  compact?: boolean;
}

/**
 * A number tile: shows the label + number, and (when there's something to
 * say) opens a detail popup on tap with the personalized prose and the
 * general meaning. The popup gives each number room to breathe.
 */
export function NumberCard({
  label,
  hint,
  result,
  locale = 'id',
  type,
  meaning,
  aiBody,
  comingSoonLabel = 'Detailed description coming soon.',
  compact = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const explainable = type !== undefined || Boolean(aiBody) || Boolean(meaning);

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
      <div className={`border-border rounded-xl border bg-surface-1 ${padding}`}>{inner}</div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`border-border press-soft hover:bg-surface-2 w-full rounded-xl border bg-surface-1 text-left transition-colors ${padding}`}
      >
        {inner}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={<h3 className="font-serif text-2xl font-semibold tracking-tight">{label}</h3>}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <CompoundReduced result={result} locale={locale} size="lg" />
            {hint ? <p className="text-muted-foreground text-sm">{hint}</p> : null}
          </div>
          {aiBody ? (
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-200">
              {renderInlineMd(aiBody)}
            </p>
          ) : null}
          {meaning ? (
            <p className="text-muted-foreground whitespace-pre-line text-sm leading-relaxed">
              {meaning}
            </p>
          ) : !aiBody ? (
            <p className="text-muted-foreground text-sm italic">{comingSoonLabel}</p>
          ) : null}
        </div>
      </Modal>
    </>
  );
}
