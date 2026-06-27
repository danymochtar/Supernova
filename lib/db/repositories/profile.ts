import { Prisma } from '@prisma/client';
import type {
  HDAuthority as PrismaHDAuthority,
  HDDefinition as PrismaHDDefinition,
  HDStrategy as PrismaHDStrategy,
  HDType as PrismaHDType,
  Profile as ProfileRow,
  ZodiacSign as PrismaZodiacSign,
} from '@prisma/client';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { DEFAULT_LOCALE } from '@/lib/i18n/locales';
import { prisma } from '@/lib/db/prisma';
import type { BirthDate } from '@/lib/numerology/types';
import { fromPrismaEnum, toPrismaEnum, type ZodiacSign } from '@/lib/zodiac/signs';
import type {
  HDAuthority,
  HDDefinition,
  HDStrategy,
  HDType,
  HumanDesignChart,
} from '@/lib/humanDesign/types';

export interface ProfileInput {
  firstName: string;
  middleName?: string | null;
  lastName?: string | null;
  nickname?: string | null;
  dob: BirthDate;
  timezone: string;
  locale: Locale;
  /** Computed cache for Moon / Rising — caller resolves via
   *  `computeMoonAndRising` from `birthTime` + `birthTimezone`. */
  moonSign?: ZodiacSign | null;
  risingSign?: ZodiacSign | null;
  /** Local "HH:MM" birth time in `birthTimezone`. */
  birthTime?: string | null;
  /** IANA timezone of the birth instant — defaults to `timezone` on
   *  the form when not explicitly set. */
  birthTimezone?: string | null;
  /** Display label for the chosen city. */
  birthCity?: string | null;
  /** Precise birth-place coords. */
  birthLat?: number | null;
  birthLon?: number | null;
  /** Computed Human Design chart fields. All optional — callers pass
   *  these together (or all-null on birth-data clear). */
  hdType?: HDType | null;
  hdStrategy?: HDStrategy | null;
  hdAuthority?: HDAuthority | null;
  hdProfileConscious?: number | null;
  hdProfileUnconscious?: number | null;
  hdDefinition?: HDDefinition | null;
  hdIncarnationCross?: string | null;
  hdChart?: HumanDesignChart | null;
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
  autoJournal: boolean;
  reminderEnabled: boolean;
  reminderTime: string | null;
  /** Optional Moon placement for the user — computed cache. */
  moonSign: ZodiacSign | null;
  risingSign: ZodiacSign | null;
  birthTime: string | null;
  birthTimezone: string | null;
  birthCity: string | null;
  birthLat: number | null;
  birthLon: number | null;
  /** Cached Human Design chart fields — null until birth data is set
   *  with precise lat/lon. The full bodygraph (centers, channels, all
   *  26 planetary activations) lives in `hdChart`. */
  hdType: HDType | null;
  hdStrategy: HDStrategy | null;
  hdAuthority: HDAuthority | null;
  hdProfileConscious: number | null;
  hdProfileUnconscious: number | null;
  hdDefinition: HDDefinition | null;
  hdIncarnationCross: string | null;
  hdChart: HumanDesignChart | null;
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
      moonSign: input.moonSign ? (toPrismaEnum(input.moonSign) as PrismaZodiacSign) : null,
      risingSign: input.risingSign ? (toPrismaEnum(input.risingSign) as PrismaZodiacSign) : null,
      birthTime: input.birthTime ?? null,
      birthTimezone: input.birthTimezone ?? null,
      birthCity: input.birthCity ?? null,
      birthLat: input.birthLat ?? null,
      birthLon: input.birthLon ?? null,
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
      // Zodiac fields are passed when present; `undefined` means
      // "don't touch" (Prisma omits the column from the UPDATE).
      // Explicit `null` clears the value back to "not set".
      ...(input.moonSign !== undefined
        ? { moonSign: input.moonSign ? (toPrismaEnum(input.moonSign) as PrismaZodiacSign) : null }
        : {}),
      ...(input.risingSign !== undefined
        ? { risingSign: input.risingSign ? (toPrismaEnum(input.risingSign) as PrismaZodiacSign) : null }
        : {}),
      ...(input.birthTime !== undefined ? { birthTime: input.birthTime ?? null } : {}),
      ...(input.birthTimezone !== undefined ? { birthTimezone: input.birthTimezone ?? null } : {}),
      ...(input.birthCity !== undefined ? { birthCity: input.birthCity ?? null } : {}),
      ...(input.birthLat !== undefined ? { birthLat: input.birthLat ?? null } : {}),
      ...(input.birthLon !== undefined ? { birthLon: input.birthLon ?? null } : {}),
      // HD fields. Same `undefined` = leave-alone semantics; `null`
      // explicitly clears (used when the user removes birthTime).
      ...(input.hdType !== undefined ? { hdType: (input.hdType as PrismaHDType | null) ?? null } : {}),
      ...(input.hdStrategy !== undefined ? { hdStrategy: (input.hdStrategy as PrismaHDStrategy | null) ?? null } : {}),
      ...(input.hdAuthority !== undefined ? { hdAuthority: (input.hdAuthority as PrismaHDAuthority | null) ?? null } : {}),
      ...(input.hdProfileConscious !== undefined ? { hdProfileConscious: input.hdProfileConscious ?? null } : {}),
      ...(input.hdProfileUnconscious !== undefined ? { hdProfileUnconscious: input.hdProfileUnconscious ?? null } : {}),
      ...(input.hdDefinition !== undefined ? { hdDefinition: (input.hdDefinition as PrismaHDDefinition | null) ?? null } : {}),
      ...(input.hdIncarnationCross !== undefined ? { hdIncarnationCross: input.hdIncarnationCross ?? null } : {}),
      ...(input.hdChart !== undefined
        ? { hdChart: input.hdChart ? (input.hdChart as unknown as Prisma.InputJsonValue) : Prisma.JsonNull }
        : {}),
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
    autoJournal: row.autoJournal,
    reminderEnabled: row.reminderEnabled,
    reminderTime: row.reminderTime,
    moonSign: fromPrismaEnum(row.moonSign),
    risingSign: fromPrismaEnum(row.risingSign),
    birthTime: row.birthTime,
    birthTimezone: row.birthTimezone,
    birthCity: row.birthCity,
    birthLat: row.birthLat,
    birthLon: row.birthLon,
    hdType: (row.hdType as HDType | null) ?? null,
    hdStrategy: (row.hdStrategy as HDStrategy | null) ?? null,
    hdAuthority: (row.hdAuthority as HDAuthority | null) ?? null,
    hdProfileConscious: row.hdProfileConscious ?? null,
    hdProfileUnconscious: row.hdProfileUnconscious ?? null,
    hdDefinition: (row.hdDefinition as HDDefinition | null) ?? null,
    hdIncarnationCross: row.hdIncarnationCross ?? null,
    hdChart: (row.hdChart as unknown as HumanDesignChart | null) ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** Update only the optional zodiac placements. Sun is never stored. */
export async function updateZodiacPlacements(
  userId: string,
  placements: { moonSign: ZodiacSign | null; risingSign: ZodiacSign | null },
): Promise<void> {
  await prisma.profile.update({
    where: { userId },
    data: {
      moonSign: placements.moonSign ? (toPrismaEnum(placements.moonSign) as PrismaZodiacSign) : null,
      risingSign: placements.risingSign ? (toPrismaEnum(placements.risingSign) as PrismaZodiacSign) : null,
    },
  });
}

export interface PreferenceUpdate {
  theme?: Theme;
  tone?: Tone;
  locale?: Locale;
  showKarmicDebt?: boolean;
  preferredModel?: string | null;
  autoJournal?: boolean;
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
