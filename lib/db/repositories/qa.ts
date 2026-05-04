import type { Prisma, QaHistory } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

export async function getRecentTurns(
  userId: string,
  limit: number,
): Promise<QaHistory[]> {
  const rows = await prisma.qaHistory.findMany({
    where: { userId, personId: null },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return rows.reverse();
}

/** Get all turns whose createdAt falls inside [start, end). Oldest first. */
export async function getTurnsBetween(
  userId: string,
  start: Date,
  end: Date,
): Promise<QaHistory[]> {
  return prisma.qaHistory.findMany({
    where: {
      userId,
      personId: null,
      createdAt: { gte: start, lt: end },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function saveTurn(input: {
  userId: string;
  question: string;
  answer: string;
  contextSnapshot: Prisma.InputJsonValue;
}): Promise<QaHistory> {
  return prisma.qaHistory.create({
    data: {
      userId: input.userId,
      question: input.question,
      answer: input.answer,
      contextSnapshot: input.contextSnapshot,
    },
  });
}

/** Delete a single turn. Scoped to the userId so users can't delete others'. */
export async function deleteTurn(userId: string, turnId: string): Promise<boolean> {
  const result = await prisma.qaHistory.deleteMany({
    where: { id: turnId, userId },
  });
  return result.count > 0;
}
