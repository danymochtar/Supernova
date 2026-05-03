'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getSession } from '@/lib/auth/requireSession';
import { updatePersonalNotes } from '@/lib/db/repositories/profile';
import { isLocale, type Locale } from '@/lib/i18n/config';

const schema = z.object({
  notes: z.string().max(4000).optional(),
  locale: z.string().min(2),
});

export type NotesActionResult = { ok: true } | { ok: false; error: 'unauth' | 'invalid' };

export async function savePersonalNotes(formData: FormData): Promise<NotesActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'unauth' };

  const parsed = schema.safeParse({
    notes: formData.get('notes') ?? '',
    locale: formData.get('locale') ?? 'id',
  });
  if (!parsed.success) return { ok: false, error: 'invalid' };

  await updatePersonalNotes(session.user.id, parsed.data.notes ?? null);
  const localeChecked: Locale = isLocale(parsed.data.locale) ? parsed.data.locale : 'id';
  revalidatePath(`/${localeChecked}/me`);
  return { ok: true };
}
