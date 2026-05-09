'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTransition } from 'react';
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
      <label
        aria-label={pickLabel}
        className={`press-soft border-border hover:bg-muted/40 relative inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border bg-white/40 dark:bg-neutral-900/40 ${
          isPreview ? 'border-amber-500/50 text-amber-600 dark:text-amber-300' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Calendar className="h-4 w-4" aria-hidden />
        <input
          type="date"
          value={selectedIso}
          min={todayIso}
          max={maxIso}
          onChange={(e) => navigate(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label={pickLabel}
        />
      </label>
    </div>
  );
}
