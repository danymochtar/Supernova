'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarDays, ChevronLeft, ChevronRight, List } from 'lucide-react';
import type { Locale } from '@/lib/i18n/config';
import { getLocaleConfig } from '@/lib/i18n/locales';
import type {
  DeleteJournalResult,
  ToggleActionItemResult,
} from '@/app/[locale]/journal/actions';
import {
  JournalEntryCard,
  type JournalActionItemLite,
} from '@/components/journal/JournalEntryCard';

interface EntrySourceLite {
  question: string;
  answer: string;
}

export interface JournalEntryLite {
  id: string;
  narrative: string;
  reframe: string | null;
  emotion: string | null;
  theme: string | null;
  actionItems: JournalActionItemLite[];
  sources: EntrySourceLite[];
  /** ISO date string in UTC (yyyy-mm-dd) — pre-computed server-side so
   * the client doesn't have to redo timezone math per entry. */
  dayKey: string;
  /** Formatted "added at" label, locale-aware, computed server-side. */
  addedLabel: string;
  /** Formatted "group date" label for headings, locale-aware. */
  groupLabel: string;
  /** UTC year of the entry's anchor day — used to drive the calendar
   * grid navigation without re-parsing dayKey. */
  year: number;
  /** UTC month (1-12). */
  month: number;
  /** UTC day-of-month (1-31). */
  day: number;
}

interface Props {
  locale: Locale;
  entries: JournalEntryLite[];
  deleteAction: (input: { id: string }) => Promise<DeleteJournalResult>;
  toggleAction: (input: {
    entryId: string;
    itemId: string;
    completed: boolean;
  }) => Promise<ToggleActionItemResult>;
}

type ViewMode = 'calendar' | 'list';

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function firstDow(year: number, month: number): number {
  // Monday-first grid: shift Sunday (0) to position 6, others -1.
  const sun0 = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  return (sun0 + 6) % 7;
}

export function JournalView({ locale, entries, deleteAction, toggleAction }: Props) {
  const t = useTranslations('journal');
  const [mode, setMode] = useState<ViewMode>('calendar');

  // Bucket entries by day for both views.
  const byDay = useMemo(() => {
    const m = new Map<string, JournalEntryLite[]>();
    for (const e of entries) {
      const arr = m.get(e.dayKey);
      if (arr) arr.push(e);
      else m.set(e.dayKey, [e]);
    }
    return m;
  }, [entries]);

  // Calendar view defaults to the month of the most-recent entry; if
  // there are no entries, default to "today" so the picker isn't blank.
  const initialMonth = useMemo(() => {
    if (entries.length > 0) {
      const first = entries[0]!;
      return { year: first.year, month: first.month };
    }
    const now = new Date();
    return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
  }, [entries]);

  const [view, setView] = useState(initialMonth);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(
    entries[0]?.dayKey ?? null,
  );

  const intlTag = getLocaleConfig(locale).intlTag;
  const monthLabel = new Intl.DateTimeFormat(intlTag, {
    month: 'long',
    year: 'numeric',
  }).format(new Date(Date.UTC(view.year, view.month - 1, 1)));

  // Build the 6×7 grid of days for the current view month.
  const cells: Array<
    { key: string; day: number; isToday: boolean; count: number } | null
  > = [];
  const dow0 = firstDow(view.year, view.month);
  for (let i = 0; i < dow0; i++) cells.push(null);
  const total = daysInMonth(view.year, view.month);
  const todayUtc = new Date();
  const todayKey = `${todayUtc.getUTCFullYear()}-${String(todayUtc.getUTCMonth() + 1).padStart(2, '0')}-${String(todayUtc.getUTCDate()).padStart(2, '0')}`;
  for (let d = 1; d <= total; d++) {
    const key = `${view.year}-${String(view.month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({
      key,
      day: d,
      isToday: key === todayKey,
      count: byDay.get(key)?.length ?? 0,
    });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  function shiftMonth(delta: -1 | 1) {
    let m = view.month + delta;
    let y = view.year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setView({ year: y, month: m });
  }

  // Localized DOW header (Mon-first). Pulled from Intl so non-English
  // locales (JA, KO, AR) get native abbreviations.
  const dowFmt = new Intl.DateTimeFormat(intlTag, { weekday: 'short' });
  const dowLabels = Array.from({ length: 7 }, (_, i) =>
    // Start with a known Monday (2024-01-01) so weekday(i) === Mon..Sun.
    dowFmt.format(new Date(Date.UTC(2024, 0, 1 + i))),
  );

  const selectedEntries =
    selectedDayKey && byDay.has(selectedDayKey) ? byDay.get(selectedDayKey)! : [];

  const entryLabels = {
    addedAt: t('addedAt'),
    delete: t('delete'),
    sources: t('sourcesToggle'),
    reframeTitle: t('reframeTitle'),
    actionItemsTitle: t('actionItemsTitle'),
    addToCalendar: t('addToCalendar'),
  };

  return (
    <div className="space-y-6">
      {/* Mode toggle — segmented control with icons */}
      <div className="border-border bg-surface-1 inline-flex rounded-full border p-1">
        <button
          type="button"
          onClick={() => setMode('calendar')}
          aria-pressed={mode === 'calendar'}
          className={`press-soft inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === 'calendar'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <CalendarDays className="h-3.5 w-3.5" aria-hidden />
          {t('viewCalendar')}
        </button>
        <button
          type="button"
          onClick={() => setMode('list')}
          aria-pressed={mode === 'list'}
          className={`press-soft inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === 'list'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <List className="h-3.5 w-3.5" aria-hidden />
          {t('viewList')}
        </button>
      </div>

      {mode === 'calendar' ? (
        <div className="space-y-5">
          {/* Month header + nav */}
          <div className="border-border bg-surface-1 flex items-center justify-between gap-3 rounded-2xl border p-3">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              aria-label={t('prevMonth')}
              className="press-soft hover:bg-muted/40 inline-flex h-8 w-8 items-center justify-center rounded-full"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <p className="font-serif text-base font-semibold capitalize">{monthLabel}</p>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label={t('nextMonth')}
              className="press-soft hover:bg-muted/40 inline-flex h-8 w-8 items-center justify-center rounded-full"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>

          {/* Day grid */}
          <div className="border-border bg-surface-1 rounded-2xl border p-3">
            <div className="text-muted-foreground grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wider">
              {dowLabels.map((d, i) => (
                <div key={i}>{d}</div>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {cells.map((cell, i) => {
                if (!cell) return <div key={i} className="h-12" />;
                const has = cell.count > 0;
                const selected = cell.key === selectedDayKey;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => has && setSelectedDayKey(cell.key)}
                    disabled={!has}
                    aria-label={cell.key}
                    aria-current={cell.isToday ? 'date' : undefined}
                    className={
                      'press-soft relative inline-flex h-12 flex-col items-center justify-center rounded-xl text-sm tabular-nums transition-colors ' +
                      (selected
                        ? 'bg-primary text-primary-foreground font-semibold'
                        : has
                          ? 'border-border bg-surface-2 hover:bg-muted/40 border font-semibold'
                          : cell.isToday
                            ? 'border-primary/40 text-muted-foreground border-dashed border'
                            : 'text-muted-foreground/50')
                    }
                  >
                    <span>{cell.day}</span>
                    {has ? (
                      <span
                        aria-hidden
                        className={
                          'mt-0.5 inline-block h-1 w-1 rounded-full ' +
                          (selected ? 'bg-primary-foreground' : 'bg-primary')
                        }
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected day entries (or hint if nothing selected / no entries in month) */}
          {selectedEntries.length > 0 ? (
            <section className="space-y-3">
              <p className="text-muted-foreground px-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
                {selectedEntries[0]!.groupLabel}
              </p>
              {selectedEntries.map((entry) => (
                <JournalEntryCard
                  key={entry.id}
                  id={entry.id}
                  narrative={entry.narrative}
                  reframe={entry.reframe}
                  emotion={entry.emotion}
                  theme={entry.theme}
                  actionItems={entry.actionItems}
                  sources={entry.sources}
                  addedDate={entry.addedLabel}
                  deleteAction={deleteAction}
                  toggleAction={toggleAction}
                  labels={entryLabels}
                />
              ))}
            </section>
          ) : (
            <p className="text-muted-foreground px-1 text-xs">
              {Array.from(byDay.keys()).some((k) => k.startsWith(`${view.year}-${String(view.month).padStart(2, '0')}`))
                ? t('selectDayHint')
                : t('noEntriesThisMonth')}
            </p>
          )}
        </div>
      ) : (
        <ListView entries={entries} deleteAction={deleteAction} toggleAction={toggleAction} labels={entryLabels} />
      )}
    </div>
  );
}

function ListView({
  entries,
  deleteAction,
  toggleAction,
  labels,
}: {
  entries: JournalEntryLite[];
  deleteAction: Props['deleteAction'];
  toggleAction: Props['toggleAction'];
  labels: {
    addedAt: string;
    delete: string;
    sources: string;
    reframeTitle: string;
    actionItemsTitle: string;
    addToCalendar: string;
  };
}) {
  // Same per-day grouping the original page rendered, just inside the
  // client-side mode switch.
  const groups = useMemo(() => {
    const m = new Map<string, JournalEntryLite[]>();
    for (const e of entries) {
      const arr = m.get(e.dayKey);
      if (arr) arr.push(e);
      else m.set(e.dayKey, [e]);
    }
    return Array.from(m.entries()).sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0));
  }, [entries]);

  return (
    <div className="space-y-8">
      {groups.map(([dayKey, dayEntries]) => (
        <section key={dayKey} className="space-y-3">
          <p className="text-muted-foreground px-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
            {dayEntries[0]!.groupLabel}
          </p>
          {dayEntries.map((entry) => (
            <JournalEntryCard
              key={entry.id}
              id={entry.id}
              narrative={entry.narrative}
              reframe={entry.reframe}
              emotion={entry.emotion}
              theme={entry.theme}
              actionItems={entry.actionItems}
              sources={entry.sources}
              addedDate={entry.addedLabel}
              deleteAction={deleteAction}
              toggleAction={toggleAction}
              labels={labels}
            />
          ))}
        </section>
      ))}
    </div>
  );
}
