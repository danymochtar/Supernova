'use client';

import { useRef, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Upload } from 'lucide-react';
import type { Locale } from '@/lib/i18n/config';
import type { savePersonalNotes } from '@/app/[locale]/me/actions';

interface Props {
  locale: Locale;
  initial: string | null;
  action: typeof savePersonalNotes;
}

const MAX_NOTES = 4000;

export function PersonalNotesForm({ locale, initial, action }: Props) {
  const t = useTranslations('me');
  const [notes, setNotes] = useState(initial ?? '');
  const [savedAt, setSavedAt] = useState<Date | null>(initial ? new Date(0) : null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement | null>(null);

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

  /**
   * Read a plain-text or markdown file and merge its contents into the
   * textarea. Replace existing notes if empty; otherwise append with a
   * separator so existing context isn't lost.
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

      const merged = notes.trim()
        ? `${notes.trim()}\n\n---\n\n${cleaned}`
        : cleaned;

      // Truncate to MAX_NOTES with a note if over.
      const finalText =
        merged.length <= MAX_NOTES
          ? merged
          : merged.slice(0, MAX_NOTES);

      setNotes(finalText);
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
        maxLength={MAX_NOTES}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={t('notesPlaceholder')}
        className="border-border focus:ring-primary w-full rounded-lg border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
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
          <span className="text-muted-foreground text-xs tabular-nums">
            {notes.length} / {MAX_NOTES}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {savedAt && savedAt.getTime() > 0 ? (
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
