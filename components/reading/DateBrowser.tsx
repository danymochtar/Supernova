'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  selectedIso: string;
  todayIso: string;
  maxIso: string;
  pickLabel: string;
  backLabel: string;
}

const DAYS_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function parseIso(iso: string): { year: number; month: number; day: number } {
  const [y, m, d] = iso.split('-').map(Number);
  return { year: y!, month: m!, day: d! };
}

function toIso(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

// Day of week for the 1st of (year, month). 0 = Sunday.
function firstDow(year: number, month: number): number {
  return new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
}

export function DateBrowser({
  selectedIso,
  todayIso,
  maxIso,
  pickLabel,
  backLabel,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const isPreview = selectedIso !== todayIso;

  // Which month the calendar grid is currently displaying. Defaults to
  // the selected date's month so re-opening the picker lands on the
  // same view the user last navigated to.
  const initial = parseIso(selectedIso);
  const [viewYear, setViewYear] = useState(initial.year);
  const [viewMonth, setViewMonth] = useState(initial.month);

  // Close on outside click / escape — only attach handlers while open
  // so we don't pay for global listeners on idle.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (popoverRef.current?.contains(target)) return;
      if (buttonRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function navigate(iso: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!iso || iso === todayIso) params.delete('date');
    else params.set('date', iso);
    const qs = params.toString();
    start(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
    setOpen(false);
  }

  function shiftMonth(delta: -1 | 1) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setViewYear(y);
    setViewMonth(m);
  }

  // Build the 6×7 grid covering the current view month, padded with
  // leading + trailing blanks. Each cell has its ISO + disabled flag.
  const days: Array<{ iso: string; day: number; disabled: boolean } | null> = [];
  const dow0 = firstDow(viewYear, viewMonth);
  for (let i = 0; i < dow0; i++) days.push(null);
  const totalDays = daysInMonth(viewYear, viewMonth);
  for (let d = 1; d <= totalDays; d++) {
    const iso = toIso(viewYear, viewMonth, d);
    const disabled = iso < todayIso || iso > maxIso;
    days.push({ iso, day: d, disabled });
  }
  while (days.length % 7 !== 0) days.push(null);

  // Disable month-nav arrows when crossing past min/max boundaries.
  const minView = parseIso(todayIso);
  const maxView = parseIso(maxIso);
  const canPrev = viewYear > minView.year || (viewYear === minView.year && viewMonth > minView.month);
  const canNext = viewYear < maxView.year || (viewYear === maxView.year && viewMonth < maxView.month);

  const monthFmt = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' });
  const monthLabel = monthFmt.format(new Date(Date.UTC(viewYear, viewMonth - 1, 1)));

  return (
    <div className="relative flex items-center gap-1">
      {isPreview ? (
        <button
          type="button"
          onClick={() => navigate(todayIso)}
          disabled={pending}
          aria-label={backLabel}
          className="press-soft text-muted-foreground hover:text-foreground inline-flex h-9 w-9 items-center justify-center rounded-full disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
        </button>
      ) : null}

      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={pickLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={pickLabel}
        className={`press border-border hover:bg-muted/40 inline-flex h-9 w-9 items-center justify-center rounded-full border bg-surface-1 ${
          isPreview ? 'border-amber-500/50 text-amber-600 dark:text-amber-300' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Calendar className="h-4 w-4" aria-hidden />
      </button>

      {/* Custom calendar popover. Anchored directly below the button via
       * a relative parent so it drops in just under the AppHeader instead
       * of the iOS native picker's hard-to-predict center placement. */}
      {open ? (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label={pickLabel}
          className="border-border bg-surface-1 animate-in fade-in slide-in-from-top-2 ios-ease absolute left-0 top-full z-50 mt-2 w-[300px] rounded-2xl border p-3 shadow-xl duration-150 supports-[backdrop-filter]:bg-surface-1/95 supports-[backdrop-filter]:backdrop-blur-xl"
        >
          {/* Month header — left/right month nav + month label */}
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              disabled={!canPrev}
              aria-label="Previous month"
              className="press-soft text-muted-foreground hover:bg-muted/40 inline-flex h-8 w-8 items-center justify-center rounded-full disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <p className="text-sm font-semibold capitalize">{monthLabel}</p>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              disabled={!canNext}
              aria-label="Next month"
              className="press-soft text-muted-foreground hover:bg-muted/40 inline-flex h-8 w-8 items-center justify-center rounded-full disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>

          {/* Day-of-week header */}
          <div className="text-muted-foreground grid grid-cols-7 gap-1 px-1 text-[10px] font-semibold uppercase tracking-wider">
            {DAYS_ID.map((d) => (
              <div key={d} className="text-center">{d}</div>
            ))}
          </div>

          {/* Day grid — 6 rows × 7 cols */}
          <div className="mt-1 grid grid-cols-7 gap-1 px-1">
            {days.map((cell, i) => {
              if (!cell) return <div key={i} className="h-9" />;
              const isToday = cell.iso === todayIso;
              const isSelected = cell.iso === selectedIso;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => navigate(cell.iso)}
                  disabled={cell.disabled || pending}
                  className={
                    'press-soft inline-flex h-9 items-center justify-center rounded-full text-sm tabular-nums transition-colors ' +
                    (isSelected
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : isToday
                        ? 'border-primary/60 text-primary border font-semibold'
                        : cell.disabled
                          ? 'text-muted-foreground/40'
                          : 'hover:bg-muted/40')
                  }
                  aria-label={cell.iso}
                  aria-current={isToday ? 'date' : undefined}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
