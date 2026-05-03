import type { Profile as ProfileRow } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import type { BirthDate } from '@/lib/numerology/types';

export interface ProfileInput {
  fullName: string;
  dob: BirthDate;
  timezone: string;
  locale: 'id' | 'en';
}

export interface ProfileView {
  id: string;
  userId: string;
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

export async function createProfile(userId: string, input: ProfileInput): Promise<ProfileView> {
  const row = await prisma.profile.create({
    data: {
      userId,
      fullName: input.fullName,
      dob: toDateUTC(input.dob),
      timezone: input.timezone,
      locale: input.locale,
    },
  });
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
    fullName: row.fullName,
    dob: toBirthDate(row.dob),
    timezone: row.timezone,
    locale,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
