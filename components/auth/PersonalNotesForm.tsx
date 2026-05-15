'use client';

import { useRef, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Upload } from 'lucide-react';
import type { Locale } from '@/lib/i18n/config';
import type { savePersonalNotes } from '@/app/[locale]/me/actions';

interface Props {
  locale: Locale;
  action: typeof savePersonalNotes;
}

const MAX_ENTRY = 4000;

/**
 * Append-mode notes form. Each submission appends the textarea content
 * to the saved notes body (server-side) and clears the textarea. The
 * user never sees the existing saved body here — it's "drop in more
 * context" rather than "edit one big document".
 */
export function PersonalNotesForm({ locale, action }: Props) {
  const t = useTranslations('me');
  const [entry, setEntry] = useState('');
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const dirty = entry.trim().length > 0;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!dirty) return;
    setError(null);
    const fd = new FormData();
    fd.set('notes', entry);
    fd.set('locale', locale);
    startTransition(async () => {
      const res = await action(fd);
      if (res.ok) {
        setEntry('');
        setSavedAt(new Date());
      } else {
        setError(t('notesError'));
      }
    });
  }

  /**
   * Read a plain-text or markdown file and drop its contents into the
   * textarea as the current draft entry. Truncates to MAX_ENTRY.
   */
  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (file.size > 1_000_000) {
      setError(t('notesFileTooBig'));
      e.target.value = '';
      return;
    }

    try {
      const text = await file.text();
      const cleaned = text.trim();
      if (!cleaned) return;
      setEntry(cleaned.length <= MAX_ENTRY ? cleaned : cleaned.slice(0, MAX_ENTRY));
    } catch {
      setError(t('notesFileError'));
    } finally {
      e.target.value = '';
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <textarea
        rows={6}
        maxLength={MAX_ENTRY}
        value={entry}
        onChange={(e) => setEntry(e.target.value)}
        placeholder={t('notesPlaceholder')}
        className="border-border focus:ring-primary w-full rounded-lg border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="border-border press hover:bg-muted/40 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium"
        >
          <Upload className="h-3.5 w-3.5" aria-hidden />
          {t('notesImportFile')}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".txt,.md,text/plain,text/markdown"
          onChange={onPickFile}
          className="hidden"
        />
        <div className="flex items-center gap-3">
          {savedAt ? (
            <p className="text-muted-foreground text-xs">
              {t('notesSavedAt', {
                time: savedAt.toLocaleTimeString(locale === 'id' ? 'id-ID' : 'en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              })}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={!dirty || isPending}
            className="bg-primary text-primary-foreground press rounded-full px-4 py-2 text-sm font-medium disabled:opacity-30"
          >
            {isPending ? t('notesSaving') : t('notesSubmit')}
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <p className="text-muted-foreground text-xs">{t('notesImportHint')}</p>
    </form>
  );
}
