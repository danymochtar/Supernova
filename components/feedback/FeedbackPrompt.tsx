'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import type { FeedbackRating } from '@prisma/client';
import type { Locale } from '@/lib/i18n/config';
import type { submitFeedback } from '@/app/[locale]/dashboard/feedbackActions';

const RATINGS: { value: FeedbackRating; emoji: string }[] = [
  { value: 'GREAT', emoji: '🤩' },
  { value: 'GOOD', emoji: '🙂' },
  { value: 'NEUTRAL', emoji: '😐' },
  { value: 'OFF', emoji: '😕' },
  { value: 'HARD', emoji: '😣' },
];

interface Props {
  locale: Locale;
  initial?: {
    rating: FeedbackRating;
    note: string | null;
    tags: string[];
  } | null;
  action: typeof submitFeedback;
  /** Default tag suggestions shown as quick-add chips. */
  suggestedTags: string[];
}

export function FeedbackPrompt({ locale, initial, action, suggestedTags }: Props) {
  const t = useTranslations('feedback');
  const [rating, setRating] = useState<FeedbackRating | null>(initial?.rating ?? null);
  const [note, setNote] = useState(initial?.note ?? '');
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(initial ? new Date() : null);
  const [isPending, startTransition] = useTransition();

  function toggleTag(tag: string) {
    const t = tag.toLowerCase().trim();
    if (!t) return;
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  function addTagFromInput() {
    const t = tagInput.toLowerCase().trim();
    if (!t) return;
    if (!tags.includes(t)) setTags([...tags, t]);
    setTagInput('');
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!rating) return;
    setError(null);
    const fd = new FormData();
    fd.set('rating', rating);
    fd.set('note', note);
    fd.set('tags', tags.join(','));
    fd.set('locale', locale);
    startTransition(async () => {
      const res = await action(fd);
      if (res.ok) setSavedAt(new Date());
      else setError(t('errorGeneric'));
    });
  }

  return (
    <section className="border-border space-y-4 rounded-2xl border bg-white/40 p-6 dark:bg-neutral-900/40">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </header>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {RATINGS.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRating(r.value)}
              className={`border-border flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
                rating === r.value
                  ? 'bg-primary text-primary-foreground border-transparent'
                  : 'hover:bg-muted/40'
              }`}
              aria-pressed={rating === r.value}
            >
              <span aria-hidden>{r.emoji}</span>
              <span>{t(`rating.${r.value}`)}</span>
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <label htmlFor="feedback-note" className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
            {t('noteLabel')}
          </label>
          <textarea
            id="feedback-note"
            rows={2}
            maxLength={500}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('notePlaceholder')}
            className="border-border focus:ring-primary w-full rounded-lg border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2"
          />
        </div>

        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
            {t('tagsLabel')}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggestedTags.map((tag) => {
              const active = tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full border px-2.5 py-1 text-xs transition ${
                    active ? 'bg-primary text-primary-foreground border-transparent' : 'border-border hover:bg-muted/40'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
            {tags
              .filter((t) => !suggestedTags.includes(t))
              .map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className="bg-primary text-primary-foreground rounded-full border border-transparent px-2.5 py-1 text-xs"
                >
                  {tag} ×
                </button>
              ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTagFromInput();
                }
              }}
              maxLength={40}
              placeholder={t('addTagPlaceholder')}
              className="border-border focus:ring-primary flex-1 rounded-lg border bg-transparent px-3 py-1.5 text-xs focus:outline-none focus:ring-2"
            />
            <button
              type="button"
              onClick={addTagFromInput}
              className="border-border rounded-lg border px-3 py-1.5 text-xs font-medium"
            >
              {t('addTag')}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          {savedAt ? (
            <p className="text-muted-foreground text-xs">
              {t('savedAt', { time: savedAt.toLocaleTimeString(locale === 'id' ? 'id-ID' : 'en-US', { hour: '2-digit', minute: '2-digit' }) })}
            </p>
          ) : (
            <span />
          )}
          <button
            type="submit"
            disabled={!rating || isPending}
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
