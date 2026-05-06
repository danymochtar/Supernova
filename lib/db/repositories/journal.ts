import type { JournalEntry } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

/**
 * Add one or more chat turns to the journal as snapshots. Idempotent on
 * `(userId, sourceTurnId)`: re-adding the same turn won't duplicate.
 */
export async function addToJournal(
  userId: string,
  turns: Array<{ sourceTurnId: string; question: string; answer: string; originalTurnAt: Date }>,
): Promise<{ added: number }> {
  if (turns.length === 0) return { added: 0 };

  const existing = await prisma.journalEntry.findMany({
    where: { userId, sourceTurnId: { in: turns.map((t) => t.sourceTurnId) } },
    select: { sourceTurnId: true },
  });
  const skip = new Set(existing.map((e) => e.sourceTurnId));
  const fresh = turns.filter((t) => !skip.has(t.sourceTurnId));

  if (fresh.length === 0) return { added: 0 };

  await prisma.journalEntry.createMany({
    data: fresh.map((t) => ({
      userId,
      sourceTurnId: t.sourceTurnId,
      question: t.question,
      answer: t.answer,
      originalTurnAt: t.originalTurnAt,
    })),
  });

  return { added: fresh.length };
}

export async function listJournal(userId: string, limit = 200): Promise<JournalEntry[]> {
  return prisma.journalEntry.findMany({
    where: { userId },
    orderBy: { addedAt: 'desc' },
    take: limit,
  });
}

export async function deleteJournalEntry(userId: string, id: string): Promise<boolean> {
  const result = await prisma.journalEntry.deleteMany({ where: { id, userId } });
  return result.count > 0;
}
