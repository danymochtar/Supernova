import type Anthropic from '@anthropic-ai/sdk';
import type { Locale } from '@/lib/i18n/config';
import { anthropic, model } from '@/lib/ai/client';
import {
  buildSystemPrompt,
  buildUserPrompt,
  type VibePromptInput,
} from '@/lib/ai/prompts/personDailyVibe';
import {
  createPersonVibe,
  getPersonVibeForDay,
} from '@/lib/db/repositories/personDailyVibe';
import { logUsage } from '@/lib/db/repositories/usage';
import {
  buildCoreProfile,
  contextFromInstant,
  personalCycles,
  type BirthDate,
} from '@/lib/numerology';
import type { Relationship } from '@prisma/client';

const WEEKDAY_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const WEEKDAY_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface ProfileLike {
  id: string;
  fullName: string;
  firstName: string;
  dob: BirthDate;
  timezone: string;
  locale: Locale;
  preferredModel: string | null;
}

interface PersonLike {
  id: string;
  fullName: string;
  firstName: string;
  dob: BirthDate;
  relationship: Relationship;
}

/**
 * Generate (or fetch cached) "vibe of the day" briefing for a Person from the
 * user's perspective. Triggered explicitly by a user tap on the Person detail
 * page so we don't bill the model on every page render; once generated, the
 * row is keyed (personId, date-in-user-tz) and re-used for the rest of the day.
 */
export async function generatePersonDailyVibe(
  user: ProfileLike,
  person: PersonLike,
): Promise<string | null> {
  const ctx = contextFromInstant(new Date(), user.timezone);

  const cached = await getPersonVibeForDay(user.id, person.id, ctx.year, ctx.month, ctx.day);
  if (cached && cached.locale === user.locale) return cached.body;

  const me = buildCoreProfile(user.fullName, user.dob);
  const them = buildCoreProfile(person.fullName, person.dob);
  const meCycles = personalCycles(user.dob, ctx);
  const themCycles = personalCycles(person.dob, ctx);

  const dayMarker = new Date(Date.UTC(ctx.year, ctx.month - 1, ctx.day));
  const weekdayIdx = dayMarker.getUTCDay();
  const weekday =
    user.locale === 'id' ? WEEKDAY_ID[weekdayIdx]! : WEEKDAY_EN[weekdayIdx]!;

  const promptInput: VibePromptInput = {
    locale: user.locale,
    date: { year: ctx.year, month: ctx.month, day: ctx.day, weekday },
    relationship: person.relationship,
    meFirstName: user.firstName,
    themFirstName: person.firstName,
    me: {
      lifePath: me.lifePath,
      expression: me.expression,
      soulUrge: me.soulUrge,
      personality: me.personality,
      personalDay: meCycles.personalDay,
      personalMonth: meCycles.personalMonth,
      personalYear: meCycles.personalYear,
    },
    them: {
      lifePath: them.lifePath,
      expression: them.expression,
      soulUrge: them.soulUrge,
      personality: them.personality,
      personalDay: themCycles.personalDay,
      personalMonth: themCycles.personalMonth,
      personalYear: themCycles.personalYear,
    },
  };

  const modelId = model('daily', user.preferredModel);

  let body: string;
  let inputTokens = 0;
  let outputTokens = 0;
  try {
    const response = await anthropic().messages.create({
      model: modelId,
      max_tokens: 400,
      system: buildSystemPrompt(user.locale),
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
    console.error('[personVibe] anthropic call failed', err);
    return null;
  }

  try {
    await createPersonVibe({
      userId: user.id,
      personId: person.id,
      year: ctx.year,
      month: ctx.month,
      day: ctx.day,
      locale: user.locale,
      body,
      inputTokens,
      outputTokens,
    });
    await logUsage({
      userId: user.id,
      feature: 'RELATIONSHIP',
      model: modelId,
      inputTokens,
      outputTokens,
    });
  } catch (err) {
    // Race: another tap inserted first. Re-fetch and return that row.
    const existing = await getPersonVibeForDay(user.id, person.id, ctx.year, ctx.month, ctx.day);
    if (existing) return existing.body;
    console.error('[personVibe] persist failed', err);
    return null;
  }
  return body;
}
