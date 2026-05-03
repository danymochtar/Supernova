'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import type { Locale } from '@/lib/i18n/config';
import type { OnboardingActionResult } from '@/app/[locale]/welcome/actions';

interface Props {
  locale: Locale;
  defaultTimezone: string;
  timezones: { value: string; label: string }[];
  action: (formData: FormData) => Promise<OnboardingActionResult>;
}

const ERROR_KEY: Record<Exclude<OnboardingActionResult, { ok: true }>['error'], string> = {
  unauth: 'errorGeneric',
  invalid_name: 'errorInvalidName',
  invalid_dob: 'errorInvalidDob',
  future_dob: 'errorFutureDob',
  invalid_timezone: 'errorInvalidTimezone',
  profile_exists: 'errorGeneric',
  generic: 'errorGeneric',
};

export function OnboardingForm({ locale, defaultTimezone, timezones, action }: Props) {
  const t = useTranslations('welcome');
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
    <form onSubmit={onSubmit} className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </header>

      <aside className="bg-muted text-muted-foreground rounded-lg p-4 text-sm">
        <p className="text-foreground mb-1 font-medium">{t('warningTitle')}</p>
        <p>{t('warningBody')}</p>
      </aside>

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
          className="border-border w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
          className="border-border w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="timezone" className="text-sm font-medium">
          {t('timezoneLabel')}
        </label>
        <select
          id="timezone"
          name="timezone"
          defaultValue={defaultTimezone}
          className="border-border w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {timezones.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="locale" className="text-sm font-medium">
          {t('localeLabel')}
        </label>
        <select
          id="locale"
          name="locale"
          defaultValue={locale}
          className="border-border w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="id">Bahasa Indonesia</option>
          <option value="en">English</option>
        </select>
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
