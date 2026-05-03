'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import type { Locale } from '@/lib/i18n/config';
import type { savePersonalNotes } from '@/app/[locale]/me/actions';

interface Props {
  locale: Locale;
  initial: string | null;
  action: typeof savePersonalNotes;
}

export function PersonalNotesForm({ locale, initial, action }: Props) {
  const t = useTranslations('me');
  const [notes, setNotes] = useState(initial ?? '');
  const [savedAt, setSavedAt] = useState<Date | null>(initial ? new Date(0) : null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const dirty = notes !== (initial ?? '');

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set('notes', notes);
    fd.set('locale', locale);
    startTransition(async () => {
      const res = await action(fd);
      if (res.ok) setSavedAt(new Date());
      else setError(t('notesError'));
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <textarea
        rows={6}
        maxLength={4000}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={t('notesPlaceholder')}
        className="border-border focus:ring-primary w-full rounded-lg border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2"
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs">
          {savedAt && savedAt.getTime() > 0
            ? t('notesSavedAt', {
                time: savedAt.toLocaleTimeString(locale === 'id' ? 'id-ID' : 'en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              })
            : `${notes.length} / 4000`}
        </p>
        <button
          type="submit"
          disabled={!dirty || isPending}
          className="bg-primary text-primary-foreground press rounded-full px-4 py-2 text-sm font-medium disabled:opacity-30"
        >
          {isPending ? t('notesSaving') : t('notesSubmit')}
        </button>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </form>
  );
}
