'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getSession } from '@/lib/auth/requireSession';
import { addToJournal, deleteJournalEntry } from '@/lib/db/repositories/journal';
import { prisma } from '@/lib/db/prisma';

export type AddToJournalResult =
  | { ok: true; added: number; skipped: number }
  | { ok: false; error: 'unauth' | 'invalid' | 'no_turns' | 'generic' };

const addSchema = z.object({
  turnIds: z.array(z.string().min(1)).min(1).max(50),
});

/**
 * Snapshot the chosen chat turns into the user's journal. Called from the
 * chat thread's multi-select mode. Idempotent — re-adding the same turn is
 * a no-op (counted as skipped).
 */
export async function addToJournalAction(input: { turnIds: string[] }): Promise<AddToJournalResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'unauth' };

  const parsed = addSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid' };

  // Pull the actual turn rows scoped to this user — defends against caller
  // passing IDs of someone else's turns. Only main-thread turns (personId
  // null) are journalable from the curhat tab.
  const rows = await prisma.qaHistory.findMany({
    where: { id: { in: parsed.data.turnIds }, userId: session.user.id, personId: null },
    select: { id: true, question: true, answer: true, createdAt: true },
  });
  if (rows.length === 0) return { ok: false, error: 'no_turns' };

  try {
    const result = await addToJournal(
      session.user.id,
      rows.map((r) => ({
        sourceTurnId: r.id,
        question: r.question,
        answer: r.answer,
        originalTurnAt: r.createdAt,
      })),
    );
    revalidatePath('/[locale]/journal', 'page');
    return { ok: true, added: result.added, skipped: rows.length - result.added };
  } catch (err) {
    console.error('[journal] addToJournal failed', err);
    return { ok: false, error: 'generic' };
  }
}

export type DeleteJournalResult = { ok: boolean };

export async function deleteJournalAction(input: { id: string }): Promise<DeleteJournalResult> {
  const session = await getSession();
  if (!session) return { ok: false };
  const ok = await deleteJournalEntry(session.user.id, input.id);
  if (ok) revalidatePath('/[locale]/journal', 'page');
  return { ok };
}
