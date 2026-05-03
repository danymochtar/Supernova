import type { ConversationSummary, SummaryKind } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

function dayUTC(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

export async function getSummary(
  userId: string,
  kind: SummaryKind,
  periodStart: Date,
): Promise<ConversationSummary | null> {
  return prisma.conversationSummary.findUnique({
    where: { userId_kind_periodStart: { userId, kind, periodStart } },
  });
}

export async function listSummaries(
  userId: string,
  kind: SummaryKind,
  limit = 20,
): Promise<ConversationSummary[]> {
  return prisma.conversationSummary.findMany({
    where: { userId, kind },
    orderBy: { periodStart: 'desc' },
    take: limit,
  });
}

export async function createSummary(input: {
  userId: string;
  kind: SummaryKind;
  periodStart: Date;
  periodEnd: Date;
  summary: string;
  turnCount: number;
}): Promise<ConversationSummary> {
  return prisma.conversationSummary.upsert({
    where: {
      userId_kind_periodStart: {
        userId: input.userId,
        kind: input.kind,
        periodStart: input.periodStart,
      },
    },
    create: input,
    update: {
      periodEnd: input.periodEnd,
      summary: input.summary,
      turnCount: input.turnCount,
    },
  });
}

export const dayMarker = dayUTC;
