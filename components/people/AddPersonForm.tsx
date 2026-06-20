'use client';

import { useMemo, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import type { Locale } from '@/lib/i18n/config';
import type { PersonActionResult, createPersonAction, updatePersonAction } from '@/app/[locale]/people/actions';
import { RELATIONSHIPS } from '@/lib/people/relationships';
import { GLYPH, sunSignFromDob, ZODIAC_SIGNS, type ZodiacSign } from '@/lib/zodiac/signs';

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
    moonSign: ZodiacSign | null;
    risingSign: ZodiacSign | null;
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
            defaultValue={edit?.firstName ?? ''}
            placeholder={t('firstNamePlaceholder')}
            className="border-border focus:ring-primary rounded-lg border bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
          />
          <input
            name="middleName"
            type="text"
            maxLength={60}
            defaultValue={edit?.middleName ?? ''}
            placeholder={t('middleNamePlaceholder')}
            className="border-border focus:ring-primary rounded-lg border bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
          />
          <input
            name="lastName"
            type="text"
            maxLength={60}
            defaultValue={edit?.lastName ?? ''}
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
        <p className="text-muted-foreground text-xs">{tZodiac('placementsHint')}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ZodiacSelect
            id="moonSign"
            name="moonSign"
            label={tZodiac('moonLabel')}
            defaultValue={edit?.moonSign ?? ''}
            placeholder={tZodiac('signPlaceholder')}
            tSign={(s) => tZodiac(`sign.${s}`)}
          />
          <ZodiacSelect
            id="risingSign"
            name="risingSign"
            label={tZodiac('risingLabel')}
            defaultValue={edit?.risingSign ?? ''}
            placeholder={tZodiac('signPlaceholder')}
            tSign={(s) => tZodiac(`sign.${s}`)}
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

/**
 * Small native-select wrapper for a single zodiac placement field.
 * Renders an empty default option (= null = "not entered") plus the 12
 * signs with their unicode glyph for quick visual scan.
 */
function ZodiacSelect({
  id,
  name,
  label,
  defaultValue,
  placeholder,
  tSign,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue: string;
  placeholder: string;
  tSign: (sign: ZodiacSign) => string;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
        {label}
      </label>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue}
        className="border-border focus:ring-primary w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
      >
        <option value="">{placeholder}</option>
        {ZODIAC_SIGNS.map((sign) => (
          <option key={sign} value={sign}>
            {GLYPH[sign]} {tSign(sign)}
          </option>
        ))}
      </select>
    </div>
  );
}
