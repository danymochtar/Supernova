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
  previewLabel: string;
}

export function DateBrowser({
  selectedIso,
  todayIso,
  maxIso,
  pickLabel,
  backLabel,
  previewLabel,
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
    <div className="flex items-center justify-between gap-2">
      {isPreview ? (
        <button
          type="button"
          onClick={() => navigate(todayIso)}
          disabled={pending}
          className="press-soft text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium disabled:opacity-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          {backLabel}
        </button>
      ) : (
        <span aria-hidden />
      )}

      <label
        className={`press-soft border-border hover:bg-muted/40 relative inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
          isPreview ? 'bg-amber-100 dark:bg-amber-950/40' : ''
        }`}
      >
        <Calendar className="h-3.5 w-3.5" aria-hidden />
        <span>{isPreview ? previewLabel : pickLabel}</span>
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
