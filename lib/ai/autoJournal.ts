import type Anthropic from '@anthropic-ai/sdk';
import { anthropic, model } from '@/lib/ai/client';
import {
  buildClusterSystem,
  buildClusterUser,
  parseClusters,
  type ClusterTurn,
} from '@/lib/ai/prompts/journalCluster';
import { synthesizeJournalNarrative } from '@/lib/ai/journal';
import { detectUserPronoun } from '@/lib/ai/prompts/journal';
import { prisma } from '@/lib/db/prisma';
import { createJournalEntry, listOpenActionItems } from '@/lib/db/repositories/journal';
import { deriveCategory } from '@/lib/curhat/categories';
import { topicFromSnapshot } from '@/lib/curhat/snapshot';
import { logUsage } from '@/lib/db/repositories/usage';
import type { ProfileView } from '@/lib/db/repositories/profile';

interface AutoJournalResult {
  created: number;
  /** Days inspected (complete, had un-journaled substance). */
  daysProcessed: number;
}

/** Local YYYY-MM-DD for a UTC instant in the user's timezone. */
function localDayKey(at: Date, timezone: string): string {
  // en-CA gives YYYY-MM-DD; the timezone option shifts to the user's day.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(at);
}

/**
 * Auto-journal the user's recent chat history: pull turns that haven't
 * been journaled yet, group them by local day, cluster each day by topic
 * via the model, then synthesize one journal entry per substantive
 * cluster.
 *
 * Idempotent + non-destructive: turns already covered by an existing
 * JournalEntry.sources are skipped, so re-running never overwrites or
 * duplicates an already-journaled date/event. "Today" (the user's
 * current local day) is skipped because the conversation may still be
 * in progress.
 *
 * Cost is bounded: at most `maxDays` complete days per invocation, and
 * the cluster + synth calls are skipped for days with no un-journaled
 * substance.
 */
export async function autoJournalFromChat(
  profile: ProfileView,
  opts: { sinceDays?: number; maxDays?: number } = {},
): Promise<AutoJournalResult> {
  const sinceDays = opts.sinceDays ?? 30;
  const maxDays = opts.maxDays ?? 7;
  const userId = profile.userId;

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - sinceDays);

  // Already-journaled turn ids — gathered from every entry's sources so
  // we never re-cover the same conversation.
  const existing = await prisma.journalEntry.findMany({
    where: { userId },
    select: { sources: true },
  });
  const journaledTurnIds = new Set<string>();
  for (const e of existing) {
    if (Array.isArray(e.sources)) {
      for (const s of e.sources as Array<{ turnId?: unknown }>) {
        if (s && typeof s.turnId === 'string') journaledTurnIds.add(s.turnId);
      }
    }
  }

  // Main-thread turns only (personId null) within the window, oldest first.
  const turns = await prisma.qaHistory.findMany({
    where: { userId, personId: null, createdAt: { gte: since } },
    orderBy: { createdAt: 'asc' },
    select: { id: true, question: true, answer: true, createdAt: true, contextSnapshot: true },
  });

  const todayKey = localDayKey(new Date(), profile.timezone);

  // Bucket un-journaled turns by local day, skipping today (may still be live).
  const byDay = new Map<string, typeof turns>();
  for (const t of turns) {
    if (journaledTurnIds.has(t.id)) continue;
    const key = localDayKey(t.createdAt, profile.timezone);
    if (key === todayKey) continue;
    const arr = byDay.get(key);
    if (arr) arr.push(t);
    else byDay.set(key, [t]);
  }

  // Process most-recent complete days first, cap at maxDays.
  const days = Array.from(byDay.keys()).sort((a, b) => (a < b ? 1 : -1)).slice(0, maxDays);

  // Pronoun detection uses a wide window of recent chat so single-day
  // clusters still get the user's habitual first-person voice.
  const pronounSample = await prisma.qaHistory.findMany({
    where: { userId, personId: null },
    orderBy: { createdAt: 'desc' },
    take: 80,
    select: { question: true },
  });
  const pronoun = detectUserPronoun(pronounSample);

  const clusterModel = model('aboutMe', profile.preferredModel);
  let created = 0;
  let daysProcessed = 0;

  for (const dayKey of days) {
    const dayTurns = byDay.get(dayKey)!;
    if (dayTurns.length === 0) continue;

    const dateLabel = new Intl.DateTimeFormat(profile.locale === 'id' ? 'id-ID' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: profile.timezone,
    }).format(new Date(`${dayKey}T12:00:00Z`));

    const clusterTurns: ClusterTurn[] = dayTurns.map((t, i) => ({
      index: i,
      question: t.question,
      answer: t.answer,
    }));
    const validIndexes = new Set(clusterTurns.map((t) => t.index));

    let clusters;
    try {
      const resp = await anthropic().messages.create({
        model: clusterModel,
        max_tokens: 600,
        system: buildClusterSystem(profile.locale),
        messages: [
          { role: 'user', content: buildClusterUser({ locale: profile.locale, dateLabel, turns: clusterTurns }) },
        ],
      });
      const raw = resp.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
        .trim();
      await logUsage({
        userId,
        feature: 'QA',
        model: clusterModel,
        inputTokens: resp.usage.input_tokens,
        outputTokens: resp.usage.output_tokens,
      });
      clusters = parseClusters(raw, validIndexes);
    } catch (err) {
      console.error('[autoJournal] clustering failed for', dayKey, err);
      continue;
    }

    daysProcessed += 1;
    if (clusters.length === 0) continue;

    // Synthesize one entry per cluster. Each cluster's turns keep their
    // chronological order via the original dayTurns index.
    // Open follow-ups + their reply notes — passed into every synthesis so
    // the AI can avoid re-proposing an action item the user already said
    // they did (e.g. "udah subscribe gym kemarin"). Fetched once per
    // autoJournal run since clusters share the same user.
    const openItems = await listOpenActionItems(userId, 14, 20);
    const nowMs = Date.now();
    const openFollowUps = openItems.map((it) => ({
      title: it.title,
      kind: it.kind,
      note: it.note,
      daysAgo: Math.max(0, Math.floor((nowMs - it.entryAddedAt.getTime()) / 86_400_000)),
    }));

    for (const cluster of clusters) {
      const sorted = [...cluster.turnIndexes].sort((a, b) => a - b);
      const rows = sorted.map((i) => dayTurns[i]!).filter(Boolean);
      if (rows.length === 0) continue;

      const synth = await synthesizeJournalNarrative(userId, {
        locale: profile.locale,
        firstName: profile.firstName,
        tone: profile.tone,
        pronoun,
        turns: rows.map((r) => ({
          question: r.question,
          answer: r.answer,
          at: contextLabel(r.createdAt, profile.timezone, profile.locale),
        })),
        openFollowUps,
        preferredModel: profile.preferredModel,
      });
      if (!synth) continue;

      try {
        await createJournalEntry({
          userId,
          narrative: synth.narrative,
          sources: rows.map((r) => ({
            turnId: r.id,
            question: r.question,
            answer: r.answer,
            createdAt: r.createdAt.toISOString(),
          })),
          rangeStart: rows[0]!.createdAt,
          rangeEnd: rows[rows.length - 1]!.createdAt,
          reframe: synth.reframe || null,
          emotion: synth.emotion || null,
          // Prefer the cluster's topic label as the theme when the synth
          // didn't emit one — it's already a concrete per-event label.
          theme: synth.theme || cluster.topic || null,
          // Capability tag = dominant curhat topic across the cluster's turns.
          category: deriveCategory(rows.map((r) => topicFromSnapshot(r.contextSnapshot))),
          actionItemDrafts: synth.actionItems,
        });
        created += 1;
      } catch (err) {
        console.error('[autoJournal] persist failed for', dayKey, err);
      }
    }
  }

  return { created, daysProcessed };
}

function contextLabel(at: Date, timezone: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
  }).format(at);
}
