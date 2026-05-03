'use server';

import type Anthropic from '@anthropic-ai/sdk';
import type { Prisma } from '@prisma/client';
import { getSession } from '@/lib/auth/requireSession';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { createReading, getReadingForLocalDay } from '@/lib/db/repositories/reading';
import { getRecentFeedback } from '@/lib/db/repositories/feedback';
import { logUsage } from '@/lib/db/repositories/usage';
import { aggregate, promptSummary } from '@/lib/patterns/aggregate';
import { anthropic, model } from '@/lib/ai/client';
import {
  buildSystemPrompt,
  buildUserPrompt,
  type DailyPromptInput,
} from '@/lib/ai/prompts/daily';
import {
  activeSlots,
  ageAt,
  buildCoreProfile,
  challengeAt,
  contextFromInstant,
  cycleAt,
  personalCycles,
  pinnacleAt,
} from '@/lib/numerology';

const WEEKDAY_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const WEEKDAY_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export type GenerateResult =
  | { ok: true; body: string; cached: boolean }
  | { ok: false; error: 'unauth' | 'no_profile' | 'ai_failed' };

export async function generateDailyReading(): Promise<GenerateResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'unauth' };

  const profile = await getProfileByUserId(session.user.id);
  if (!profile) return { ok: false, error: 'no_profile' };

  const ctx = contextFromInstant(new Date(), profile.timezone);

  const cached = await getReadingForLocalDay(session.user.id, ctx.year, ctx.month, ctx.day);
  if (cached) return { ok: true, body: cached.body, cached: true };

  const core = buildCoreProfile(profile.fullName, profile.dob);
  const cycles = personalCycles(profile.dob, ctx);
  const age = ageAt(profile.dob, ctx);
  const slots = activeSlots(profile.dob, age);

  // Inject last-30-day feedback patterns when there's enough signal.
  const since30 = new Date(Date.UTC(ctx.year, ctx.month - 1, ctx.day));
  since30.setUTCDate(since30.getUTCDate() - 30);
  const feedback = await getRecentFeedback(session.user.id, since30);
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

  const promptInput: DailyPromptInput = {
    locale: profile.locale,
    fullName: profile.fullName,
    todayLocal: { year: ctx.year, month: ctx.month, day: ctx.day, weekday },
    age,
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

  const modelId = model('daily');

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
    return { ok: false, error: 'ai_failed' };
  }

  // Persist + log. Cache snapshot is the same shape we sent to the model so we
  // can debug later without recomputing.
  try {
    await createReading({
      userId: session.user.id,
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
      userId: session.user.id,
      feature: 'DAILY',
      model: modelId,
      inputTokens,
      outputTokens,
    });
  } catch (err) {
    // If two parallel requests race, the unique (userId, date) constraint will
    // make one fail. Re-fetch the winner instead of erroring.
    const existing = await getReadingForLocalDay(session.user.id, ctx.year, ctx.month, ctx.day);
    if (existing) return { ok: true, body: existing.body, cached: true };
    console.error('[daily] persist failed', err);
    return { ok: false, error: 'ai_failed' };
  }

  return { ok: true, body, cached: false };
}
