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
import { isLocale, type Locale } from '@/lib/i18n/config';
import { profileFormSchema, type ProfileFormError } from '@/lib/profile/validate';

// Per Decision #4: 1 person for everyone in MVP. Branch on profile.tier later.
const PEOPLE_LIMIT = 1;

const RELATIONSHIPS = ['PARTNER', 'FAMILY', 'FRIEND', 'COLLEAGUE', 'OTHER'] as const;

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
    dob: formData.get('dob'),
    timezone: 'UTC', // person doesn't carry a tz; satisfy schema
    locale: String(formData.get('locale') ?? 'id'),
    relationship: formData.get('relationship'),
    notes: formData.get('notes') || undefined,
  });
  if (!parsed.success) {
    const path = parsed.error.issues[0]?.path[0];
    if (path === 'firstName' || path === 'lastName' || path === 'middleName') {
      return { ok: false, error: 'invalid_name' };
    }
    if (path === 'dob') return { ok: false, error: 'invalid_dob' };
    return { ok: false, error: 'generic' };
  }
  const dob = parseDob(parsed.data.dob);
  if (!dob.ok) return { ok: false, error: dob.error };

  const localeChecked: Locale = isLocale(parsed.data.locale) ? parsed.data.locale : 'id';

  await createPerson(session.user.id, {
    firstName: parsed.data.firstName,
    middleName: parsed.data.middleName || null,
    lastName: parsed.data.lastName,
    dob: { year: dob.year, month: dob.month, day: dob.day },
    relationship: parsed.data.relationship,
    notes: parsed.data.notes?.trim() || null,
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
    lastName: formData.get('lastName'),
    dob: formData.get('dob'),
    timezone: 'UTC',
    locale: String(formData.get('locale') ?? 'id'),
    relationship: formData.get('relationship'),
    notes: formData.get('notes') || undefined,
  });
  if (!parsed.success) {
    const path = parsed.error.issues[0]?.path[0];
    if (path === 'firstName' || path === 'lastName' || path === 'middleName') {
      return { ok: false, error: 'invalid_name' };
    }
    if (path === 'dob') return { ok: false, error: 'invalid_dob' };
    return { ok: false, error: 'generic' };
  }
  const dob = parseDob(parsed.data.dob);
  if (!dob.ok) return { ok: false, error: dob.error };

  const localeChecked: Locale = isLocale(parsed.data.locale) ? parsed.data.locale : 'id';

  await updatePerson(session.user.id, id, {
    firstName: parsed.data.firstName,
    middleName: parsed.data.middleName || null,
    lastName: parsed.data.lastName,
    dob: { year: dob.year, month: dob.month, day: dob.day },
    relationship: parsed.data.relationship,
    notes: parsed.data.notes?.trim() || null,
  });

  revalidatePath(`/${localeChecked}/people`);
  redirect(`/${localeChecked}/people/${id}`);
}

export async function deletePersonAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) return;
  const id = String(formData.get('id') ?? '');
  const locale = String(formData.get('locale') ?? 'id');
  const localeChecked: Locale = isLocale(locale) ? locale : 'id';
  if (!id) return;
  await deletePerson(session.user.id, id);
  revalidatePath(`/${localeChecked}/people`);
  redirect(`/${localeChecked}/people`);
}
