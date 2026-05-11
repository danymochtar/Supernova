'use client';

import { useRef, useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ArrowLeft, Calendar } from 'lucide-react';

interface Props {
  selectedIso: string;
  todayIso: string;
  maxIso: string;
  pickLabel: string;
  backLabel: string;
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
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isPreview = selectedIso !== todayIso;

  function navigate(iso: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!iso || iso === todayIso) params.delete('date');
    else params.set('date', iso);
    const qs = params.toString();
    start(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  function openPicker() {
    const el = inputRef.current;
    if (!el) return;
    // showPicker() is the modern API (iOS 16.4+, Chromium); fall back to
    // focus() + click() for older Safari/Firefox so the native widget still
    // opens.
    if (typeof el.showPicker === 'function') {
      try {
        el.showPicker();
        return;
      } catch {
        /* falls through */
      }
    }
    el.focus();
    el.click();
  }

  return (
    <div className="flex items-center gap-1">
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
        type="button"
        onClick={openPicker}
        aria-label={pickLabel}
        className={`press-soft border-border hover:bg-muted/40 inline-flex h-9 w-9 items-center justify-center rounded-full border bg-white/40 dark:bg-neutral-900/40 ${
          isPreview ? 'border-amber-500/50 text-amber-600 dark:text-amber-300' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Calendar className="h-4 w-4" aria-hidden />
      </button>
      {/* sr-only-style hidden input — must remain in the DOM (and not display:none)
        * so showPicker()/click() can dispatch the native widget. Sized to 1px so
        * it can't claim any touch target adjacent to the visible button. */}
      <input
        ref={inputRef}
        type="date"
        value={selectedIso}
        min={todayIso}
        max={maxIso}
        onChange={(e) => navigate(e.target.value)}
        aria-hidden
        tabIndex={-1}
        className="pointer-events-none absolute h-px w-px opacity-0"
      />
    </div>
  );
}
