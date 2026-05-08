import type { CareerEntry } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

export interface CareerInput {
  title: string;
  company?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  description?: string | null;
  vocationId: string;
  matchScore: number;
  insight?: string | null;
}

export async function listCareerEntries(userId: string): Promise<CareerEntry[]> {
  return prisma.careerEntry.findMany({
    where: { userId },
    orderBy: [
      // Current roles (endDate null) first, then most recent start.
      { endDate: { sort: 'desc', nulls: 'first' } },
      { startDate: 'desc' },
    ],
  });
}

export async function replaceCareerEntries(
  userId: string,
  entries: CareerInput[],
): Promise<number> {
  // Wholesale replace — uploading a new resume overwrites the prior set.
  const result = await prisma.$transaction(async (tx) => {
    await tx.careerEntry.deleteMany({ where: { userId } });
    if (entries.length === 0) return 0;
    const created = await tx.careerEntry.createMany({
      data: entries.map((e) => ({
        userId,
        title: e.title,
        company: e.company ?? null,
        startDate: e.startDate ?? null,
        endDate: e.endDate ?? null,
        description: e.description ?? null,
        vocationId: e.vocationId,
        matchScore: e.matchScore,
        insight: e.insight ?? null,
      })),
    });
    return created.count;
  });
  return result;
}

export async function deleteAllCareerEntries(userId: string): Promise<void> {
  await prisma.careerEntry.deleteMany({ where: { userId } });
}
