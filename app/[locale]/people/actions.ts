'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getSession } from '@/lib/auth/requireSession';
import {
  countPeople,
  createPerson,
  deletePerson,
  getPerson,
  updatePerson,
} from '@/lib/db/repositories/person';
import { deleteCachedByKeyContains } from '@/lib/db/repositories/numerologyCache';
import { deletePersonVibes } from '@/lib/db/repositories/personDailyVibe';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { displayName } from '@/lib/profile/displayName';
import { profileFormSchema, type ProfileFormError } from '@/lib/profile/validate';
import { RELATIONSHIPS } from '@/lib/people/relationships';
import {
  SUGGESTED_BIRTH_TIME,
  guessBirthCityFromName,
} from '@/lib/people/smartDefaults';
import { computeMoonAndRising } from '@/lib/zodiac/birthChart';

/**
 * Pull birthTime + birthTimezone from FormData and resolve Moon + Rising
 * via the ephemeris. Returns nulls for everything when birthTime isn't
 * provided — the read path uses null to mean "user hasn't entered this".
 */
function deriveBirthChart(
  formData: FormData,
  dob: { year: number; month: number; day: number },
  fallbackTimezone: string,
  /** Full name — feeds the name→city guess when the form submits no
   *  city. Optional to keep back-compat with existing callers; without
   *  it the guess falls back to null and only the locale hint fires. */
  fullNameForGuess?: string,
  /** Active locale — feeds the "if id → Jakarta" fallback. */
  activeLocale?: string,
  /** True on create, false on edit. In edit mode we never override a
   *  user's cleared-out field with a guess; the empty field is the
   *  user's intent. */
  allowSmartDefaults: boolean = true,
): {
  birthTime: string | null;
  birthTimezone: string | null;
  birthCity: string | null;
  birthLat: number | null;
  birthLon: number | null;
  moonSign: 'aries' | 'taurus' | 'gemini' | 'cancer' | 'leo' | 'virgo' | 'libra' | 'scorpio' | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces' | null;
  risingSign: 'aries' | 'taurus' | 'gemini' | 'cancer' | 'leo' | 'virgo' | 'libra' | 'scorpio' | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces' | null;
} {
  const rawTime = formData.get('birthTime');
  let birthTime = typeof rawTime === 'string' && rawTime.trim() ? rawTime.trim() : null;
  const rawCity = formData.get('birthCity');
  let birthCity = typeof rawCity === 'string' && rawCity.trim() ? rawCity.trim() : null;
  const rawLat = formData.get('birthLat');
  const rawLon = formData.get('birthLon');
  const rawTz = formData.get('birthTimezone');
  let birthLat = typeof rawLat === 'string' && rawLat.trim() ? Number(rawLat) : null;
  let birthLon = typeof rawLon === 'string' && rawLon.trim() ? Number(rawLon) : null;
  let birthTimezone = typeof rawTz === 'string' && rawTz.trim() ? rawTz.trim() : null;

  // SERVER-SIDE SMART DEFAULTS (create only) — matches the client-side
  // prefill in AddPersonForm.tsx. Belt-and-braces so a new person always
  // gets moon+rising computed even if the client-side prefill didn't
  // stick (browser autofill, uncontrolled input quirk, etc.).
  if (allowSmartDefaults) {
    if (!birthTime) birthTime = SUGGESTED_BIRTH_TIME;
    if (birthLat == null || birthLon == null) {
      const guess = guessBirthCityFromName(fullNameForGuess ?? '', activeLocale);
      if (guess) {
        birthCity = birthCity ?? guess.label;
        birthLat = guess.lat;
        birthLon = guess.lon;
        birthTimezone = birthTimezone ?? guess.timezone;
      }
    }
  }

  if (!birthTime) {
    return {
      birthTime: null,
      birthTimezone: null,
      birthCity: null,
      birthLat: null,
      birthLon: null,
      moonSign: null,
      risingSign: null,
    };
  }
  const tz = birthTimezone ?? fallbackTimezone;
  const { moon, rising } = computeMoonAndRising({
    year: dob.year,
    month: dob.month,
    day: dob.day,
    birthTime,
    timezone: tz,
    lat: birthLat ?? undefined,
    lon: birthLon ?? undefined,
  });
  return {
    birthTime,
    birthTimezone: tz,
    birthCity,
    birthLat,
    birthLon,
    moonSign: moon,
    risingSign: rising,
  };
}

// Per-user cap on the number of Person rows. Was 1 in the locked plan as a
// soft gate on free tier; user removed it for the MVP.
const PEOPLE_LIMIT = 999;

const personSchema = profileFormSchema.extend({
  relationship: z.enum(RELATIONSHIPS),
  notes: z.string().max(500).optional(),
});

export type PersonActionResult =
  | { ok: true }
  | { ok: false; error: ProfileFormError | 'unauth' | 'limit_reached' | 'not_found' };

function parseDob(dob: string):
  | { ok: true; year: number; month: number; day: number }
  | { ok: false; error: 'invalid_dob' | 'future_dob' } {
  const [yStr, mStr, dStr] = dob.split('-');
  const year = Number(yStr);
  const month = Number(mStr);
  const day = Number(dStr);
  const validate = new Date(Date.UTC(year, month - 1, day));
  if (
    validate.getUTCFullYear() !== year ||
    validate.getUTCMonth() !== month - 1 ||
    validate.getUTCDate() !== day
  ) {
    return { ok: false, error: 'invalid_dob' };
  }
  if (validate.getTime() > Date.now()) return { ok: false, error: 'future_dob' };
  return { ok: true, year, month, day };
}

export async function createPersonAction(formData: FormData): Promise<PersonActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'unauth' };

  const existing = await countPeople(session.user.id);
  if (existing >= PEOPLE_LIMIT) return { ok: false, error: 'limit_reached' };

  const parsed = personSchema.safeParse({
    firstName: formData.get('firstName'),
    middleName: formData.get('middleName') ?? '',
    lastName: formData.get('lastName'),
    nickname: formData.get('nickname') ?? '',
    dob: formData.get('dob'),
    timezone: 'UTC', // person doesn't carry a tz; satisfy schema
    locale: String(formData.get('locale') ?? 'id'),
    relationship: formData.get('relationship'),
    notes: formData.get('notes') || undefined,
  });
  if (!parsed.success) {
    const path = parsed.error.issues[0]?.path[0];
    if (
      path === 'firstName' ||
      path === 'lastName' ||
      path === 'middleName' ||
      path === 'nickname'
    ) {
      return { ok: false, error: 'invalid_name' };
    }
    if (path === 'dob') return { ok: false, error: 'invalid_dob' };
    return { ok: false, error: 'generic' };
  }
  const dob = parseDob(parsed.data.dob);
  if (!dob.ok) return { ok: false, error: dob.error };

  const localeChecked: Locale = isLocale(parsed.data.locale) ? parsed.data.locale : 'id';

  const userTimezone = (await getProfileByUserId(session.user.id))?.timezone ?? 'Asia/Jakarta';
  const fullNameForGuess = [
    parsed.data.firstName,
    parsed.data.middleName,
    parsed.data.lastName,
  ]
    .filter(Boolean)
    .join(' ');
  const chart = deriveBirthChart(
    formData,
    { year: dob.year, month: dob.month, day: dob.day },
    userTimezone,
    fullNameForGuess,
    localeChecked,
    true,
  );

  await createPerson(session.user.id, {
    firstName: parsed.data.firstName,
    middleName: parsed.data.middleName || null,
    lastName: parsed.data.lastName || null,
    nickname: parsed.data.nickname || null,
    dob: { year: dob.year, month: dob.month, day: dob.day },
    relationship: parsed.data.relationship,
    notes: parsed.data.notes?.trim() || null,
    birthTime: chart.birthTime,
    birthTimezone: chart.birthTimezone,
    birthCity: chart.birthCity,
    birthLat: chart.birthLat,
    birthLon: chart.birthLon,
    moonSign: chart.moonSign,
    risingSign: chart.risingSign,
  });

  revalidatePath(`/${localeChecked}/people`);
  redirect(`/${localeChecked}/people`);
}

export async function updatePersonAction(formData: FormData): Promise<PersonActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'unauth' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { ok: false, error: 'not_found' };

  const target = await getPerson(session.user.id, id);
  if (!target) return { ok: false, error: 'not_found' };

  const parsed = personSchema.safeParse({
    firstName: formData.get('firstName'),
    middleName: formData.get('middleName') ?? '',
    lastName: formData.get('lastName') ?? '',
    nickname: formData.get('nickname') ?? '',
    dob: formData.get('dob'),
    timezone: 'UTC',
    locale: String(formData.get('locale') ?? 'id'),
    relationship: formData.get('relationship'),
    notes: formData.get('notes') || undefined,
  });
  if (!parsed.success) {
    const path = parsed.error.issues[0]?.path[0];
    if (
      path === 'firstName' ||
      path === 'lastName' ||
      path === 'middleName' ||
      path === 'nickname'
    ) {
      return { ok: false, error: 'invalid_name' };
    }
    if (path === 'dob') return { ok: false, error: 'invalid_dob' };
    return { ok: false, error: 'generic' };
  }
  const dob = parseDob(parsed.data.dob);
  if (!dob.ok) return { ok: false, error: dob.error };

  const localeChecked: Locale = isLocale(parsed.data.locale) ? parsed.data.locale : 'id';

  const userTimezone =
    (await getProfileByUserId(session.user.id))?.timezone ?? 'Asia/Jakarta';
  const chart = deriveBirthChart(
    formData,
    { year: dob.year, month: dob.month, day: dob.day },
    userTimezone,
    undefined,
    localeChecked,
    false,
  );

  await updatePerson(session.user.id, id, {
    firstName: parsed.data.firstName,
    middleName: parsed.data.middleName || null,
    lastName: parsed.data.lastName || null,
    nickname: parsed.data.nickname || null,
    dob: { year: dob.year, month: dob.month, day: dob.day },
    relationship: parsed.data.relationship,
    notes: parsed.data.notes?.trim() || null,
    birthTime: chart.birthTime,
    birthTimezone: chart.birthTimezone,
    birthCity: chart.birthCity,
    birthLat: chart.birthLat,
    birthLon: chart.birthLon,
    moonSign: chart.moonSign,
    risingSign: chart.risingSign,
  });

  // Invalidate every AI body that bakes in this person's name/DOB. Cache keys
  // for the relationship profile + pair narratives all embed `:${id}:`, so a
  // substring delete wipes them in one query. Daily vibe rows are deleted by
  // personId. Next page render regenerates fresh with the new name.
  await Promise.all([
    deleteCachedByKeyContains(session.user.id, `:${id}:`),
    deletePersonVibes(session.user.id, id),
  ]);

  revalidatePath(`/${localeChecked}/people`);
  revalidatePath(`/${localeChecked}/people/${id}`);
  revalidatePath(`/${localeChecked}/people/${id}/compatibility`);
  revalidatePath(`/${localeChecked}/people/${id}/profile`);
  redirect(`/${localeChecked}/people/${id}`);
}

export type DeletePersonResult =
  | { ok: true }
  | { ok: false; error: 'unauth' | 'not_found' | 'generic' };

/**
 * Thin Promise<void> wrapper around deletePersonAction for use with
 * `<form action={...}>`. The list page submit just kicks off the redirect
 * and doesn't surface failures (the button-based delete on the detail
 * page is the path that needs error visibility).
 */
export async function deletePersonFormAction(formData: FormData): Promise<void> {
  await deletePersonAction(formData);
}

export async function deletePersonAction(
  formData: FormData,
): Promise<DeletePersonResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'unauth' };
  const id = String(formData.get('id') ?? '');
  const locale = String(formData.get('locale') ?? 'id');
  const localeChecked: Locale = isLocale(locale) ? locale : 'id';
  if (!id) return { ok: false, error: 'not_found' };
  const removed = await deletePerson(session.user.id, id);
  if (!removed) return { ok: false, error: 'not_found' };
  revalidatePath(`/${localeChecked}/people`);
  // redirect() throws — control never returns past this line on success.
  redirect(`/${localeChecked}/people`);
}

export type PersonVibeResult =
  | { ok: true; body: string }
  | { ok: false; error: 'unauth' | 'not_found' | 'no_profile' | 'generic' };

/**
 * On-demand "what's their vibe today" AI briefing for a Person. Caller
 * triggers this on tap; the underlying generator caches by (personId, date)
 * so re-taps the same day return the same body without re-billing the model.
 */
export async function generatePersonVibeAction({
  personId,
}: {
  personId: string;
}): Promise<PersonVibeResult> {
  const { getProfileByUserId } = await import('@/lib/db/repositories/profile');
  const { generatePersonDailyVibe } = await import('@/lib/ai/personDailyVibe');

  const session = await getSession();
  if (!session) return { ok: false, error: 'unauth' };
  const profile = await getProfileByUserId(session.user.id);
  if (!profile) return { ok: false, error: 'no_profile' };
  const person = await getPerson(session.user.id, personId);
  if (!person) return { ok: false, error: 'not_found' };

  const body = await generatePersonDailyVibe(
    {
      id: session.user.id,
      fullName: profile.fullName,
      // displayName = nickname || firstName — the prose address form.
      firstName: displayName(profile),
      dob: profile.dob,
      timezone: profile.timezone,
      locale: profile.locale,
      preferredModel: profile.preferredModel,
    },
    {
      id: person.id,
      fullName: person.fullName,
      firstName: displayName(person),
      dob: person.dob,
      relationship: person.relationship,
    },
  );
  if (!body) return { ok: false, error: 'generic' };
  return { ok: true, body };
}
