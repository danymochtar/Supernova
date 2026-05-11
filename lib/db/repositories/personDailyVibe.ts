import type { PersonDailyVibe } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

function toDayMarker(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

export async function getPersonVibeForDay(
  personId: string,
  year: number,
  month: number,
  day: number,
): Promise<PersonDailyVibe | null> {
  return prisma.personDailyVibe.findUnique({
    where: { personId_date: { personId, date: toDayMarker(year, month, day) } },
  });
}

export async function deletePersonVibes(personId: string): Promise<void> {
  await prisma.personDailyVibe.deleteMany({ where: { personId } });
}

export async function createPersonVibe(input: {
  userId: string;
  personId: string;
  year: number;
  month: number;
  day: number;
  locale: string;
  body: string;
  inputTokens: number;
  outputTokens: number;
}): Promise<PersonDailyVibe> {
  return prisma.personDailyVibe.create({
    data: {
      userId: input.userId,
      personId: input.personId,
      date: toDayMarker(input.year, input.month, input.day),
      locale: input.locale,
      body: input.body,
      inputTokens: input.inputTokens,
      outputTokens: input.outputTokens,
    },
  });
}
