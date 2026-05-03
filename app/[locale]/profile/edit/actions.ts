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
    lastName: formData.get('lastName'),
    dob: formData.get('dob'),
    timezone: formData.get('timezone'),
    locale: formData.get('locale'),
  });
  if (!parsed.ok) return { ok: false, error: parsed.error };

  if (!isValidTimezone(parsed.data.timezone)) return { ok: false, error: 'invalid_timezone' };

  const localeChecked: Locale = isLocale(parsed.data.locale) ? parsed.data.locale : 'id';

  await updateProfile(session.user.id, {
    firstName: parsed.data.firstName,
    middleName: parsed.data.middleName,
    lastName: parsed.data.lastName,
    dob: parsed.data.dob,
    timezone: parsed.data.timezone,
    locale: localeChecked,
  });

  revalidatePath(`/${localeChecked}/dashboard`);
  redirect(`/${localeChecked}/dashboard`);
}
