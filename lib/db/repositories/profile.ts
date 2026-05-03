import type { Profile as ProfileRow } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import type { BirthDate } from '@/lib/numerology/types';

export interface ProfileInput {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  dob: BirthDate;
  timezone: string;
  locale: 'id' | 'en';
}

export interface ProfileView {
  id: string;
  userId: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  /** Derived: firstName + middle (if any) + lastName, joined by spaces. */
  fullName: string;
  dob: BirthDate;
  timezone: string;
  locale: 'id' | 'en';
  createdAt: Date;
  updatedAt: Date;
}

function toBirthDate(d: Date): BirthDate {
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

function toDateUTC({ year, month, day }: BirthDate): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

function joinName(firstName: string, middleName: string | null, lastName: string): string {
  return [firstName.trim(), middleName?.trim() || null, lastName.trim()]
    .filter((s): s is string => Boolean(s))
    .join(' ');
}

export async function createProfile(userId: string, input: ProfileInput): Promise<ProfileView> {
  const row = await prisma.profile.create({
    data: {
      userId,
      firstName: input.firstName,
      middleName: input.middleName?.trim() || null,
      lastName: input.lastName,
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
      lastName: input.lastName,
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
  const locale = row.locale === 'en' ? 'en' : 'id';
  return {
    id: row.id,
    userId: row.userId,
    firstName: row.firstName,
    middleName: row.middleName,
    lastName: row.lastName,
    fullName: joinName(row.firstName, row.middleName, row.lastName),
    dob: toBirthDate(row.dob),
    timezone: row.timezone,
    locale,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
