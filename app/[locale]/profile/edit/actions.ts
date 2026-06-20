'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth/requireSession';
import {
  getProfileByUserId,
  updateProfile,
} from '@/lib/db/repositories/profile';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { isValidTimezone } from '@/lib/timezones';
import { parseProfileForm, type ProfileFormError } from '@/lib/profile/validate';
import { computeMoonAndRising } from '@/lib/zodiac/birthChart';

export type UpdateProfileResult =
  | { ok: true }
  | { ok: false; error: ProfileFormError | 'unauth' | 'no_profile' };

export async function updateProfileAction(formData: FormData): Promise<UpdateProfileResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'unauth' };

  const existing = await getProfileByUserId(session.user.id);
  if (!existing) return { ok: false, error: 'no_profile' };

  const parsed = parseProfileForm({
    firstName: formData.get('firstName'),
    middleName: formData.get('middleName') ?? '',
    lastName: formData.get('lastName') ?? '',
    nickname: formData.get('nickname') ?? '',
    dob: formData.get('dob'),
    timezone: formData.get('timezone'),
    locale: formData.get('locale'),
  });
  if (!parsed.ok) return { ok: false, error: parsed.error };

  if (!isValidTimezone(parsed.data.timezone)) return { ok: false, error: 'invalid_timezone' };

  const localeChecked: Locale = isLocale(parsed.data.locale) ? parsed.data.locale : 'id';

  // Resolve birth-chart inputs and compute Moon + Rising on submit.
  // birthTime blank → clear everything (user removed the time).
  const rawBirthTime = formData.get('birthTime');
  const birthTime = typeof rawBirthTime === 'string' && rawBirthTime.trim() ? rawBirthTime.trim() : null;
  const rawCity = formData.get('birthCity');
  const birthCity = typeof rawCity === 'string' && rawCity.trim() ? rawCity.trim() : null;
  const rawLat = formData.get('birthLat');
  const rawLon = formData.get('birthLon');
  const birthLat = typeof rawLat === 'string' && rawLat.trim() ? Number(rawLat) : null;
  const birthLon = typeof rawLon === 'string' && rawLon.trim() ? Number(rawLon) : null;
  const rawBirthTz = formData.get('birthTimezone');
  const birthTimezone = typeof rawBirthTz === 'string' && rawBirthTz.trim()
    ? rawBirthTz.trim()
    : parsed.data.timezone;
  let moonSign: ReturnType<typeof computeMoonAndRising>['moon'] = null;
  let risingSign: ReturnType<typeof computeMoonAndRising>['rising'] = null;
  if (birthTime) {
    const chart = computeMoonAndRising({
      year: parsed.data.dob.year,
      month: parsed.data.dob.month,
      day: parsed.data.dob.day,
      birthTime,
      timezone: birthTimezone,
      lat: birthLat ?? undefined,
      lon: birthLon ?? undefined,
    });
    moonSign = chart.moon;
    risingSign = chart.rising;
  }

  await updateProfile(session.user.id, {
    firstName: parsed.data.firstName,
    middleName: parsed.data.middleName,
    lastName: parsed.data.lastName,
    nickname: parsed.data.nickname,
    dob: parsed.data.dob,
    timezone: parsed.data.timezone,
    locale: localeChecked,
    birthTime,
    birthTimezone: birthTime ? birthTimezone : null,
    birthCity: birthTime ? birthCity : null,
    birthLat: birthTime ? birthLat : null,
    birthLon: birthTime ? birthLon : null,
    moonSign,
    risingSign,
  });

  revalidatePath(`/${localeChecked}/dashboard`);
  redirect(`/${localeChecked}/dashboard`);
}
