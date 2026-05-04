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
    <form onSubmit={onSubmit} className="space-y-7">
      <header className="space-y-2">
        <h1 className="font-serif text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('warningBody')}</p>
      </header>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">{t('nameLabel')}</legend>
        <p className="text-muted-foreground text-xs">{t('nameHint')}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <label htmlFor="firstName" className="text-muted-foreground text-xs uppercase tracking-wider">
              {t('firstNameLabel')}
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              minLength={1}
              maxLength={60}
              autoComplete="given-name"
              placeholder={t('firstNamePlaceholder')}
              className="border-border focus:ring-primary w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="middleName" className="text-muted-foreground text-xs uppercase tracking-wider">
              {t('middleNameLabel')}
            </label>
            <input
              id="middleName"
              name="middleName"
              type="text"
              maxLength={60}
              autoComplete="additional-name"
              placeholder={t('middleNamePlaceholder')}
              className="border-border focus:ring-primary w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="lastName" className="text-muted-foreground text-xs uppercase tracking-wider">
              {t('lastNameLabel')}
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              maxLength={60}
              autoComplete="family-name"
              placeholder={t('lastNamePlaceholder')}
              className="border-border focus:ring-primary w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
            />
          </div>
        </div>
      </fieldset>

      <div className="space-y-2">
        <label htmlFor="nickname" className="text-sm font-medium">
          {t('nicknameLabel')}
        </label>
        <p className="text-muted-foreground text-xs">{t('nicknameHint')}</p>
        <input
          id="nickname"
          name="nickname"
          type="text"
          maxLength={40}
          autoComplete="nickname"
          placeholder={t('nicknamePlaceholder')}
          className="border-border focus:ring-primary w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
        />
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
        <label htmlFor="timezone" className="text-sm font-medium">
          {t('timezoneLabel')}
        </label>
        <select
          id="timezone"
          name="timezone"
          defaultValue={defaultTimezone}
          className="border-border focus:ring-primary w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
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
          className="border-border focus:ring-primary w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
        >
          <option value="id">Bahasa Indonesia</option>
          <option value="en">English</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-primary text-primary-foreground press w-full rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
      >
        {isPending ? t('submitting') : t('submit')}
      </button>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </form>
  );
}
