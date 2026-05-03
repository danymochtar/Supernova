import type { Locale } from '@/lib/i18n/config';
import { anthropic, model } from '@/lib/ai/client';
import {
  rollupMaxTokens,
  rollupSystemPrompt,
  summariesToList,
  turnsToTranscript,
} from '@/lib/ai/prompts/rollup';
import { logUsage } from '@/lib/db/repositories/usage';
import { getTurnsBetween } from '@/lib/db/repositories/qa';
import {
  createSummary,
  getSummary,
  listSummaries,
} from '@/lib/db/repositories/conversationSummary';
import { prisma } from '@/lib/db/prisma';

/** Find the Monday of the ISO week (UTC) containing the given date. */
function startOfWeekUTC(d: Date): Date {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  // getUTCDay: 0=Sun..6=Sat. ISO week starts on Mon.
  const day = x.getUTCDay();
  const diff = (day + 6) % 7; // Mon=0, Tue=1, ..., Sun=6
  x.setUTCDate(x.getUTCDate() - diff);
  return x;
}

function endOfWeekUTC(d: Date): Date {
  const start = startOfWeekUTC(d);
  start.setUTCDate(start.getUTCDate() + 6);
  return start;
}

function startOfMonthUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function endOfMonthUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
}

function dayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

async function generateSummary(
  userId: string,
  locale: Locale,
  kind: 'daily' | 'weekly' | 'monthly',
  body: string,
): Promise<string | null> {
  if (!body.trim()) return null;
  const modelId = model();
  try {
    const response = await anthropic().messages.create({
      model: modelId,
      max_tokens: rollupMaxTokens(kind),
      system: rollupSystemPrompt(kind, locale),
      messages: [{ role: 'user', content: body }],
    });
    const text = response.content
      .filter((b): b is typeof b & { type: 'text'; text: string } => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();
    if (!text) return null;
    await logUsage({
      userId,
      feature: 'RECAP',
      model: modelId,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    });
    return text;
  } catch (err) {
    console.error('[rollup] generation failed', { kind, err });
    return null;
  }
}

/**
 * Make sure all past days that have turns but no daily summary get summarized.
 * Stops at `today` exclusive — today's turns stay raw in the chat thread.
 *
 * Idempotent and safe to call on every chat request.
 */
export async function rollupDailyIfNeeded(
  userId: string,
  locale: Locale,
  today: Date,
): Promise<void> {
  const todayMarker = dayUTC(today);

  // Walk back up to 14 days to catch any gaps.
  for (let i = 1; i <= 14; i++) {
    const dayStart = new Date(todayMarker);
    dayStart.setUTCDate(dayStart.getUTCDate() - i);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const existing = await getSummary(userId, 'DAILY', dayStart);
    if (existing) continue;

    const turns = await getTurnsBetween(userId, dayStart, dayEnd);
    if (turns.length === 0) continue;

    const transcript = turnsToTranscript(turns);
    const summary = await generateSummary(userId, locale, 'daily', transcript);
    if (!summary) continue;

    await createSummary({
      userId,
      kind: 'DAILY',
      periodStart: dayStart,
      periodEnd: dayStart, // single day
      summary,
      turnCount: turns.length,
    });
  }
}

/**
 * Roll completed past weeks (Mon-Sun) of daily summaries into a weekly summary.
 * Skips the in-progress week containing `today`.
 */
export async function rollupWeeklyIfNeeded(
  userId: string,
  locale: Locale,
  today: Date,
): Promise<void> {
  const thisWeekStart = startOfWeekUTC(today);

  for (let w = 1; w <= 8; w++) {
    const weekStart = new Date(thisWeekStart);
    weekStart.setUTCDate(weekStart.getUTCDate() - 7 * w);
    const weekEnd = endOfWeekUTC(weekStart);

    const existing = await getSummary(userId, 'WEEKLY', weekStart);
    if (existing) continue;

    // Pull daily summaries that fall inside this week.
    const dailies = await listSummaries(userId, 'DAILY', 200);
    const inWeek = dailies
      .filter(
        (d) =>
          d.periodStart.getTime() >= weekStart.getTime() &&
          d.periodStart.getTime() <= weekEnd.getTime(),
      )
      .sort((a, b) => a.periodStart.getTime() - b.periodStart.getTime());

    if (inWeek.length === 0) continue;

    const body = summariesToList(inWeek);
    const summary = await generateSummary(userId, locale, 'weekly', body);
    if (!summary) continue;

    await createSummary({
      userId,
      kind: 'WEEKLY',
      periodStart: weekStart,
      periodEnd: weekEnd,
      summary,
      turnCount: inWeek.reduce((a, d) => a + d.turnCount, 0),
    });
  }
}

/**
 * Roll completed past months of weekly summaries into a monthly summary.
 * Skips the in-progress month containing `today`.
 */
export async function rollupMonthlyIfNeeded(
  userId: string,
  locale: Locale,
  today: Date,
): Promise<void> {
  const thisMonthStart = startOfMonthUTC(today);

  for (let m = 1; m <= 12; m++) {
    const monthStart = new Date(thisMonthStart);
    monthStart.setUTCMonth(monthStart.getUTCMonth() - m);
    const monthEnd = endOfMonthUTC(monthStart);

    const existing = await getSummary(userId, 'MONTHLY', monthStart);
    if (existing) continue;

    const weeklies = await listSummaries(userId, 'WEEKLY', 100);
    const inMonth = weeklies
      .filter(
        (w) =>
          w.periodStart.getTime() >= monthStart.getTime() &&
          w.periodStart.getTime() <= monthEnd.getTime(),
      )
      .sort((a, b) => a.periodStart.getTime() - b.periodStart.getTime());

    if (inMonth.length === 0) continue;

    const body = summariesToList(inMonth);
    const summary = await generateSummary(userId, locale, 'monthly', body);
    if (!summary) continue;

    await createSummary({
      userId,
      kind: 'MONTHLY',
      periodStart: monthStart,
      periodEnd: monthEnd,
      summary,
      turnCount: inMonth.reduce((a, w) => a + w.turnCount, 0),
    });
  }
}

/**
 * Cheap precheck: is any rollup work potentially needed?
 *
 * Skips the full 14-day / 8-week / 12-month walks when there are no past
 * turns to summarize. ~1 indexed query instead of 30+ when the user is
 * up-to-date.
 */
async function hasPotentialRollup(userId: string, today: Date): Promise<boolean> {
  const todayStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const oldest = await prisma.qaHistory.findFirst({
    where: { userId, personId: null, createdAt: { lt: todayStart } },
    orderBy: { createdAt: 'asc' },
    select: { createdAt: true },
  });
  return Boolean(oldest);
}

export async function rollupAll(
  userId: string,
  locale: Locale,
  today: Date,
): Promise<void> {
  if (!(await hasPotentialRollup(userId, today))) return;
  await rollupDailyIfNeeded(userId, locale, today);
  await rollupWeeklyIfNeeded(userId, locale, today);
  await rollupMonthlyIfNeeded(userId, locale, today);
}
