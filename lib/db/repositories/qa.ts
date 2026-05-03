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
