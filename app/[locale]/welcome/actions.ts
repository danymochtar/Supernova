'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getSession } from '@/lib/auth/requireSession';
import { createProfile, getProfileByUserId } from '@/lib/db/repositories/profile';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { isValidTimezone } from '@/lib/timezones';

const onboardingSchema = z.object({
  fullName: z
    .string()
    .min(2)
    .max(120)
    .regex(/[A-Za-zÀ-ÿ]/, 'name_must_contain_letters'),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timezone: z.string().min(1),
  locale: z.string().min(2),
});

export type OnboardingActionResult =
  | { ok: true }
  | { ok: false; error: 'unauth' | 'invalid_name' | 'invalid_dob' | 'future_dob' | 'invalid_timezone' | 'profile_exists' | 'generic' };

export async function saveOnboardingProfile(formData: FormData): Promise<OnboardingActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'unauth' };

  const parsed = onboardingSchema.safeParse({
    fullName: formData.get('fullName'),
    dob: formData.get('dob'),
    timezone: formData.get('timezone'),
    locale: formData.get('locale'),
  });
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    if (firstIssue?.path[0] === 'fullName') return { ok: false, error: 'invalid_name' };
    if (firstIssue?.path[0] === 'dob') return { ok: false, error: 'invalid_dob' };
    return { ok: false, error: 'generic' };
  }

  const { fullName, dob, timezone, locale } = parsed.data;

  if (!isValidTimezone(timezone)) return { ok: false, error: 'invalid_timezone' };

  const localeChecked: Locale = isLocale(locale) ? locale : 'id';

  const [yStr, mStr, dStr] = dob.split('-');
  const year = Number(yStr);
  const month = Number(mStr);
  const day = Number(dStr);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return { ok: false, error: 'invalid_dob' };
  }
  // Validate the date round-trips (catches Feb 30 etc.)
  const validate = new Date(Date.UTC(year, month - 1, day));
  if (
    validate.getUTCFullYear() !== year ||
    validate.getUTCMonth() !== month - 1 ||
    validate.getUTCDate() !== day
  ) {
    return { ok: false, error: 'invalid_dob' };
  }
  if (validate.getTime() > Date.now()) return { ok: false, error: 'future_dob' };

  const existing = await getProfileByUserId(session.user.id);
  if (existing) return { ok: false, error: 'profile_exists' };

  await createProfile(session.user.id, {
    fullName: fullName.trim(),
    dob: { year, month, day },
    timezone,
    locale: localeChecked,
  });

  redirect(`/${localeChecked}/dashboard`);
}
