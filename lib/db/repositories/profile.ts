import type { Profile as ProfileRow } from '@prisma/client';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { DEFAULT_LOCALE } from '@/lib/i18n/locales';
import { prisma } from '@/lib/db/prisma';
import type { BirthDate } from '@/lib/numerology/types';

export interface ProfileInput {
  firstName: string;
  middleName?: string | null;
  lastName?: string | null;
  nickname?: string | null;
  dob: BirthDate;
  timezone: string;
  locale: Locale;
}

export type Theme = 'light' | 'dark' | 'auto';
export type Tone = 'warm' | 'direct' | 'playful';

export interface ProfileView {
  id: string;
  userId: string;
  firstName: string;
  middleName: string | null;
  lastName: string | null;
  nickname: string | null;
  /** Derived: firstName + middle (if any) + lastName (if any), joined by spaces. */
  fullName: string;
  dob: BirthDate;
  timezone: string;
  locale: Locale;
  personalNotes: string | null;
  theme: Theme;
  tone: Tone;
  showKarmicDebt: boolean;
  preferredModel: string | null;
  reminderEnabled: boolean;
  reminderTime: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function toBirthDate(d: Date): BirthDate {
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

function toDateUTC({ year, month, day }: BirthDate): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

function joinName(
  firstName: string,
  middleName: string | null,
  lastName: string | null,
): string {
  return [firstName.trim(), middleName?.trim() || null, lastName?.trim() || null]
    .filter((s): s is string => Boolean(s))
    .join(' ');
}

export async function createProfile(userId: string, input: ProfileInput): Promise<ProfileView> {
  const row = await prisma.profile.create({
    data: {
      userId,
      firstName: input.firstName,
      middleName: input.middleName?.trim() || null,
      lastName: input.lastName?.trim() || null,
      nickname: input.nickname?.trim() || null,
      dob: toDateUTC(input.dob),
      timezone: input.timezone,
      locale: input.locale,
    },
  });
  return toView(row);
}

export async function updateProfile(userId: string, input: ProfileInput): Promise<ProfileView> {
  const row = await prisma.profile.update({
    where: { userId },
    data: {
      firstName: input.firstName,
      middleName: input.middleName?.trim() || null,
      lastName: input.lastName?.trim() || null,
      nickname: input.nickname?.trim() || null,
      dob: toDateUTC(input.dob),
      timezone: input.timezone,
      locale: input.locale,
    },
  });
  // Invalidate any cached numerology artifacts that depend on name+dob (e.g.
  // the AI-synthesized About Me text). Daily readings stay — they're keyed
  // on date and will naturally roll forward.
  await prisma.numerologyCache.deleteMany({ where: { userId } });
  return toView(row);
}

export async function getProfileByUserId(userId: string): Promise<ProfileView | null> {
  const row = await prisma.profile.findUnique({ where: { userId } });
  return row ? toView(row) : null;
}

function toView(row: ProfileRow): ProfileView {
  // Validate against the registry — older rows may have legacy 'en' values
  // from before the EN lockdown, and once we re-enable EN those become
  // valid again. Anything outside the supported set falls back to ID.
  const locale: Locale = isLocale(row.locale) ? row.locale : DEFAULT_LOCALE;
  const theme: Theme =
    row.theme === 'light' || row.theme === 'dark' ? row.theme : 'auto';
  const tone: Tone =
    row.tone === 'direct' || row.tone === 'playful' ? row.tone : 'warm';
  return {
    id: row.id,
    userId: row.userId,
    firstName: row.firstName,
    middleName: row.middleName,
    lastName: row.lastName,
    nickname: row.nickname,
    fullName: joinName(row.firstName, row.middleName, row.lastName),
    dob: toBirthDate(row.dob),
    timezone: row.timezone,
    locale,
    personalNotes: row.personalNotes,
    theme,
    tone,
    showKarmicDebt: row.showKarmicDebt,
    preferredModel: row.preferredModel,
    reminderEnabled: row.reminderEnabled,
    reminderTime: row.reminderTime,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export interface PreferenceUpdate {
  theme?: Theme;
  tone?: Tone;
  locale?: Locale;
  showKarmicDebt?: boolean;
  preferredModel?: string | null;
  reminderEnabled?: boolean;
  reminderTime?: string | null;
}

export async function updatePreferences(userId: string, prefs: PreferenceUpdate): Promise<void> {
  await prisma.profile.update({ where: { userId }, data: prefs });
}

/** Update only the free-form personal notes; doesn't touch name/DOB. */
export async function updatePersonalNotes(userId: string, notes: string | null): Promise<void> {
  await prisma.profile.update({
    where: { userId },
    data: { personalNotes: notes && notes.trim() ? notes.trim() : null },
  });
}

/**
 * Append-mode write — used by the settings page where each submission
 * adds a new note instead of replacing the saved body. Existing notes
 * stay in place with an `\n\n---\n\n` separator. If the combined length
 * exceeds `maxChars`, the OLDEST content is dropped from the front so
 * the newest entry always fits.
 */
export async function appendPersonalNotes(
  userId: string,
  entry: string,
  maxChars = 4000,
): Promise<void> {
  const trimmed = entry.trim();
  if (!trimmed) return;
  const row = await prisma.profile.findUnique({
    where: { userId },
    select: { personalNotes: true },
  });
  const existing = row?.personalNotes?.trim() ?? '';
  const combined = existing ? `${existing}\n\n---\n\n${trimmed}` : trimmed;
  const final =
    combined.length > maxChars
      ? combined.slice(combined.length - maxChars)
      : combined;
  await prisma.profile.update({
    where: { userId },
    data: { personalNotes: final },
  });
}
