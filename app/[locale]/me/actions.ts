'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getSession } from '@/lib/auth/requireSession';
import { prisma } from '@/lib/db/prisma';
import {
  appendPersonalNotes,
  updatePreferences,
} from '@/lib/db/repositories/profile';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { LOCALE_CODES } from '@/lib/i18n/locales';

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

  // Append-mode: each submission adds the entry to the existing notes
  // body (with an `\n\n---\n\n` separator) rather than replacing it,
  // so the user can drop in additional context over time without
  // re-typing what's already saved.
  await appendPersonalNotes(session.user.id, parsed.data.notes ?? '');
  const localeChecked: Locale = isLocale(parsed.data.locale) ? parsed.data.locale : 'id';
  revalidatePath(`/${localeChecked}/me`);
  return { ok: true };
}

// ───────────────────────────────────────────────────────────────────────
// Preferences
// ───────────────────────────────────────────────────────────────────────

const themeEnum = z.enum(['light', 'dark', 'auto']);
const toneEnum = z.enum(['warm', 'direct', 'playful']);
const chatModeEnum = z.enum(['listen', 'probe', 'practical', 'reflective']);
const modelEnum = z.enum(['default', 'claude-sonnet-4-6', 'claude-opus-4-7', 'claude-haiku-4-5']);

const localeEnum = z.enum(LOCALE_CODES as unknown as [string, ...string[]]);

/**
 * Persist a language choice on the user's profile. The client is
 * responsible for navigating to the new `/[locale]/…` URL after this
 * succeeds — the action only writes to the DB.
 */
export async function setLocaleAction(locale: Locale): Promise<void> {
  const session = await getSession();
  if (!session) return;
  const parsed = localeEnum.safeParse(locale);
  if (!parsed.success) return;
  await updatePreferences(session.user.id, { locale: parsed.data as Locale });
}

export async function setTheme(theme: 'light' | 'dark' | 'auto'): Promise<void> {
  const session = await getSession();
  if (!session) return;
  const parsed = themeEnum.safeParse(theme);
  if (!parsed.success) return;
  await updatePreferences(session.user.id, { theme: parsed.data });
}

export async function setTone(tone: 'warm' | 'direct' | 'playful'): Promise<void> {
  const session = await getSession();
  if (!session) return;
  const parsed = toneEnum.safeParse(tone);
  if (!parsed.success) return;
  await updatePreferences(session.user.id, { tone: parsed.data });
}

export async function setChatMode(
  mode: 'listen' | 'probe' | 'practical' | 'reflective',
): Promise<void> {
  const session = await getSession();
  if (!session) return;
  const parsed = chatModeEnum.safeParse(mode);
  if (!parsed.success) return;
  await updatePreferences(session.user.id, { chatMode: parsed.data });
}

export async function setShowKarmicDebt(show: boolean): Promise<void> {
  const session = await getSession();
  if (!session) return;
  await updatePreferences(session.user.id, { showKarmicDebt: Boolean(show) });
}

export async function setAutoJournal(enabled: boolean): Promise<void> {
  const session = await getSession();
  if (!session) return;
  await updatePreferences(session.user.id, { autoJournal: Boolean(enabled) });
}

export async function setPreferredModel(model: string): Promise<void> {
  const session = await getSession();
  if (!session) return;
  const parsed = modelEnum.safeParse(model);
  if (!parsed.success) return;
  await updatePreferences(session.user.id, {
    preferredModel: parsed.data === 'default' ? null : parsed.data,
  });
}

const reminderSchema = z.object({
  enabled: z.boolean(),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional().nullable(),
});

export async function setReminder(input: { enabled: boolean; time: string | null }): Promise<void> {
  const session = await getSession();
  if (!session) return;
  const parsed = reminderSchema.safeParse(input);
  if (!parsed.success) return;
  await updatePreferences(session.user.id, {
    reminderEnabled: parsed.data.enabled,
    reminderTime: parsed.data.time ?? null,
  });
}

// ───────────────────────────────────────────────────────────────────────
// Data export
// ───────────────────────────────────────────────────────────────────────

export async function exportUserData(): Promise<{ ok: true; payload: string } | { ok: false }> {
  const session = await getSession();
  if (!session) return { ok: false };

  const userId = session.user.id;
  const [profile, people, readings, qa, summaries, feedback, usage] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.person.findMany({ where: { userId } }),
    prisma.dailyReading.findMany({ where: { userId }, orderBy: { date: 'asc' } }),
    prisma.qaHistory.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
    prisma.conversationSummary.findMany({ where: { userId }, orderBy: { periodStart: 'asc' } }),
    prisma.dailyFeedback.findMany({ where: { userId }, orderBy: { date: 'asc' } }),
    prisma.aiUsage.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
  ]);

  const payload = JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      userId,
      email: session.user.email,
      profile,
      people,
      dailyReadings: readings,
      chatTurns: qa,
      conversationSummaries: summaries,
      dailyFeedback: feedback,
      aiUsage: usage,
    },
    null,
    2,
  );
  return { ok: true, payload };
}

// ───────────────────────────────────────────────────────────────────────
// Delete account (irreversible — User cascade wipes everything)
// ───────────────────────────────────────────────────────────────────────

export async function deleteAccount(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) return;

  const confirm = String(formData.get('confirm') ?? '');
  // Require literal "DELETE" typed in to avoid accidental clicks.
  if (confirm !== 'DELETE') return;

  const locale = String(formData.get('locale') ?? 'id');
  const localeChecked: Locale = isLocale(locale) ? locale : 'id';

  await prisma.user.delete({ where: { id: session.user.id } });
  redirect(`/${localeChecked}/login`);
}
