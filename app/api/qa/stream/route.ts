import type Anthropic from '@anthropic-ai/sdk';
import type { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/requireSession';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { getRecentTurns, saveTurn } from '@/lib/db/repositories/qa';
import { logUsage } from '@/lib/db/repositories/usage';
import { anthropic, model } from '@/lib/ai/client';
import { chatSystemPrompt } from '@/lib/ai/prompts/conversation';
import { composeContextBlock, dateFactAnchor, loadSmartContext } from '@/lib/conversation/context';
import { contextFromInstant } from '@/lib/numerology';
import { isLocale, type Locale } from '@/lib/i18n/config';

/**
 * How many of the user's most recent chat turns to send back to the
 * model as raw conversation history. Each turn = one user message +
 * one assistant reply. 50 turns = ~25 exchanges = enough to stay
 * "in the same conversation" across days without summarization, while
 * keeping the input prompt size bounded.
 */
const HISTORY_WINDOW = 50;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Allow larger bodies for image / PDF attachments. Vercel default is 1MB
// for serverless POSTs; we cap our own client-side at ~10MB total payload.
export const maxDuration = 60;

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
const PDF_TYPE = 'application/pdf';

const attachmentSchema = z.object({
  kind: z.enum(['image', 'pdf', 'text']),
  name: z.string().max(200),
  mediaType: z.string().max(100),
  /** Pure base64, no data: prefix. */
  data: z.string().max(15_000_000), // ~10 MB after base64 expansion
});

const bodySchema = z.object({
  question: z.string().trim().max(4000),
  attachments: z.array(attachmentSchema).max(4).optional(),
}).refine(
  (b) => b.question.length > 0 || (b.attachments && b.attachments.length > 0),
  { message: 'empty_message' },
);

type Attachment = z.infer<typeof attachmentSchema>;

/** SDK 0.32 doesn't expose a unified ContentBlockParam union or
 * DocumentBlockParam. Locally type the subset we use. The API accepts
 * `document` blocks at runtime even though the SDK types don't yet
 * declare them. */
type UserContentBlock =
  | Anthropic.TextBlockParam
  | Anthropic.ImageBlockParam
  | { type: 'document'; source: { type: 'base64'; media_type: 'application/pdf'; data: string } };

function frame(obj: unknown): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(obj) + '\n');
}

/**
 * Convert validated attachments into Anthropic content blocks. Text files
 * are inlined as <attached_file> XML blocks (cheaper than passing as a
 * document). Images and PDFs use native base64 source blocks.
 */
function attachmentBlocks(attachments: Attachment[]): {
  blocks: UserContentBlock[];
  textPreamble: string;
} {
  const blocks: UserContentBlock[] = [];
  const textParts: string[] = [];
  for (const a of attachments) {
    if (a.kind === 'text') {
      // Decode base64 → utf-8. Limit to avoid runaway prompts.
      const decoded = Buffer.from(a.data, 'base64').toString('utf-8').slice(0, 50_000);
      textParts.push(`<attached_file name="${a.name.replace(/"/g, '')}">\n${decoded}\n</attached_file>`);
    } else if (a.kind === 'image' && (IMAGE_TYPES as readonly string[]).includes(a.mediaType)) {
      blocks.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: a.mediaType as (typeof IMAGE_TYPES)[number],
          data: a.data,
        },
      });
    } else if (a.kind === 'pdf' && a.mediaType === PDF_TYPE) {
      blocks.push({
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: a.data,
        },
      } as UserContentBlock);
    }
  }
  return {
    blocks,
    textPreamble: textParts.length ? textParts.join('\n\n') + '\n\n' : '',
  };
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
  const { question, attachments = [] } = parsed.data;

  const locale: Locale = isLocale(profile.locale) ? profile.locale : 'id';
  const ctx = contextFromInstant(new Date(), profile.timezone);

  let recentTurns: Awaited<ReturnType<typeof getRecentTurns>>;
  let smart: Awaited<ReturnType<typeof loadSmartContext>>;
  try {
    [recentTurns, smart] = await Promise.all([
      getRecentTurns(session.user.id, HISTORY_WINDOW),
      loadSmartContext({
        userId: session.user.id,
        locale,
        profile,
        question,
        ctx,
        dob: profile.dob,
      }),
    ]);
  } catch (err) {
    console.error('[chat/stream] context load failed', err);
    return NextResponse.json({ error: 'context_failed' }, { status: 500 });
  }

  const userId = session.user.id;
  const modelId = model('chat', profile.preferredModel);

  // Two-block system prompt:
  //   1. Static instructions (cached for 5 min — same for every request,
  //      so almost always a cache hit after the first turn)
  //   2. Per-user context (NOT cached — fresh each turn). Putting <profile>
  //      etc. in system instead of as a user message makes the model treat
  //      it as authoritative truth, so it won't ask the user for data
  //      that's already there even if prior assistant turns did.
  const contextBlock = composeContextBlock(smart, profile.personalNotes);

  // Build the current user message. If attachments are present, the content
  // becomes a multi-block array: image/document blocks + a final text block
  // (with any text-file preamble prepended to the question).
  // We prepend a tiny date-fact anchor — the model otherwise tends to
  // anchor on its own earlier assistant turns (where it may have
  // fabricated a wrong DOB) and ignore the system <profile>. This
  // anchor is sent to the API only; we don't persist it to QaHistory.
  const { blocks: attachmentContentBlocks, textPreamble } = attachmentBlocks(attachments);
  const anchor = dateFactAnchor(profile.dob, ctx, locale);
  const baseQuestion = `${textPreamble}${question || (locale === 'id' ? '(File terlampir di atas — kasih perspektif kamu)' : '(Attachments above — share your perspective)')}`;
  const finalQuestion = `${anchor}\n\n${baseQuestion}`;
  const currentUserContent: string | UserContentBlock[] =
    attachmentContentBlocks.length > 0
      ? [...attachmentContentBlocks, { type: 'text' as const, text: finalQuestion }]
      : finalQuestion;

  const messages: Anthropic.MessageParam[] = [
    ...recentTurns.flatMap<Anthropic.MessageParam>((t) => [
      { role: 'user', content: t.question },
      { role: 'assistant', content: t.answer },
    ]),
    // Cast: the SDK 0.32 MessageParam.content type doesn't list 'document'
    // as a valid block kind, but the runtime API accepts it. Validated via
    // attachmentSchema before reaching here.
    { role: 'user', content: currentUserContent } as Anthropic.MessageParam,
  ];

  // Save just the question + a small attachment summary; we don't persist
  // the binary payloads (heavy + ephemeral by design).
  const attachmentSummary = attachments.length
    ? attachments.map((a) => `[${a.kind}: ${a.name}]`).join(' ')
    : '';
  const persistedQuestion = attachmentSummary
    ? `${attachmentSummary}${question ? ' ' + question : ''}`
    : question;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const collected: string[] = [];
      let inputTokens = 0;
      let outputTokens = 0;
      let aborted = false;

      try {
        const sdkStream = anthropic().messages.stream({
          model: modelId,
          max_tokens: 900,
          system: [
            {
              type: 'text',
              text: chatSystemPrompt(locale, profile.tone),
              cache_control: { type: 'ephemeral' },
            } as Anthropic.TextBlockParam,
            {
              type: 'text',
              text: contextBlock,
            },
          ],
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
        const e = err as {
          message?: string;
          status?: number;
          error?: { type?: string; message?: string };
        };
        console.error('[chat/stream] model call failed', {
          message: e.message,
          status: e.status,
          type: e.error?.type,
          inner: e.error?.message,
          modelId,
        });
        controller.enqueue(
          frame({
            type: 'error',
            message: e.error?.message ?? e.message ?? 'ai_failed',
            status: e.status,
            inner: e.error?.type,
          }),
        );
        aborted = true;
      } finally {
        const answer = collected.join('').trim();

        if (!aborted && answer.length > 0) {
          try {
            await saveTurn({
              userId,
              question: persistedQuestion,
              answer,
              contextSnapshot: {
                loaded: smart.loaded,
                attachments: attachments.map((a) => ({ kind: a.kind, name: a.name, mediaType: a.mediaType })),
              } as unknown as Prisma.InputJsonValue,
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
