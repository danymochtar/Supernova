'use client';

import { useState, useTransition } from 'react';
import { ChevronDown, Trash2 } from 'lucide-react';
import type { DeleteJournalResult } from '@/app/[locale]/journal/actions';
import { renderInlineMd } from '@/components/qa/inlineMd';

interface SourceLite {
  question: string;
  answer: string;
}

interface Props {
  id: string;
  narrative: string;
  sources: SourceLite[];
  /** When the user journaled this entry — different from the chat date. */
  addedDate: string;
  deleteAction: (input: { id: string }) => Promise<DeleteJournalResult>;
  labels: {
    addedAt: string;
    delete: string;
    sources: string;
  };
}

export function JournalEntryCard({
  id,
  narrative,
  sources,
  addedDate,
  deleteAction,
  labels,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [showSources, setShowSources] = useState(false);

  function onDelete() {
    startTransition(async () => {
      await deleteAction({ id });
    });
  }

  const paragraphs = narrative
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <article className="border-border group relative space-y-3 rounded-2xl border bg-surface-1 p-5">
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        aria-label={labels.delete}
        title={labels.delete}
        className="text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 absolute right-3 top-3 rounded-full p-1.5 opacity-0 transition group-hover:opacity-100 disabled:opacity-30 sm:opacity-40"
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden />
      </button>

      <div className="font-serif space-y-3 pr-8 text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-200">
        {paragraphs.length > 0 ? (
          paragraphs.map((p, i) => <p key={i}>{renderInlineMd(p)}</p>)
        ) : (
          <p className="text-muted-foreground italic">…</p>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-[11px]">
          {labels.addedAt} {addedDate}
        </p>
        {sources.length > 0 ? (
          <button
            type="button"
            onClick={() => setShowSources((v) => !v)}
            aria-expanded={showSources}
            className="text-muted-foreground press-soft inline-flex items-center gap-1 text-[11px] underline-offset-4 hover:underline"
          >
            {labels.sources} ({sources.length})
            <ChevronDown
              className={`h-3 w-3 transition-transform ${showSources ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </button>
        ) : null}
      </div>

      {showSources && sources.length > 0 ? (
        <div className="border-border/60 space-y-3 border-t pt-3">
          {sources.map((s, i) => (
            <div key={i} className="space-y-2">
              <div className="bg-primary/10 text-foreground rounded-xl rounded-tl-md px-3 py-2 text-xs whitespace-pre-wrap">
                {s.question}
              </div>
              <div className="border-border whitespace-pre-wrap rounded-xl rounded-tl-md border bg-surface-1 px-3 py-2 text-xs leading-relaxed text-neutral-800 dark:text-neutral-200">
                {renderInlineMd(s.answer)}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}
