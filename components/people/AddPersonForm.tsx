'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import type { Locale } from '@/lib/i18n/config';
import type { CreatePersonResult, createPersonAction } from '@/app/[locale]/people/actions';

const RELATIONSHIPS = ['PARTNER', 'FAMILY', 'FRIEND', 'COLLEAGUE', 'OTHER'] as const;

const ERROR_KEY: Record<Exclude<CreatePersonResult, { ok: true }>['error'], string> = {
  unauth: 'errorGeneric',
  limit_reached: 'errorLimit',
  invalid_name: 'errorInvalidName',
  invalid_dob: 'errorInvalidDob',
  future_dob: 'errorFutureDob',
  generic: 'errorGeneric',
};

export function AddPersonForm({
  locale,
  action,
}: {
  locale: Locale;
  action: typeof createPersonAction;
}) {
  const t = useTranslations('peopleForm');
  const tRel = useTranslations('people.relationship');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await action(formData);
      if (!result.ok) setError(t(ERROR_KEY[result.error]));
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <input type="hidden" name="locale" value={locale} />

      <div className="space-y-2">
        <label htmlFor="fullName" className="text-sm font-medium">
          {t('nameLabel')}
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          required
          minLength={2}
          maxLength={120}
          placeholder={t('namePlaceholder')}
          className="border-border focus:ring-primary w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
        />
        <p className="text-muted-foreground text-xs">{t('nameHint')}</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="dob" className="text-sm font-medium">
          {t('dobLabel')}
        </label>
        <input
          id="dob"
          name="dob"
          type="date"
          required
          max={new Date().toISOString().slice(0, 10)}
          className="border-border focus:ring-primary w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="relationship" className="text-sm font-medium">
          {t('relationshipLabel')}
        </label>
        <select
          id="relationship"
          name="relationship"
          defaultValue="PARTNER"
          className="border-border focus:ring-primary w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
        >
          {RELATIONSHIPS.map((r) => (
            <option key={r} value={r}>
              {tRel(r)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="notes" className="text-sm font-medium">
          {t('notesLabel')}
        </label>
        <textarea
          id="notes"
          name="notes"
          maxLength={500}
          rows={3}
          placeholder={t('notesPlaceholder')}
          className="border-border focus:ring-primary w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-primary text-primary-foreground w-full rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
      >
        {isPending ? t('submitting') : t('submit')}
      </button>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </form>
  );
}
