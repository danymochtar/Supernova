'use server';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/requireSession';
import { createProfile, getProfileByUserId } from '@/lib/db/repositories/profile';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { isValidTimezone } from '@/lib/timezones';
import { parseProfileForm, type ProfileFormError } from '@/lib/profile/validate';

export type OnboardingActionResult =
  | { ok: true }
  | { ok: false; error: ProfileFormError | 'unauth' | 'profile_exists' };

export async function saveOnboardingProfile(formData: FormData): Promise<OnboardingActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'unauth' };

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

  const existing = await getProfileByUserId(session.user.id);
  if (existing) return { ok: false, error: 'profile_exists' };

  const localeChecked: Locale = isLocale(parsed.data.locale) ? parsed.data.locale : 'id';

  await createProfile(session.user.id, {
    firstName: parsed.data.firstName,
    middleName: parsed.data.middleName,
    lastName: parsed.data.lastName,
    nickname: parsed.data.nickname,
    dob: parsed.data.dob,
    timezone: parsed.data.timezone,
    locale: localeChecked,
  });

  redirect(`/${localeChecked}/dashboard`);
}
