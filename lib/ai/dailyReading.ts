import type Anthropic from '@anthropic-ai/sdk';
import type { Locale } from '@/lib/i18n/config';
import type { Prisma } from '@prisma/client';
import { anthropic, model } from '@/lib/ai/client';
import {
  buildSystemPrompt,
  buildUserPrompt,
  type DailyPromptInput,
} from '@/lib/ai/prompts/daily';
import {
  createReading,
  deleteReadingForLocalDay,
  getReadingForLocalDay,
} from '@/lib/db/repositories/reading';
import { getRecentFeedback } from '@/lib/db/repositories/feedback';
import { logUsage } from '@/lib/db/repositories/usage';
import { aggregate, promptSummary } from '@/lib/patterns/aggregate';
import {
  activeSlots,
  ageAt,
  buildCoreProfile,
  challengeAt,
  contextFromInstant,
  cycleAt,
  personalCycles,
  personalYearBirthdayAnchored,
  pinnacleAt,
  type BirthDate,
} from '@/lib/numerology';
import idMeanings from '@/content/meanings/id.json';
import enMeanings from '@/content/meanings/en.json';

const WEEKDAY_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const WEEKDAY_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface ProfileLike {
  id: string;
  fullName: string;
  firstName: string;
  nickname: string | null;
  dob: BirthDate;
  timezone: string;
  locale: Locale;
  preferredModel: string | null;
}

function dayTitleFor(reduced: number, locale: Locale): string {
  const pack = (locale === 'id' ? idMeanings : enMeanings) as Record<string, string>;
  return pack[`personalDayTitle:${reduced}`] ?? '';
}

/**
 * A correctly-formatted reading never prints raw numbers in its title or
 * greeting (numbers live in the staircase/cards, not the prose). Legacy or
 * off-prompt readings sometimes leaked them (e.g. "A 1 DAY" titles, "today's
 * numbers are 1, 28, 10…" greetings) — detect that so we regenerate.
 */
function leaksNumbersInHead(body: string): boolean {
  const head = body
    .trimStart()
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(' ');
  return /\d/.test(head);
}

/**
 * Cache-first daily reading. Returns the body string or `null` if generation
 * failed (caller should render a graceful fallback).
 *
 * One reading per (user, local-day). Safe under parallel calls — if the unique
 * constraint races, the loser re-fetches the winner's row.
 */
export async function getOrGenerateDailyReading(
  userId: string,
  profile: ProfileLike,
  options?: { targetCtx?: { year: number; month: number; day: number } },
): Promise<string | null> {
  const ctx = options?.targetCtx ?? contextFromInstant(new Date(), profile.timezone);

  const cached = await getReadingForLocalDay(userId, ctx.year, ctx.month, ctx.day);
  if (cached) {
    // Regenerate when (a) locale changed since cache, (b) the cached body
    // lacks the WN-voice "→ {domain}: …" closing-action format introduced
    // in the v2 daily-reading prompt, or (c) the title / greeting leak
    // raw numbers. Costs one extra LLM call but spares users a stale
    // layout (old +/- vibe bullets) that no longer matches the new render.
    const stale =
      cached.locale !== profile.locale ||
      !cached.body.trimStart().startsWith('#') ||
      !/^→\s*(?:money|career|love|social|self)\s*:/im.test(cached.body) ||
      leaksNumbersInHead(cached.body);
    if (!stale) return cached.body;
    await deleteReadingForLocalDay(userId, ctx.year, ctx.month, ctx.day);
  }

  const core = buildCoreProfile(profile.fullName, profile.dob);
  const cycles = personalCycles(profile.dob, ctx);
  const age = ageAt(profile.dob, ctx);
  const slots = activeSlots(profile.dob, age);

  const since30 = new Date(Date.UTC(ctx.year, ctx.month - 1, ctx.day));
  since30.setUTCDate(since30.getUTCDate() - 30);
  const feedback = await getRecentFeedback(userId, since30);
  const patterns = aggregate(
    feedback.map((f) => ({ date: f.date, rating: f.rating, tags: f.tags })),
    profile.dob,
    30,
    profile.locale,
  );
  const recentPatterns = promptSummary(patterns);

  const dayMarker = new Date(Date.UTC(ctx.year, ctx.month - 1, ctx.day));
  const weekdayIdx = dayMarker.getUTCDay();
  const weekday = profile.locale === 'id' ? WEEKDAY_ID[weekdayIdx]! : WEEKDAY_EN[weekdayIdx]!;

  const personalYearBA = personalYearBirthdayAnchored(profile.dob, ctx);

  // Address the user by their call name (nickname || firstName) in prose,
  // not the full legal name from the numerology calculation.
  const callName = profile.nickname?.trim() || profile.firstName;
  const promptInput: DailyPromptInput = {
    locale: profile.locale,
    fullName: callName,
    firstName: callName,
    todayLocal: { year: ctx.year, month: ctx.month, day: ctx.day, weekday },
    age,
    dayTitle: dayTitleFor(cycles.personalDay.reduced, profile.locale),
    personalYearBirthdayAnchored: personalYearBA,
    core: {
      lifePath: core.lifePath,
      expression: core.expression,
      soulUrge: core.soulUrge,
      personality: core.personality,
      birthday: core.birthday,
    },
    cycles,
    active: {
      pinnacle: { slot: slots.pinnacle, result: pinnacleAt(core.pinnacles, slots.pinnacle) },
      challenge: { slot: slots.challenge, result: challengeAt(core.challenges, slots.challenge) },
      cycle: { slot: slots.cycle, result: cycleAt(core.periodCycles, slots.cycle) },
    },
    karmicLessons: core.karmicLessons,
    recentPatterns,
  };

  const modelId = model('daily', profile.preferredModel);

  let body: string;
  let inputTokens = 0;
  let outputTokens = 0;
  try {
    const response = await anthropic().messages.create({
      model: modelId,
      max_tokens: 700,
      system: buildSystemPrompt(profile.locale),
      messages: [{ role: 'user', content: buildUserPrompt(promptInput) }],
    });
    inputTokens = response.usage.input_tokens;
    outputTokens = response.usage.output_tokens;
    body = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();
    if (!body) throw new Error('Empty model response');
  } catch (err) {
    console.error('[daily] anthropic call failed', err);
    return null;
  }

  try {
    await createReading({
      userId,
      year: ctx.year,
      month: ctx.month,
      day: ctx.day,
      locale: profile.locale,
      body,
      contextSnapshot: promptInput as unknown as Prisma.InputJsonValue,
      inputTokens,
      outputTokens,
    });
    await logUsage({
      userId,
      feature: 'DAILY',
      model: modelId,
      inputTokens,
      outputTokens,
    });
  } catch (err) {
    const existing = await getReadingForLocalDay(userId, ctx.year, ctx.month, ctx.day);
    if (existing) return existing.body;
    console.error('[daily] persist failed', err);
    return null;
  }

  return body;
}
