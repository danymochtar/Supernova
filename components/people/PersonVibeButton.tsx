'use client';

import { useState, useTransition } from 'react';
import { Sparkles, X } from 'lucide-react';
import type { PersonVibeResult } from '@/app/[locale]/people/actions';
import { renderInlineMd } from '@/components/qa/inlineMd';

interface Props {
  personId: string;
  /** Server-known cached body for today, if any — surfaces instantly without
   *  needing a server roundtrip on tap. */
  cachedBody: string | null;
  action: (input: { personId: string }) => Promise<PersonVibeResult>;
  labels: {
    button: string;
    sheetTitle: string;
    sheetHint: string;
    generate: string;
    loading: string;
    error: string;
    close: string;
  };
}

export function PersonVibeButton({ personId, cachedBody, action, labels }: Props) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState<string | null>(cachedBody);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onOpen() {
    setOpen(true);
    if (body || pending) return;
    setError(null);
    start(async () => {
      const result = await action({ personId });
      if (result.ok) setBody(result.body);
      else setError(labels.error);
    });
  }

  const paragraphs = (body ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        aria-label={labels.button}
        className="from-primary to-accent text-primary-foreground press fixed bottom-24 right-4 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br shadow-lg"
      >
        <Sparkles className="h-6 w-6" aria-hidden />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={labels.sheetTitle}
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-background border-border w-full max-w-md rounded-t-3xl border-t shadow-2xl sm:rounded-3xl sm:border"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="border-border flex items-start justify-between gap-3 border-b px-5 py-4">
              <div>
                <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.18em]">
                  <Sparkles className="text-primary mr-1 inline h-3 w-3" aria-hidden />
                  {labels.button}
                </p>
                <h2 className="font-serif mt-1 text-xl font-semibold tracking-tight">
                  {labels.sheetTitle}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={labels.close}
                className="press text-muted-foreground hover:text-foreground inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </header>

            <div className="space-y-4 px-5 py-5">
              {pending && !body ? (
                <div className="flex items-center justify-center gap-2 py-8">
                  <span className="bg-muted-foreground/50 h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:-0.3s]" />
                  <span className="bg-muted-foreground/50 h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:-0.15s]" />
                  <span className="bg-muted-foreground/50 h-1.5 w-1.5 animate-bounce rounded-full" />
                  <span className="text-muted-foreground ml-2 text-sm">{labels.loading}</span>
                </div>
              ) : error ? (
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              ) : paragraphs.length > 0 ? (
                <div className="space-y-3 text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-200">
                  {paragraphs.map((p, i) => (
                    <p key={i}>{renderInlineMd(p)}</p>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm italic">{labels.sheetHint}</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
