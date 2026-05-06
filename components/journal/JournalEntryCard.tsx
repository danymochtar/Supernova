'use client';

import { useTransition, type ReactNode } from 'react';
import { Trash2 } from 'lucide-react';
import type { DeleteJournalResult } from '@/app/[locale]/journal/actions';

interface Props {
  id: string;
  question: string;
  answerMarkdown: ReactNode;
  /** When the user journaled this turn — different from the chat date. */
  addedDate: string;
  deleteAction: (input: { id: string }) => Promise<DeleteJournalResult>;
  labels: {
    addedAt: string;
    delete: string;
  };
}

export function JournalEntryCard({
  id,
  question,
  answerMarkdown,
  addedDate,
  deleteAction,
  labels,
}: Props) {
  const [pending, startTransition] = useTransition();

  function onDelete() {
    startTransition(async () => {
      await deleteAction({ id });
    });
  }

  return (
    <article className="border-border group relative space-y-3 rounded-2xl border bg-white/40 p-5 dark:bg-neutral-900/40">
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

      <div className="space-y-3">
        <div className="bg-primary/10 text-foreground rounded-2xl rounded-tl-md px-4 py-2.5 pr-10 text-sm whitespace-pre-wrap">
          {question}
        </div>
        <div className="border-border whitespace-pre-wrap rounded-2xl rounded-tl-md border bg-white/60 px-4 py-2.5 text-sm leading-relaxed text-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-200">
          {answerMarkdown}
        </div>
      </div>

      <p className="text-muted-foreground text-[11px]">
        {labels.addedAt} {addedDate}
      </p>
    </article>
  );
}
