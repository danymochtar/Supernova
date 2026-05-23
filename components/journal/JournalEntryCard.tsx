'use client';

import { useOptimistic, useState, useTransition } from 'react';
import { CalendarPlus, Check, ChevronDown, Sparkles, Trash2 } from 'lucide-react';
import type {
  DeleteJournalResult,
  ToggleActionItemResult,
} from '@/app/[locale]/journal/actions';
import { renderInlineMd } from '@/components/qa/inlineMd';

interface SourceLite {
  question: string;
  answer: string;
}

export interface JournalActionItemLite {
  id: string;
  title: string;
  completed: boolean;
}

interface Props {
  id: string;
  narrative: string;
  reframe?: string | null;
  emotion?: string | null;
  theme?: string | null;
  actionItems?: JournalActionItemLite[];
  sources: SourceLite[];
  /** When the user journaled this entry — different from the chat date. */
  addedDate: string;
  deleteAction: (input: { id: string }) => Promise<DeleteJournalResult>;
  toggleAction: (input: {
    entryId: string;
    itemId: string;
    completed: boolean;
  }) => Promise<ToggleActionItemResult>;
  labels: {
    addedAt: string;
    delete: string;
    sources: string;
    reframeTitle: string;
    actionItemsTitle: string;
    addToCalendar: string;
  };
}

export function JournalEntryCard({
  id,
  narrative,
  reframe,
  emotion,
  theme,
  actionItems = [],
  sources,
  addedDate,
  deleteAction,
  toggleAction,
  labels,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [showSources, setShowSources] = useState(false);

  // Optimistic completed-state so the checkbox flips instantly on tap;
  // the server action reconciles afterwards.
  const [items, setOptimisticItems] = useOptimistic(
    actionItems,
    (state: JournalActionItemLite[], action: { itemId: string; completed: boolean }) =>
      state.map((it) =>
        it.id === action.itemId ? { ...it, completed: action.completed } : it,
      ),
  );

  function onDelete() {
    startTransition(async () => {
      await deleteAction({ id });
    });
  }

  function onToggle(itemId: string, current: boolean) {
    startTransition(async () => {
      setOptimisticItems({ itemId, completed: !current });
      await toggleAction({ entryId: id, itemId, completed: !current });
    });
  }

  const paragraphs = narrative
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <article className="border-border group relative space-y-4 rounded-2xl border bg-surface-1 p-5">
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        aria-label={labels.delete}
        title={labels.delete}
        className="press-soft text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 absolute right-3 top-3 rounded-full p-1.5 opacity-40 transition group-hover:opacity-100 disabled:opacity-20"
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden />
      </button>

      {/* Emotion + theme chips — silent metadata, surfaces patterns over time */}
      {(emotion || theme) ? (
        <div className="flex flex-wrap gap-1.5">
          {emotion ? (
            <span className="bg-fill-1 text-muted-foreground rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider">
              {emotion}
            </span>
          ) : null}
          {theme ? (
            <span className="bg-fill-2 text-muted-foreground rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider">
              {theme}
            </span>
          ) : null}
        </div>
      ) : null}

      {/* First-person narrative — user's voice */}
      <div className="font-serif space-y-3 pr-8 text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-200">
        {paragraphs.length > 0 ? (
          paragraphs.map((p, i) => <p key={i}>{renderInlineMd(p)}</p>)
        ) : (
          <p className="text-muted-foreground italic">…</p>
        )}
      </div>

      {/* Reframe — Supernova's voice, gentle CBT-style alternative lens */}
      {reframe ? (
        <div className="border-accent/40 bg-accent/5 dark:bg-accent/10 space-y-1.5 rounded-xl border-l-[3px] px-4 py-3">
          <div className="text-accent-foreground/70 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em]">
            <Sparkles className="h-3 w-3" aria-hidden />
            {labels.reframeTitle}
          </div>
          <p className="text-[14px] leading-relaxed italic text-neutral-700 dark:text-neutral-300">
            {renderInlineMd(reframe)}
          </p>
        </div>
      ) : null}

      {/* Action items — checklist, optimistic toggle */}
      {items.length > 0 ? (
        <div className="space-y-2">
          <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.18em]">
            {labels.actionItemsTitle}
          </p>
          <ul className="space-y-1.5">
            {items.map((item) => (
              <li key={item.id} className="-mx-2 flex items-start gap-1">
                <button
                  type="button"
                  onClick={() => onToggle(item.id, item.completed)}
                  disabled={pending}
                  aria-pressed={item.completed}
                  className="press-soft hover:bg-muted/40 flex flex-1 items-start gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm leading-snug transition-colors"
                >
                  <span
                    aria-hidden
                    className={
                      'mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ' +
                      (item.completed
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-border bg-surface-2')
                    }
                  >
                    {item.completed ? <Check className="h-3 w-3" aria-hidden /> : null}
                  </span>
                  <span
                    className={
                      item.completed
                        ? 'text-muted-foreground line-through'
                        : 'text-neutral-800 dark:text-neutral-200'
                    }
                  >
                    {item.title}
                  </span>
                </button>
                {item.completed ? null : (
                  // <a> with download attribute kicks the .ics file straight
                  // into the device's calendar handler. On iOS Safari that's
                  // Apple Calendar's "Add Event" sheet; on desktop Chrome it
                  // downloads the file which the user opens in their default
                  // calendar.
                  <a
                    href={`/api/journal/ics?entryId=${id}&itemId=${item.id}`}
                    download
                    aria-label={labels.addToCalendar}
                    title={labels.addToCalendar}
                    className="press-soft text-muted-foreground hover:text-primary hover:bg-muted/40 mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors"
                  >
                    <CalendarPlus className="h-3.5 w-3.5" aria-hidden />
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

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
              className={`h-3 w-3 transition-transform ios-ease ${showSources ? 'rotate-180' : ''}`}
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
