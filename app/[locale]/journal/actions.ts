'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getSession } from '@/lib/auth/requireSession';
import {
  createJournalEntry,
  deleteJournalEntry,
  toggleActionItem,
  type JournalActionItem,
  type JournalSourceSnapshot,
} from '@/lib/db/repositories/journal';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { synthesizeJournalNarrative } from '@/lib/ai/journal';
import { detectUserPronoun } from '@/lib/ai/prompts/journal';
import { prisma } from '@/lib/db/prisma';

export type AddToJournalResult =
  | { ok: true; added: number; skipped: number }
  | { ok: false; error: 'unauth' | 'invalid' | 'no_turns' | 'no_profile' | 'synth_failed' | 'generic' };

const addSchema = z.object({
  turnIds: z.array(z.string().min(1)).min(1).max(20),
});

function fmtTurnAt(d: Date, tz: string): string {
  // We don't need surgical local-time precision; a stable readable string
  // for prompt context is enough. Use ISO with short-form TZ.
  try {
    return new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: tz,
    }).format(d);
  } catch {
    return d.toISOString();
  }
}

/**
 * Snapshot the chosen chat turns into a journal entry. Calls Claude to
 * synthesize a first-person narrative in the user's tone, then persists
 * narrative + sources as a single row. If synthesis fails, the action
 * returns an error so the caller can surface it — we don't silently store
 * an entry without a narrative since the whole point of the feature is
 * the synthesized voice.
 */
export async function addToJournalAction(input: { turnIds: string[] }): Promise<AddToJournalResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'unauth' };

  const parsed = addSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid' };

  const profile = await getProfileByUserId(session.user.id);
  if (!profile) return { ok: false, error: 'no_profile' };

  // Pull the actual turn rows scoped to this user — defends against caller
  // passing IDs of someone else's turns. Only main-thread turns
  // (personId null) are journalable from the curhat tab.
  const rows = await prisma.qaHistory.findMany({
    where: {
      id: { in: parsed.data.turnIds },
      userId: session.user.id,
      personId: null,
    },
    orderBy: { createdAt: 'asc' },
    select: { id: true, question: true, answer: true, createdAt: true },
  });
  if (rows.length === 0) return { ok: false, error: 'no_turns' };

  const sources: JournalSourceSnapshot[] = rows.map((r) => ({
    turnId: r.id,
    question: r.question,
    answer: r.answer,
    createdAt: r.createdAt.toISOString(),
  }));

  // Detect the user's habitual first-person pronoun from a wider window
  // of recent chat — 3-5 selected turns alone may not have enough signal,
  // but the last ~80 turns reliably surface whether the user writes in
  // gw / gue / gua / aku / saya. The journal narrative locks to that
  // pronoun so it doesn't read like someone else's voice.
  const recentForPronoun = await prisma.qaHistory.findMany({
    where: { userId: session.user.id, personId: null },
    orderBy: { createdAt: 'desc' },
    take: 80,
    select: { question: true },
  });
  const pronoun = detectUserPronoun(recentForPronoun);

  const synth = await synthesizeJournalNarrative(session.user.id, {
    locale: profile.locale,
    firstName: profile.firstName,
    tone: profile.tone,
    pronoun,
    turns: rows.map((r) => ({
      question: r.question,
      answer: r.answer,
      at: fmtTurnAt(r.createdAt, profile.timezone),
    })),
    preferredModel: profile.preferredModel,
  });

  if (!synth) return { ok: false, error: 'synth_failed' };

  try {
    await createJournalEntry({
      userId: session.user.id,
      narrative: synth.narrative,
      sources,
      rangeStart: rows[0]!.createdAt,
      rangeEnd: rows[rows.length - 1]!.createdAt,
      reframe: synth.reframe || null,
      emotion: synth.emotion || null,
      theme: synth.theme || null,
      actionItemDrafts: synth.actionItems,
    });
    revalidatePath('/[locale]/journal', 'page');
    return { ok: true, added: 1, skipped: 0 };
  } catch (err) {
    console.error('[journal] persist failed', err);
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

export type ToggleActionItemResult =
  | { ok: true; item: JournalActionItem }
  | { ok: false; error: 'unauth' | 'not_found' };

/**
 * Toggle a single action item's completed state inside a journal entry.
 * Repo-side scoped by (entryId, userId) so passing a leaked entryId
 * from another user returns not_found.
 */
export async function toggleActionItemAction(input: {
  entryId: string;
  itemId: string;
  completed: boolean;
}): Promise<ToggleActionItemResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'unauth' };
  const item = await toggleActionItem(
    session.user.id,
    input.entryId,
    input.itemId,
    input.completed,
  );
  if (!item) return { ok: false, error: 'not_found' };
  revalidatePath('/[locale]/journal', 'page');
  return { ok: true, item };
}

export type GenerateAutoJournalResult =
  | { ok: true; created: number; daysProcessed: number }
  | { ok: false; error: 'unauth' | 'no_profile' | 'generic' };

/**
 * Backfill / auto-generate journal entries from past chat conversations.
 * Clusters each complete past day by topic and synthesizes one entry per
 * substantive cluster. Idempotent — turns already covered by an existing
 * entry are skipped, so it never overwrites previously-journaled
 * dates/events. Used both by the manual "generate from past chats"
 * button and the auto-trigger when the autoJournal setting is on.
 */
export async function generateAutoJournalAction(): Promise<GenerateAutoJournalResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'unauth' };
  const profile = await getProfileByUserId(session.user.id);
  if (!profile) return { ok: false, error: 'no_profile' };

  try {
    const { autoJournalFromChat } = await import('@/lib/ai/autoJournal');
    const result = await autoJournalFromChat(profile, { sinceDays: 30, maxDays: 7 });
    if (result.created > 0) revalidatePath('/[locale]/journal', 'page');
    return { ok: true, created: result.created, daysProcessed: result.daysProcessed };
  } catch (err) {
    console.error('[journal] auto-generate failed', err);
    return { ok: false, error: 'generic' };
  }
}
