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
import { computeHumanDesign } from '@/lib/humanDesign/chart';
import type { HumanDesignChart } from '@/lib/humanDesign/types';

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
  let hdChart: HumanDesignChart | null = null;
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

    // Human Design needs precise lat/lon (the city picker provides them).
    // Without a city, the timezone-center approximation used by the
    // Ascendant compute would push Design Sun across gate boundaries —
    // not accurate enough to claim "this is your HD chart". So we only
    // compute HD when we have real coordinates.
    if (
      typeof birthLat === 'number' &&
      Number.isFinite(birthLat) &&
      typeof birthLon === 'number' &&
      Number.isFinite(birthLon)
    ) {
      hdChart = computeHumanDesign({
        year: parsed.data.dob.year,
        month: parsed.data.dob.month,
        day: parsed.data.dob.day,
        birthTime,
        timezone: birthTimezone,
        lat: birthLat,
        lon: birthLon,
      });
    }
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
    hdType: hdChart?.type ?? null,
    hdStrategy: hdChart?.strategy ?? null,
    hdAuthority: hdChart?.authority ?? null,
    hdProfileConscious: hdChart?.profile.conscious ?? null,
    hdProfileUnconscious: hdChart?.profile.unconscious ?? null,
    hdDefinition: hdChart?.definition ?? null,
    hdIncarnationCross: hdChart?.incarnationCross.name ?? null,
    hdChart: hdChart ?? null,
  });

  revalidatePath(`/${localeChecked}/dashboard`);
  redirect(`/${localeChecked}/dashboard`);
}
