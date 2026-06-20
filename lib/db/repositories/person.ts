import type { Person, Prisma, Relationship, ZodiacSign as PrismaZodiacSign } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { relationshipPriority } from '@/lib/compatibility/lens';
import type { BirthDate } from '@/lib/numerology/types';
import { fromPrismaEnum, toPrismaEnum, type ZodiacSign } from '@/lib/zodiac/signs';

export interface PersonInput {
  firstName: string;
  middleName?: string | null;
  lastName?: string | null;
  nickname?: string | null;
  dob: BirthDate;
  relationship: Relationship;
  notes?: string | null;
  /** Computed cache for the person's Moon sign. Caller resolves this
   *  via `computeMoonAndRising` from `birthTime` + `birthTimezone`
   *  before passing in — the repo stores it verbatim. */
  moonSign?: ZodiacSign | null;
  risingSign?: ZodiacSign | null;
  /** Local "HH:MM" birth time in `birthTimezone`. */
  birthTime?: string | null;
  /** IANA timezone of the birth instant. */
  birthTimezone?: string | null;
  /** Display label for the chosen city ("Surabaya, Jawa Timur, Indonesia"). */
  birthCity?: string | null;
  /** Precise birth-place coordinates, sourced from the city picker. */
  birthLat?: number | null;
  birthLon?: number | null;
}

export interface PersonView {
  id: string;
  userId: string;
  firstName: string;
  middleName: string | null;
  lastName: string | null;
  nickname: string | null;
  fullName: string;
  dob: BirthDate;
  relationship: Relationship;
  notes: string | null;
  moonSign: ZodiacSign | null;
  risingSign: ZodiacSign | null;
  birthTime: string | null;
  birthTimezone: string | null;
  birthCity: string | null;
  birthLat: number | null;
  birthLon: number | null;
  createdAt: Date;
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

function toView(row: Person): PersonView {
  return {
    id: row.id,
    userId: row.userId,
    firstName: row.firstName,
    middleName: row.middleName,
    lastName: row.lastName,
    nickname: row.nickname,
    fullName: joinName(row.firstName, row.middleName, row.lastName),
    dob: toBirthDate(row.dob),
    relationship: row.relationship,
    notes: row.notes,
    moonSign: fromPrismaEnum(row.moonSign),
    risingSign: fromPrismaEnum(row.risingSign),
    birthTime: row.birthTime,
    birthTimezone: row.birthTimezone,
    birthCity: row.birthCity,
    birthLat: row.birthLat,
    birthLon: row.birthLon,
    createdAt: row.createdAt,
  };
}

/** Translate our lowercase sign id → Prisma's uppercase enum, or null. */
function asPrismaSign(sign: ZodiacSign | null | undefined): PrismaZodiacSign | null {
  return sign ? (toPrismaEnum(sign) as PrismaZodiacSign) : null;
}

export async function listPeople(userId: string): Promise<PersonView[]> {
  const rows = await prisma.person.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });
  // Sort in app code: closest relationship type first (PARTNER → OTHER),
  // then by createdAt as tiebreak. Postgres enum sort order isn't aligned
  // with our priority ordering, so we do it here.
  return rows
    .map(toView)
    .sort((a, b) => {
      const pa = relationshipPriority(a.relationship);
      const pb = relationshipPriority(b.relationship);
      if (pa !== pb) return pa - pb;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
}

export async function countPeople(userId: string): Promise<number> {
  return prisma.person.count({ where: { userId } });
}

export async function getPerson(userId: string, id: string): Promise<PersonView | null> {
  // Scope by (id, userId) at the query — defense-in-depth so even a leaked
  // person.id can't surface another user's row. A `findUnique({ where: { id } })`
  // + post-fetch ownership check would also work, but doing the filter at
  // the DB level avoids ever holding the foreign row in memory.
  const row = await prisma.person.findFirst({ where: { id, userId } });
  return row ? toView(row) : null;
}

export async function createPerson(userId: string, input: PersonInput): Promise<PersonView> {
  const row = await prisma.person.create({
    data: {
      userId,
      firstName: input.firstName,
      middleName: input.middleName?.trim() || null,
      lastName: input.lastName?.trim() || null,
      nickname: input.nickname?.trim() || null,
      dob: toDateUTC(input.dob),
      relationship: input.relationship,
      notes: input.notes ?? null,
      moonSign: asPrismaSign(input.moonSign),
      risingSign: asPrismaSign(input.risingSign),
      birthTime: input.birthTime ?? null,
      birthTimezone: input.birthTimezone ?? null,
      birthCity: input.birthCity ?? null,
      birthLat: input.birthLat ?? null,
      birthLon: input.birthLon ?? null,
    } satisfies Prisma.PersonUncheckedCreateInput,
  });
  return toView(row);
}

export async function updatePerson(
  userId: string,
  id: string,
  input: PersonInput,
): Promise<PersonView | null> {
  // Single round-trip: updateMany filters by (id, userId) so ownership is
  // enforced at the query level, then we read back the row to return its
  // full shape. `count === 0` means either the row doesn't exist or it
  // belongs to a different user — surfaced as null to the caller.
  const result = await prisma.person.updateMany({
    where: { id, userId },
    data: {
      firstName: input.firstName,
      middleName: input.middleName?.trim() || null,
      lastName: input.lastName?.trim() || null,
      nickname: input.nickname?.trim() || null,
      dob: toDateUTC(input.dob),
      relationship: input.relationship,
      notes: input.notes?.trim() || null,
      moonSign: asPrismaSign(input.moonSign),
      risingSign: asPrismaSign(input.risingSign),
      birthTime: input.birthTime ?? null,
      birthTimezone: input.birthTimezone ?? null,
      birthCity: input.birthCity ?? null,
      birthLat: input.birthLat ?? null,
      birthLon: input.birthLon ?? null,
    },
  });
  if (result.count === 0) return null;
  // Re-scoped read-back even though updateMany already proved ownership —
  // keeps every prisma call in this file uniformly userId-bound.
  const row = await prisma.person.findFirst({ where: { id, userId } });
  return row ? toView(row) : null;
}

export async function deletePerson(userId: string, id: string): Promise<boolean> {
  // Same defense-in-depth pattern: scope the delete by (id, userId) so a
  // stray caller passing the wrong userId can't wipe another user's row.
  const result = await prisma.person.deleteMany({ where: { id, userId } });
  return result.count > 0;
}
