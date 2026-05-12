import type { PersonDailyVibe } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

function toDayMarker(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

// Defense-in-depth: both lookups + deletes scope by userId in addition to
// personId. Person.id is a cuid and Person.userId is FK-locked, so a row
// can only belong to one user — but the extra filter means a stray caller
// can't accidentally read or wipe another user's row by passing a leaked
// personId. Returns null on cross-user attempts.
export async function getPersonVibeForDay(
  userId: string,
  personId: string,
  year: number,
  month: number,
  day: number,
): Promise<PersonDailyVibe | null> {
  return prisma.personDailyVibe.findFirst({
    where: { userId, personId, date: toDayMarker(year, month, day) },
  });
}

export async function deletePersonVibes(userId: string, personId: string): Promise<void> {
  await prisma.personDailyVibe.deleteMany({ where: { userId, personId } });
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

