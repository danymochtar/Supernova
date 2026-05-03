'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { FeedbackRating } from '@prisma/client';
import { getSession } from '@/lib/auth/requireSession';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { upsertFeedback } from '@/lib/db/repositories/feedback';
import { contextFromInstant } from '@/lib/numerology';
import { isLocale, type Locale } from '@/lib/i18n/config';

const RATINGS = ['GREAT', 'GOOD', 'NEUTRAL', 'OFF', 'HARD'] as const satisfies readonly FeedbackRating[];

const schema = z.object({
  rating: z.enum(RATINGS),
  note: z.string().max(500).optional(),
  tags: z.array(z.string().min(1).max(40)).max(10).optional(),
  locale: z.string().min(2),
});

export type FeedbackResult =
  | { ok: true }
  | { ok: false; error: 'unauth' | 'no_profile' | 'invalid' | 'generic' };

export async function submitFeedback(formData: FormData): Promise<FeedbackResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'unauth' };
  const profile = await getProfileByUserId(session.user.id);
  if (!profile) return { ok: false, error: 'no_profile' };

  // tags arrive as a comma-separated string from the form
  const rawTags = String(formData.get('tags') ?? '');
  const tags = rawTags
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0);

  const parsed = schema.safeParse({
    rating: formData.get('rating'),
    note: formData.get('note') || undefined,
    tags,
    locale: formData.get('locale'),
  });
  if (!parsed.success) return { ok: false, error: 'invalid' };

  const ctx = contextFromInstant(new Date(), profile.timezone);
  await upsertFeedback({
    userId: session.user.id,
    year: ctx.year,
    month: ctx.month,
    day: ctx.day,
    rating: parsed.data.rating,
    note: parsed.data.note?.trim() || null,
    tags: parsed.data.tags ?? [],
  });

  const localeChecked: Locale = isLocale(parsed.data.locale) ? parsed.data.locale : 'id';
  revalidatePath(`/${localeChecked}/dashboard`);
  return { ok: true };
}
