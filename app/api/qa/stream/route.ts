import type Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { getSession } from '@/lib/auth/requireSession';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { getRecentTurns, saveTurn } from '@/lib/db/repositories/qa';
import { getRecentFeedback } from '@/lib/db/repositories/feedback';
import { logUsage } from '@/lib/db/repositories/usage';
import { aggregate, promptSummary } from '@/lib/patterns/aggregate';
import { anthropic, model } from '@/lib/ai/client';
import {
  buildQaMessages,
  buildQaSystemPrompt,
  type QaPromptContext,
} from '@/lib/ai/prompts/qa';
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

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Q&A is unmetered for now. The RateLimit table + checkAndIncrement helper
// remain in the codebase for when we need abuse protection or per-tier gating.
const HISTORY_TURNS = 5;

const bodySchema = z.object({
  question: z.string().trim().min(2).max(2000),
});

const WEEKDAY_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const WEEKDAY_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function frame(obj: unknown): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(obj) + '\n');
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauth' }, { status: 401 });

  const profile = await getProfileByUserId(session.user.id);
  if (!profile) return NextResponse.json({ error: 'no_profile' }, { status: 400 });

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_question' }, { status: 400 });
  }
  const { question } = parsed.data;

  const ctx = contextFromInstant(new Date(), profile.timezone);
  const core = buildCoreProfile(profile.fullName, profile.dob);
  const cycles = personalCycles(profile.dob, ctx);
  const age = ageAt(profile.dob, ctx);
  const slots = activeSlots(profile.dob, age);

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

  const promptCtx: QaPromptContext = {
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

  const history = (await getRecentTurns(session.user.id, HISTORY_TURNS)).map((t) => ({
    question: t.question,
    answer: t.answer,
  }));

  const messages = buildQaMessages({ ctx: promptCtx, history, question });
  const modelId = model();
  const userId = session.user.id;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const collected: string[] = [];
      let inputTokens = 0;
      let outputTokens = 0;
      let cacheReadTokens = 0;
      let cacheCreateTokens = 0;
      let aborted = false;

      try {
        const sdkStream = anthropic().messages.stream({
          model: modelId,
          max_tokens: 1500,
          system: buildQaSystemPrompt(profile.locale),
          messages: messages as Anthropic.MessageParam[],
        });

        for await (const event of sdkStream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            const delta = event.delta.text;
            collected.push(delta);
            controller.enqueue(frame({ type: 'text', delta }));
          }
        }

        const final = await sdkStream.finalMessage();
        const usage = final.usage as Anthropic.Usage & {
          cache_read_input_tokens?: number | null;
          cache_creation_input_tokens?: number | null;
        };
        inputTokens = usage.input_tokens;
        outputTokens = usage.output_tokens;
        cacheReadTokens = usage.cache_read_input_tokens ?? 0;
        cacheCreateTokens = usage.cache_creation_input_tokens ?? 0;
      } catch (err) {
        console.error('[qa/stream] model call failed', err);
        controller.enqueue(frame({ type: 'error', message: 'ai_failed' }));
        aborted = true;
      } finally {
        const answer = collected.join('').trim();

        // Only persist if we got something meaningful.
        if (!aborted && answer.length > 0) {
          try {
            await saveTurn({
              userId,
              question,
              answer,
              contextSnapshot: promptCtx as unknown as Prisma.InputJsonValue,
            });
            await logUsage({
              userId,
              feature: 'QA',
              model: modelId,
              inputTokens,
              outputTokens,
            });
          } catch (err) {
            console.error('[qa/stream] persist failed', err);
          }
        }

        controller.enqueue(
          frame({
            type: 'done',
            usage: {
              inputTokens,
              outputTokens,
              cacheReadTokens,
              cacheCreateTokens,
            },
          }),
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}
