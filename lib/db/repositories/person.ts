import type { Person, Prisma, Relationship } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import type { BirthDate } from '@/lib/numerology/types';

export interface PersonInput {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  dob: BirthDate;
  relationship: Relationship;
  notes?: string | null;
}

export interface PersonView {
  id: string;
  userId: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  fullName: string;
  dob: BirthDate;
  relationship: Relationship;
  notes: string | null;
  createdAt: Date;
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

function toView(row: Person): PersonView {
  return {
    id: row.id,
    userId: row.userId,
    firstName: row.firstName,
    middleName: row.middleName,
    lastName: row.lastName,
    fullName: joinName(row.firstName, row.middleName, row.lastName),
    dob: toBirthDate(row.dob),
    relationship: row.relationship,
    notes: row.notes,
    createdAt: row.createdAt,
  };
}

export async function listPeople(userId: string): Promise<PersonView[]> {
  const rows = await prisma.person.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });
  return rows.map(toView);
}

export async function countPeople(userId: string): Promise<number> {
  return prisma.person.count({ where: { userId } });
}

export async function getPerson(userId: string, id: string): Promise<PersonView | null> {
  const row = await prisma.person.findUnique({ where: { id } });
  if (!row || row.userId !== userId) return null;
  return toView(row);
}

export async function createPerson(userId: string, input: PersonInput): Promise<PersonView> {
  const row = await prisma.person.create({
    data: {
      userId,
      firstName: input.firstName,
      middleName: input.middleName?.trim() || null,
      lastName: input.lastName,
      dob: toDateUTC(input.dob),
      relationship: input.relationship,
      notes: input.notes ?? null,
    } satisfies Prisma.PersonUncheckedCreateInput,
  });
  return toView(row);
}

export async function updatePerson(
  userId: string,
  id: string,
  input: PersonInput,
): Promise<PersonView | null> {
  const existing = await prisma.person.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) return null;
  const row = await prisma.person.update({
    where: { id },
    data: {
      firstName: input.firstName,
      middleName: input.middleName?.trim() || null,
      lastName: input.lastName,
      dob: toDateUTC(input.dob),
      relationship: input.relationship,
      notes: input.notes?.trim() || null,
    },
  });
  return toView(row);
}

export async function deletePerson(userId: string, id: string): Promise<boolean> {
  const row = await prisma.person.findUnique({ where: { id } });
  if (!row || row.userId !== userId) return false;
  await prisma.person.delete({ where: { id } });
  return true;
}
