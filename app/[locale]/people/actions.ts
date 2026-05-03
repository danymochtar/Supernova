'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getSession } from '@/lib/auth/requireSession';
import {
  countPeople,
  createPerson,
  deletePerson,
} from '@/lib/db/repositories/person';
import { isLocale, type Locale } from '@/lib/i18n/config';

// Per Decision #4: 1 person for everyone in MVP. Branch on profile.tier later.
const PEOPLE_LIMIT = 1;

const RELATIONSHIPS = ['PARTNER', 'FAMILY', 'FRIEND', 'COLLEAGUE', 'OTHER'] as const;

const createSchema = z.object({
  fullName: z
    .string()
    .min(2)
    .max(120)
    .regex(/[A-Za-zÀ-ÿ]/, 'name_must_contain_letters'),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  relationship: z.enum(RELATIONSHIPS),
  notes: z.string().max(500).optional(),
  locale: z.string().min(2),
});

export type CreatePersonResult =
  | { ok: true }
  | { ok: false; error: 'unauth' | 'limit_reached' | 'invalid_name' | 'invalid_dob' | 'future_dob' | 'generic' };

export async function createPersonAction(formData: FormData): Promise<CreatePersonResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'unauth' };

  const existing = await countPeople(session.user.id);
  if (existing >= PEOPLE_LIMIT) return { ok: false, error: 'limit_reached' };

  const parsed = createSchema.safeParse({
    fullName: formData.get('fullName'),
    dob: formData.get('dob'),
    relationship: formData.get('relationship'),
    notes: formData.get('notes') || undefined,
    locale: formData.get('locale'),
  });
  if (!parsed.success) {
    const path = parsed.error.issues[0]?.path[0];
    if (path === 'fullName') return { ok: false, error: 'invalid_name' };
    if (path === 'dob') return { ok: false, error: 'invalid_dob' };
    return { ok: false, error: 'generic' };
  }

  const { fullName, dob, relationship, notes, locale } = parsed.data;
  const localeChecked: Locale = isLocale(locale) ? locale : 'id';

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

  await createPerson(session.user.id, {
    fullName: fullName.trim(),
    dob: { year, month, day },
    relationship,
    notes: notes?.trim() || null,
  });

  revalidatePath(`/${localeChecked}/people`);
  redirect(`/${localeChecked}/people`);
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
