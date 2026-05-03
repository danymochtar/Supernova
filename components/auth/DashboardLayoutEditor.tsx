'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowDown, ArrowUp, Eye, EyeOff } from 'lucide-react';
import type { WidgetId, WidgetState } from '@/lib/dashboard/layout';
import { saveDashboardLayout } from '@/app/[locale]/me/actions';

interface Props {
  initial: WidgetState[];
  /** Map of widget id → display label, supplied by the page (translated). */
  labels: Record<WidgetId, string>;
}

export function DashboardLayoutEditor({ initial, labels }: Props) {
  const t = useTranslations('layoutEditor');
  const [layout, setLayout] = useState<WidgetState[]>(initial);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [pending, startTransition] = useTransition();

  const dirty = JSON.stringify(layout) !== JSON.stringify(initial);

  function move(index: number, delta: -1 | 1) {
    const next = [...layout];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target]!, next[index]!];
    setLayout(next);
  }

  function toggleHidden(index: number) {
    setLayout((prev) =>
      prev.map((w, i) => (i === index ? { ...w, hidden: !w.hidden } : w)),
    );
  }

  function save() {
    startTransition(async () => {
      await saveDashboardLayout(layout);
      setSavedAt(new Date());
    });
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {layout.map((w, i) => (
          <li
            key={w.id}
            className={`border-border flex items-center gap-2 rounded-xl border p-3 transition-colors ${
              w.hidden ? 'bg-muted/30 opacity-70' : 'bg-white/40 dark:bg-neutral-900/40'
            }`}
          >
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label="Move up"
                className="press hover:bg-muted/40 flex h-7 w-7 items-center justify-center rounded-full disabled:opacity-30"
              >
                <ArrowUp className="h-3.5 w-3.5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === layout.length - 1}
                aria-label="Move down"
                className="press hover:bg-muted/40 flex h-7 w-7 items-center justify-center rounded-full disabled:opacity-30"
              >
                <ArrowDown className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>

            <span className="flex-1 text-sm font-medium">{labels[w.id]}</span>

            <button
              type="button"
              onClick={() => toggleHidden(i)}
              aria-pressed={!w.hidden}
              aria-label={w.hidden ? t('show') : t('hide')}
              title={w.hidden ? t('show') : t('hide')}
              className="press hover:bg-muted/40 flex h-9 w-9 items-center justify-center rounded-full"
            >
              {w.hidden ? (
                <EyeOff className="text-muted-foreground h-4 w-4" aria-hidden />
              ) : (
                <Eye className="text-primary h-4 w-4" aria-hidden />
              )}
            </button>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs">
          {savedAt
            ? t('savedAt', {
                time: savedAt.toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              })
            : t('hint')}
        </p>
        <button
          type="button"
          onClick={save}
          disabled={!dirty || pending}
          className="bg-primary text-primary-foreground press rounded-full px-4 py-2 text-sm font-medium disabled:opacity-30"
        >
          {pending ? t('saving') : t('save')}
        </button>
      </div>
    </div>
  );
}
