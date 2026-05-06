import type { JournalEntry, Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

export interface JournalSourceSnapshot {
  turnId: string;
  question: string;
  answer: string;
  createdAt: string; // ISO
}

export interface JournalEntryView {
  id: string;
  userId: string;
  narrative: string;
  sources: JournalSourceSnapshot[];
  rangeStart: Date;
  rangeEnd: Date;
  note: string | null;
  addedAt: Date;
}

function toView(row: JournalEntry): JournalEntryView {
  // Prisma types `sources` as Prisma.JsonValue. Decode permissively.
  const sources: JournalSourceSnapshot[] = Array.isArray(row.sources)
    ? (row.sources as unknown as JournalSourceSnapshot[]).filter(
        (s): s is JournalSourceSnapshot =>
          !!s &&
          typeof s === 'object' &&
          typeof s.turnId === 'string' &&
          typeof s.question === 'string' &&
          typeof s.answer === 'string',
      )
    : [];
  return {
    id: row.id,
    userId: row.userId,
    narrative: row.narrative,
    sources,
    rangeStart: row.rangeStart,
    rangeEnd: row.rangeEnd,
    note: row.note,
    addedAt: row.addedAt,
  };
}

export interface CreateJournalInput {
  userId: string;
  narrative: string;
  sources: JournalSourceSnapshot[];
  rangeStart: Date;
  rangeEnd: Date;
}

export async function createJournalEntry(input: CreateJournalInput): Promise<JournalEntryView> {
  const row = await prisma.journalEntry.create({
    data: {
      userId: input.userId,
      narrative: input.narrative,
      sources: input.sources as unknown as Prisma.InputJsonValue,
      rangeStart: input.rangeStart,
      rangeEnd: input.rangeEnd,
    },
  });
  return toView(row);
}

export async function listJournal(userId: string, limit = 200): Promise<JournalEntryView[]> {
  const rows = await prisma.journalEntry.findMany({
    where: { userId },
    orderBy: { addedAt: 'desc' },
    take: limit,
  });
  return rows.map(toView);
}

export async function deleteJournalEntry(userId: string, id: string): Promise<boolean> {
  const result = await prisma.journalEntry.deleteMany({ where: { id, userId } });
  return result.count > 0;
}
