'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import type { Locale } from '@/lib/i18n/config';
import type { submitFeedback } from '@/app/[locale]/dashboard/feedbackActions';

interface Props {
  locale: Locale;
  initial?: { note: string | null } | null;
  action: typeof submitFeedback;
}

/**
 * Lightweight end-of-day journal prompt. A single paragraph textarea —
 * the dashboard hides this entirely when the user has already chatted
 * today, since the chat is itself the journal.
 */
export function FeedbackPrompt({ locale, initial, action }: Props) {
  const t = useTranslations('feedback');
  const [note, setNote] = useState(initial?.note ?? '');
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(initial ? new Date() : null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!note.trim()) return;
    setError(null);
    const fd = new FormData();
    fd.set('rating', 'NEUTRAL');
    fd.set('note', note);
    fd.set('tags', '');
    fd.set('locale', locale);
    startTransition(async () => {
      const res = await action(fd);
      if (res.ok) setSavedAt(new Date());
      else setError(t('errorGeneric'));
    });
  }

  return (
    <section className="border-border space-y-3 rounded-2xl border bg-white/40 p-6 dark:bg-neutral-900/40">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </header>

      <form onSubmit={onSubmit} className="space-y-3">
        <textarea
          rows={4}
          maxLength={1500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('notePlaceholder')}
          className="border-border focus:ring-primary w-full rounded-lg border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2"
        />
        <div className="flex items-center justify-between gap-3">
          {savedAt ? (
            <p className="text-muted-foreground text-xs">
              {t('savedAt', {
                time: savedAt.toLocaleTimeString(locale === 'id' ? 'id-ID' : 'en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              })}
            </p>
          ) : (
            <span />
          )}
          <button
            type="submit"
            disabled={!note.trim() || isPending}
            className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {isPending ? t('saving') : savedAt ? t('updateCta') : t('submitCta')}
          </button>
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </form>
    </section>
  );
}
