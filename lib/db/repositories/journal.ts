import type { JournalEntry, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/db/prisma';

export interface JournalSourceSnapshot {
  turnId: string;
  question: string;
  answer: string;
  createdAt: string; // ISO
}

export interface JournalActionItem {
  /** Stable id so the client can toggle a specific item. cuid-style. */
  id: string;
  title: string;
  completed: boolean;
  /** ISO timestamp set when the user marks the item done. Null otherwise. */
  completedAt: string | null;
  /** ISO of when the AI extracted the item. */
  createdAt: string;
}

export interface JournalEntryView {
  id: string;
  userId: string;
  narrative: string;
  sources: JournalSourceSnapshot[];
  rangeStart: Date;
  rangeEnd: Date;
  note: string | null;
  reframe: string | null;
  emotion: string | null;
  theme: string | null;
  actionItems: JournalActionItem[];
  addedAt: Date;
}

function decodeSources(v: Prisma.JsonValue): JournalSourceSnapshot[] {
  if (!Array.isArray(v)) return [];
  return (v as unknown as JournalSourceSnapshot[]).filter(
    (s): s is JournalSourceSnapshot =>
      !!s &&
      typeof s === 'object' &&
      typeof s.turnId === 'string' &&
      typeof s.question === 'string' &&
      typeof s.answer === 'string',
  );
}

function decodeActionItems(v: Prisma.JsonValue): JournalActionItem[] {
  if (!Array.isArray(v)) return [];
  return (v as unknown as Partial<JournalActionItem>[])
    .map((it): JournalActionItem | null => {
      if (!it || typeof it !== 'object') return null;
      if (typeof it.id !== 'string' || typeof it.title !== 'string') return null;
      return {
        id: it.id,
        title: it.title,
        completed: Boolean(it.completed),
        completedAt: typeof it.completedAt === 'string' ? it.completedAt : null,
        createdAt: typeof it.createdAt === 'string' ? it.createdAt : new Date().toISOString(),
      };
    })
    .filter((it): it is JournalActionItem => it !== null);
}

function toView(row: JournalEntry): JournalEntryView {
  return {
    id: row.id,
    userId: row.userId,
    narrative: row.narrative,
    sources: decodeSources(row.sources),
    rangeStart: row.rangeStart,
    rangeEnd: row.rangeEnd,
    note: row.note,
    reframe: row.reframe,
    emotion: row.emotion,
    theme: row.theme,
    actionItems: decodeActionItems(row.actionItems),
    addedAt: row.addedAt,
  };
}

export interface CreateJournalInput {
  userId: string;
  narrative: string;
  sources: JournalSourceSnapshot[];
  rangeStart: Date;
  rangeEnd: Date;
  reframe?: string | null;
  emotion?: string | null;
  theme?: string | null;
  /** Raw action item drafts from the AI; the repo assigns ids + timestamps. */
  actionItemDrafts?: Array<{ title: string }>;
}

export async function createJournalEntry(input: CreateJournalInput): Promise<JournalEntryView> {
  const now = new Date().toISOString();
  const items: JournalActionItem[] = (input.actionItemDrafts ?? []).map((d) => ({
    id: randomUUID(),
    title: d.title,
    completed: false,
    completedAt: null,
    createdAt: now,
  }));

  const row = await prisma.journalEntry.create({
    data: {
      userId: input.userId,
      narrative: input.narrative,
      sources: input.sources as unknown as Prisma.InputJsonValue,
      rangeStart: input.rangeStart,
      rangeEnd: input.rangeEnd,
      reframe: input.reframe?.trim() || null,
      emotion: input.emotion?.trim() || null,
      theme: input.theme?.trim() || null,
      actionItems: items as unknown as Prisma.InputJsonValue,
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

/**
 * Flip an action item's completed state inside a specific journal entry.
 * Scoped by (entryId, userId) so a stray caller can't mutate another
 * user's items. Returns the updated item, or null if entry/item not
 * found.
 */
export async function toggleActionItem(
  userId: string,
  entryId: string,
  itemId: string,
  completed: boolean,
): Promise<JournalActionItem | null> {
  const row = await prisma.journalEntry.findFirst({
    where: { id: entryId, userId },
    select: { actionItems: true },
  });
  if (!row) return null;
  const items = decodeActionItems(row.actionItems);
  const idx = items.findIndex((it) => it.id === itemId);
  if (idx < 0) return null;
  const now = new Date().toISOString();
  items[idx] = {
    ...items[idx]!,
    completed,
    completedAt: completed ? now : null,
  };
  await prisma.journalEntry.updateMany({
    where: { id: entryId, userId },
    data: { actionItems: items as unknown as Prisma.InputJsonValue },
  });
  return items[idx]!;
}

export interface OpenActionItem {
  /** The action item itself. */
  id: string;
  title: string;
  createdAt: string;
  /** Parent entry context — gives the widget a tap-target back to the
   * full journal entry + a few cues for the "X days ago" line. */
  entryId: string;
  entryAddedAt: Date;
  entryEmotion: string | null;
  entryTheme: string | null;
}

/**
 * Flat list of UNCOMPLETED action items from journal entries added in the
 * last `sinceDays` days. Sorted by entry recency — newest entries first —
 * so the dashboard "follow-up" widget surfaces the most relevant pending
 * commitments. Capped at `maxItems` across all entries.
 *
 * We filter actionItems in JS (it's a JSON column) rather than via a JSON
 * path query — the entry set is small (a few weeks of entries), keeps the
 * query simple, and lets the dashboard render the same shape regardless
 * of how Postgres indexes the JSON.
 */
export async function listOpenActionItems(
  userId: string,
  sinceDays = 14,
  maxItems = 5,
): Promise<OpenActionItem[]> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - sinceDays);

  const rows = await prisma.journalEntry.findMany({
    where: { userId, addedAt: { gte: since } },
    orderBy: { addedAt: 'desc' },
    select: {
      id: true,
      addedAt: true,
      emotion: true,
      theme: true,
      actionItems: true,
    },
  });

  const out: OpenActionItem[] = [];
  for (const row of rows) {
    const items = decodeActionItems(row.actionItems);
    for (const it of items) {
      if (it.completed) continue;
      out.push({
        id: it.id,
        title: it.title,
        createdAt: it.createdAt,
        entryId: row.id,
        entryAddedAt: row.addedAt,
        entryEmotion: row.emotion,
        entryTheme: row.theme,
      });
      if (out.length >= maxItems) return out;
    }
  }
  return out;
}

export interface DigestCount {
  /** The label as stored on JournalEntry — lowercase, single word. */
  name: string;
  /** How many entries in the window carried this label. */
  count: number;
}

export interface JournalDigest {
  /** ISO date string of the earliest day in the window (YYYY-MM-DD). */
  sinceDate: string;
  /** Total entries in the window. */
  totalEntries: number;
  /** Top 3 themes by count, ties broken alphabetically. */
  topThemes: DigestCount[];
  /** Top 3 emotions by count, ties broken alphabetically. */
  topEmotions: DigestCount[];
  /** Sum of completed action items in the window. */
  actionsDone: number;
  /** Sum of still-open action items in the window. */
  actionsOpen: number;
}

/**
 * Deterministic weekly-ish snapshot of the user's journal activity.
 * Reads the `emotion` / `theme` columns + the actionItems JSON for
 * entries added in the last `sinceDays` days and rolls them into
 * counts + action-completion stats. No AI — fast and predictable so
 * the dashboard widget can paint instantly.
 *
 * Returns null when there's nothing to summarize (no entries in the
 * window) so the caller can hide the widget cleanly.
 */
export async function getJournalDigest(
  userId: string,
  sinceDays = 7,
): Promise<JournalDigest | null> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - sinceDays);

  const rows = await prisma.journalEntry.findMany({
    where: { userId, addedAt: { gte: since } },
    orderBy: { addedAt: 'desc' },
    select: { emotion: true, theme: true, actionItems: true },
  });

  if (rows.length === 0) return null;

  const themeCounts = new Map<string, number>();
  const emotionCounts = new Map<string, number>();
  let actionsDone = 0;
  let actionsOpen = 0;

  for (const row of rows) {
    if (row.theme) {
      themeCounts.set(row.theme, (themeCounts.get(row.theme) ?? 0) + 1);
    }
    if (row.emotion) {
      emotionCounts.set(row.emotion, (emotionCounts.get(row.emotion) ?? 0) + 1);
    }
    const items = decodeActionItems(row.actionItems);
    for (const it of items) {
      if (it.completed) actionsDone += 1;
      else actionsOpen += 1;
    }
  }

  const toTop = (m: Map<string, number>): DigestCount[] =>
    Array.from(m.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => (b.count - a.count) || a.name.localeCompare(b.name))
      .slice(0, 3);

  return {
    sinceDate: since.toISOString().slice(0, 10),
    totalEntries: rows.length,
    topThemes: toTop(themeCounts),
    topEmotions: toTop(emotionCounts),
    actionsDone,
    actionsOpen,
  };
}
