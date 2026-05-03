import type Anthropic from '@anthropic-ai/sdk';
import type { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/requireSession';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { getTurnsBetween, saveTurn } from '@/lib/db/repositories/qa';
import { logUsage } from '@/lib/db/repositories/usage';
import { anthropic, model } from '@/lib/ai/client';
import { chatSystemPrompt } from '@/lib/ai/prompts/conversation';
import { composeContextBlock, loadSmartContext } from '@/lib/conversation/context';
import { rollupAll } from '@/lib/conversation/rollup';
import { contextFromInstant } from '@/lib/numerology';
import { isLocale, type Locale } from '@/lib/i18n/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  question: z.string().trim().min(1).max(4000),
});

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

  const locale: Locale = isLocale(profile.locale) ? profile.locale : 'id';
  const ctx = contextFromInstant(new Date(), profile.timezone);
  const todayStart = new Date(Date.UTC(ctx.year, ctx.month - 1, ctx.day));
  const todayEnd = new Date(todayStart);
  todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

  // Lazy rollup: catch up any past day/week/month boundaries crossed since
  // last visit. Awaited so the resulting summaries are available in the
  // context we build below.
  await rollupAll(session.user.id, locale, new Date());

  const todaysTurns = await getTurnsBetween(session.user.id, todayStart, todayEnd);
  const smart = await loadSmartContext({
    userId: session.user.id,
    locale,
    profile,
    question,
    ctx,
    dob: profile.dob,
  });

  const userId = session.user.id;
  const modelId = model();

  // Build the message array. Cache the static context block so follow-up
  // turns within the same 5-minute window pay ~10% input on the prefix.
  // (The SDK's TextBlockParam type in v0.32 doesn't yet expose cache_control,
  // so we cast — the API accepts and uses it correctly.)
  const contextBlock = composeContextBlock(smart);
  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: contextBlock,
          cache_control: { type: 'ephemeral' },
        } as Anthropic.TextBlockParam,
      ],
    },
    {
      role: 'assistant',
      content: locale === 'id'
        ? 'Konteks dicatat. Saya siap mendengarkan.'
        : 'Context noted. I am here to listen.',
    },
    ...todaysTurns.flatMap<Anthropic.MessageParam>((t) => [
      { role: 'user', content: t.question },
      { role: 'assistant', content: t.answer },
    ]),
    { role: 'user', content: question },
  ];

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const collected: string[] = [];
      let inputTokens = 0;
      let outputTokens = 0;
      let aborted = false;

      try {
        const sdkStream = anthropic().messages.stream({
          model: modelId,
          max_tokens: 1500,
          system: chatSystemPrompt(locale),
          messages,
        });

        for await (const event of sdkStream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            const delta = event.delta.text;
            collected.push(delta);
            controller.enqueue(frame({ type: 'text', delta }));
          }
        }

        const final = await sdkStream.finalMessage();
        inputTokens = final.usage.input_tokens;
        outputTokens = final.usage.output_tokens;
      } catch (err) {
        console.error('[chat/stream] model call failed', err);
        controller.enqueue(frame({ type: 'error', message: 'ai_failed' }));
        aborted = true;
      } finally {
        const answer = collected.join('').trim();

        if (!aborted && answer.length > 0) {
          try {
            await saveTurn({
              userId,
              question,
              answer,
              contextSnapshot: { loaded: smart.loaded } as unknown as Prisma.InputJsonValue,
            });
            await logUsage({
              userId,
              feature: 'QA',
              model: modelId,
              inputTokens,
              outputTokens,
            });
          } catch (err) {
            console.error('[chat/stream] persist failed', err);
          }
        }

        controller.enqueue(
          frame({
            type: 'done',
            usage: { inputTokens, outputTokens, loaded: smart.loaded },
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
