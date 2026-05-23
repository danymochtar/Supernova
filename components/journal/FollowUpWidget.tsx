'use client';

import { useOptimistic, useTransition } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight, Check, ListTodo } from 'lucide-react';
import type { Locale } from '@/lib/i18n/config';
import type { ToggleActionItemResult } from '@/app/[locale]/journal/actions';

export interface OpenActionItemLite {
  id: string;
  title: string;
  /** ISO timestamp of when the parent entry was created. */
  entryAddedAt: string;
  entryId: string;
  entryEmotion: string | null;
  entryTheme: string | null;
  /** Pre-computed integer days since the parent entry was added — done
   * server-side so the widget doesn't need its own date math. */
  daysAgo: number;
}

interface Props {
  locale: Locale;
  items: OpenActionItemLite[];
  toggleAction: (input: {
    entryId: string;
    itemId: string;
    completed: boolean;
  }) => Promise<ToggleActionItemResult>;
}

/**
 * Dashboard widget that surfaces uncompleted action items from recent
 * journal entries. Closes the loop from "I journaled an intention" to
 * "did I actually do it?" without requiring the user to open the
 * journal page. Tap a row to toggle done; tap the chevron to open the
 * full entry.
 */
export function FollowUpWidget({ locale, items, toggleAction }: Props) {
  const t = useTranslations('followUp');
  const [pending, startTransition] = useTransition();

  // Optimistic — flip the checkbox immediately, let the server reconcile.
  const [optimisticItems, setOptimistic] = useOptimistic(
    items,
    (state: OpenActionItemLite[], itemId: string) =>
      state.filter((it) => it.id !== itemId),
  );

  function onComplete(item: OpenActionItemLite) {
    startTransition(async () => {
      setOptimistic(item.id);
      await toggleAction({
        entryId: item.entryId,
        itemId: item.id,
        completed: true,
      });
    });
  }

  if (optimisticItems.length === 0) return null;

  return (
    <section className="border-border space-y-3 rounded-2xl border bg-surface-1 p-5">
      <div className="flex items-center gap-2">
        <div className="bg-accent/15 text-accent-foreground/80 flex h-8 w-8 items-center justify-center rounded-full">
          <ListTodo className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold">{t('title')}</h2>
          <p className="text-muted-foreground text-xs">{t('subtitle')}</p>
        </div>
      </div>

      <ul className="space-y-1">
        {optimisticItems.map((item) => (
          <li
            key={item.id}
            className="border-border/60 hover:bg-muted/30 flex items-start gap-2 rounded-xl border px-3 py-2.5 transition-colors"
          >
            <button
              type="button"
              onClick={() => onComplete(item)}
              disabled={pending}
              aria-label={t('markDone')}
              className="press-soft mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border border-border bg-surface-2 transition-colors hover:border-primary hover:bg-primary/10"
            >
              <Check className="text-muted-foreground h-3 w-3 opacity-0 transition-opacity hover:opacity-100" aria-hidden />
            </button>
            <Link
              href={`/${locale}/journal#${item.entryId}`}
              className="press-soft flex min-w-0 flex-1 items-start justify-between gap-2 text-left"
            >
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-sm leading-snug text-neutral-800 dark:text-neutral-200">
                  {item.title}
                </p>
                <p className="text-muted-foreground flex items-center gap-1.5 text-[10px] uppercase tracking-wider">
                  <span className="tabular-nums">
                    {item.daysAgo === 0
                      ? t('today')
                      : item.daysAgo === 1
                        ? t('yesterday')
                        : t('daysAgo', { count: item.daysAgo })}
                  </span>
                  {item.entryTheme ? (
                    <>
                      <span aria-hidden>·</span>
                      <span>{item.entryTheme}</span>
                    </>
                  ) : null}
                </p>
              </div>
              <ArrowRight className="text-muted-foreground mt-1 h-3.5 w-3.5 shrink-0" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
