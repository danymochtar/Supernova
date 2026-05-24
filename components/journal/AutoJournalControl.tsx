'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loader2, Sparkles } from 'lucide-react';
import type { GenerateAutoJournalResult } from '@/app/[locale]/journal/actions';

interface Props {
  /** Whether the user's autoJournal setting is on — drives the one-shot
   * auto-run on mount. The manual button works regardless. */
  autoEnabled: boolean;
  generateAction: () => Promise<GenerateAutoJournalResult>;
}

/**
 * Control for auto-generating journal entries from past chat. Renders a
 * manual "generate from past chats" button always; when the autoJournal
 * setting is on, it ALSO fires once per browser session on mount so the
 * user's complete past days get journaled without a tap.
 *
 * The auto-run is guarded by sessionStorage so navigating back and forth
 * to the journal tab doesn't re-trigger the (billable) clustering pass
 * every time — once per tab session is enough; the action itself is
 * idempotent so a missed run just happens on the next session.
 */
export function AutoJournalControl({ autoEnabled, generateAction }: Props) {
  const t = useTranslations('journal');
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);
  const ranRef = useRef(false);

  function run(manual: boolean) {
    startTransition(async () => {
      setStatus(null);
      const res = await generateAction();
      if (res.ok) {
        if (res.created > 0) {
          setStatus(t('autoGenDone', { count: res.created }));
          router.refresh();
        } else if (manual) {
          setStatus(t('autoGenNone'));
        }
      } else if (manual) {
        setStatus(t('autoGenError'));
      }
    });
  }

  useEffect(() => {
    if (!autoEnabled || ranRef.current) return;
    ranRef.current = true;
    const key = 'supernova-autojournal-ran';
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, String(Date.now()));
    } catch {
      // sessionStorage unavailable (private mode edge) — fall through and
      // run anyway; the action is idempotent.
    }
    run(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoEnabled]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => run(true)}
        disabled={pending}
        className="border-border press hover:bg-muted/40 inline-flex items-center gap-1.5 rounded-full border bg-surface-1 px-3 py-1.5 text-xs font-medium disabled:opacity-50"
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : (
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
        )}
        {pending ? t('autoGenRunning') : t('autoGenCta')}
      </button>
      {status ? <span className="text-muted-foreground text-xs">{status}</span> : null}
    </div>
  );
}
