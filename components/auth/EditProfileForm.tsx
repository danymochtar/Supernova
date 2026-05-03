'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import type { Locale } from '@/lib/i18n/config';
import type { UpdateProfileResult, updateProfileAction } from '@/app/[locale]/profile/edit/actions';

interface Props {
  locale: Locale;
  initial: {
    firstName: string;
    middleName: string | null;
    lastName: string;
    dob: { year: number; month: number; day: number };
    timezone: string;
    locale: Locale;
  };
  timezones: { value: string; label: string }[];
  action: typeof updateProfileAction;
}

const ERROR_KEY: Record<Exclude<UpdateProfileResult, { ok: true }>['error'], string> = {
  unauth: 'errorGeneric',
  no_profile: 'errorGeneric',
  invalid_name: 'errorInvalidName',
  invalid_dob: 'errorInvalidDob',
  future_dob: 'errorFutureDob',
  invalid_timezone: 'errorInvalidTimezone',
  generic: 'errorGeneric',
};

export function EditProfileForm({ locale, initial, timezones, action }: Props) {
  const t = useTranslations('editProfile');
  const tWelcome = useTranslations('welcome');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const dobStr = `${initial.dob.year}-${String(initial.dob.month).padStart(2, '0')}-${String(initial.dob.day).padStart(2, '0')}`;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await action(formData);
      if (!result.ok) setError(tWelcome(ERROR_KEY[result.error]));
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-7">
      <aside className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900/40 dark:bg-amber-950/20">
        <p className="text-foreground mb-1 font-medium">{t('warningTitle')}</p>
        <p className="text-muted-foreground">{t('warningBody')}</p>
      </aside>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">{tWelcome('nameLabel')}</legend>
        <p className="text-muted-foreground text-xs">{tWelcome('nameHint')}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <label htmlFor="firstName" className="text-muted-foreground text-xs uppercase tracking-wider">
              {tWelcome('firstNameLabel')}
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              minLength={1}
              maxLength={60}
              defaultValue={initial.firstName}
              autoComplete="given-name"
              className="border-border focus:ring-primary w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="middleName" className="text-muted-foreground text-xs uppercase tracking-wider">
              {tWelcome('middleNameLabel')}
            </label>
            <input
              id="middleName"
              name="middleName"
              type="text"
              maxLength={60}
              defaultValue={initial.middleName ?? ''}
              autoComplete="additional-name"
              className="border-border focus:ring-primary w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="lastName" className="text-muted-foreground text-xs uppercase tracking-wider">
              {tWelcome('lastNameLabel')}
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              required
              minLength={1}
              maxLength={60}
              defaultValue={initial.lastName}
              autoComplete="family-name"
              className="border-border focus:ring-primary w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
            />
          </div>
        </div>
      </fieldset>

      <div className="space-y-2">
        <label htmlFor="dob" className="text-sm font-medium">
          {tWelcome('dobLabel')}
        </label>
        <input
          id="dob"
          name="dob"
          type="date"
          required
          defaultValue={dobStr}
          max={new Date().toISOString().slice(0, 10)}
          className="border-border focus:ring-primary w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="timezone" className="text-sm font-medium">
          {tWelcome('timezoneLabel')}
        </label>
        <select
          id="timezone"
          name="timezone"
          defaultValue={initial.timezone}
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
          {tWelcome('localeLabel')}
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
        className="bg-primary text-primary-foreground w-full rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
      >
        {isPending ? t('submitting') : t('submit')}
      </button>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </form>
  );
}
