'use client';

import { useMemo, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import type { Locale } from '@/lib/i18n/config';
import type { PersonActionResult, createPersonAction, updatePersonAction } from '@/app/[locale]/people/actions';
import { RELATIONSHIPS } from '@/lib/people/relationships';
import { GLYPH, sunSignFromDob } from '@/lib/zodiac/signs';
import { BirthCityCombobox } from '@/components/people/BirthCityCombobox';
import {
  SUGGESTED_BIRTH_TIME,
  guessBirthCityFromName,
} from '@/lib/people/smartDefaults';

const ERROR_KEY: Record<Exclude<PersonActionResult, { ok: true }>['error'], string> = {
  unauth: 'errorGeneric',
  limit_reached: 'errorLimit',
  not_found: 'errorGeneric',
  invalid_name: 'errorInvalidName',
  invalid_dob: 'errorInvalidDob',
  future_dob: 'errorFutureDob',
  invalid_timezone: 'errorGeneric',
  generic: 'errorGeneric',
};

interface Props {
  locale: Locale;
  action: typeof createPersonAction | typeof updatePersonAction;
  /** When editing, pass id + initial values. */
  edit?: {
    id: string;
    firstName: string;
    middleName: string | null;
    lastName: string | null;
    nickname: string | null;
    dob: { year: number; month: number; day: number };
    relationship: (typeof RELATIONSHIPS)[number];
    notes: string | null;
    birthTime: string | null;
    birthCity: string | null;
    birthLat: number | null;
    birthLon: number | null;
    birthTimezone: string | null;
  };
}

export function AddPersonForm({ locale, action, edit }: Props) {
  const t = useTranslations('peopleForm');
  const tRel = useTranslations('people.relationship');
  const tZodiac = useTranslations('zodiac');
  const [error, setError] = useState<string | null>(null);
  const [relationship, setRelationship] = useState<(typeof RELATIONSHIPS)[number]>(
    edit?.relationship ?? 'PARTNER',
  );
  const [isPending, startTransition] = useTransition();

  // Controlled name inputs so we can compute a birth-city suggestion
  // from the full name whenever it changes. See lib/people/smartDefaults.ts
  // for the guessing heuristic (Malay Islamic particles → KL; else, when
  // the app locale is Indonesian → Jakarta; else null).
  const [firstName, setFirstName] = useState(edit?.firstName ?? '');
  const [middleName, setMiddleName] = useState(edit?.middleName ?? '');
  const [lastName, setLastName] = useState(edit?.lastName ?? '');
  const fullNameForGuess = [firstName, middleName, lastName]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(' ');
  const suggestedCity = useMemo(
    // In edit mode we never suggest — the row already has whatever the
    // user picked before. Only new persons get the auto-guess.
    () => (edit ? null : guessBirthCityFromName(fullNameForGuess, locale)),
    [edit, fullNameForGuess, locale],
  );

  const dobStr = edit
    ? `${edit.dob.year}-${String(edit.dob.month).padStart(2, '0')}-${String(edit.dob.day).padStart(2, '0')}`
    : '';

  // Live Sun preview tied to the DOB input. Recomputes on every keystroke
  // — pure function, no debounce needed. The preview is a small read-only
  // line; the actual Sun value is re-derived server-side from `dob`.
  const [dobInput, setDobInput] = useState(dobStr);
  const sunPreview = useMemo(() => {
    if (!dobInput) return null;
    const [yStr, mStr, dStr] = dobInput.split('-');
    const year = Number(yStr);
    const month = Number(mStr);
    const day = Number(dStr);
    if (!year || !month || !day) return null;
    return sunSignFromDob({ year, month, day });
  }, [dobInput]);

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
      {edit ? <input type="hidden" name="id" value={edit.id} /> : null}

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">{t('nameLabel')}</legend>
        <p className="text-muted-foreground text-xs">{t('nameHint')}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input
            name="firstName"
            type="text"
            required
            minLength={1}
            maxLength={60}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder={t('firstNamePlaceholder')}
            className="border-border focus:ring-primary rounded-lg border bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
          />
          <input
            name="middleName"
            type="text"
            maxLength={60}
            value={middleName}
            onChange={(e) => setMiddleName(e.target.value)}
            placeholder={t('middleNamePlaceholder')}
            className="border-border focus:ring-primary rounded-lg border bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
          />
          <input
            name="lastName"
            type="text"
            maxLength={60}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder={t('lastNamePlaceholder')}
            className="border-border focus:ring-primary rounded-lg border bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
          />
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
          defaultValue={edit?.nickname ?? ''}
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
          defaultValue={dobStr}
          onChange={(e) => setDobInput(e.target.value)}
          max={new Date().toISOString().slice(0, 10)}
          className="border-border focus:ring-primary w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
        />
        {sunPreview ? (
          <p className="text-muted-foreground text-xs">
            {tZodiac('sunLabel')} · {GLYPH[sunPreview]} {tZodiac(`sign.${sunPreview}`)}
          </p>
        ) : null}
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">{tZodiac('placementsLabel')}</legend>
        <p className="text-muted-foreground text-xs">{tZodiac('birthChartHint')}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label
              htmlFor="birthTime"
              className="text-muted-foreground text-xs font-medium uppercase tracking-wider"
            >
              {tZodiac('birthTimeLabel')}
            </label>
            <input
              id="birthTime"
              name="birthTime"
              type="time"
              // Noon (12:00) is the astrological convention for "birth
              // time unknown" — Sun stays accurate, Moon/Rising get a
              // reasonable midpoint estimate. Users can edit anytime.
              defaultValue={edit?.birthTime ?? SUGGESTED_BIRTH_TIME}
              className="border-border focus:ring-primary w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
            />
            {!edit ? (
              <p className="text-muted-foreground text-[11px] italic">
                {tZodiac('birthTimeSuggestion')}
              </p>
            ) : null}
          </div>
          <BirthCityCombobox
            defaultLabel={edit?.birthCity ?? null}
            defaultLat={edit?.birthLat ?? null}
            defaultLon={edit?.birthLon ?? null}
            defaultTimezone={edit?.birthTimezone ?? null}
            suggested={suggestedCity}
            suggestionHint={
              suggestedCity ? tZodiac('birthCitySuggestion') : undefined
            }
            label={tZodiac('birthCityLabel')}
            placeholder={tZodiac('birthCityPlaceholder')}
            hint={tZodiac('birthCityHint')}
            emptyText={tZodiac('birthCityEmpty')}
          />
        </div>
      </fieldset>

      <div className="space-y-2">
        <label htmlFor="relationship" className="text-sm font-medium">
          {t('relationshipLabel')}
        </label>
        <select
          id="relationship"
          name="relationship"
          value={relationship}
          onChange={(e) =>
            setRelationship(e.target.value as (typeof RELATIONSHIPS)[number])
          }
          className="border-border focus:ring-primary w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
        >
          {RELATIONSHIPS.map((r) => (
            <option key={r} value={r}>
              {tRel(r)}
            </option>
          ))}
        </select>
        {relationship === 'PARENT' ? (
          <p className="text-muted-foreground text-xs leading-relaxed">
            {t('parentHint')}
          </p>
        ) : null}
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
          defaultValue={edit?.notes ?? ''}
          placeholder={t('notesPlaceholder')}
          className="border-border focus:ring-primary w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
        />
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
