import type Anthropic from '@anthropic-ai/sdk';
import type { Locale } from '@/lib/i18n/config';
import { anthropic, model } from '@/lib/ai/client';
import { buildSystemPrompt, buildUserPrompt } from '@/lib/ai/prompts/aboutFunFact';
import { listJournal } from '@/lib/db/repositories/journal';
import { getCachedJson, setCachedJson } from '@/lib/db/repositories/numerologyCache';
import { logUsage } from '@/lib/db/repositories/usage';

// v1: pattern-lately framing — "belakangan kamu sering X".
// v2: trait framing — switch from diary report ("kamu sering nemu jawaban...")
// to who-you-are ("kamu tipe orang yang..."). Old v1 entries regenerate.
// v3: cache key now carries the LOCALE so switching languages doesn't
// surface a cached fact in the old language.
const CACHE_VERSION = 'aboutFunFact-v3';
function cacheKey(locale: string): string {
  return `${CACHE_VERSION}:${locale}`;
}
const TTL_DAYS = 5;
const MIN_ENTRIES = 3;
const SAMPLE_LIMIT = 20;

interface CachedFunFact {
  text: string;
  generatedAt: string;
  /** Total journal entries the user had at generation time; when this
   *  changes (new entry added) we regenerate so the observation stays
   *  fresh even before the TTL expires. */
  sourceCount: number;
}

/**
 * Cache-first one-line "pattern lately" observation drawn from the user's
 * recent journal entries. Returns null when there isn't enough material
 * (<3 entries) or the AI call fails on a cold cache — caller hides the row.
 */
export async function getOrGenerateAboutFunFact(
  userId: string,
  locale: Locale,
): Promise<string | null> {
  const entries = await listJournal(userId, SAMPLE_LIMIT);
  if (entries.length < MIN_ENTRIES) return null;

  const cached = await getCachedJson<CachedFunFact>(userId, cacheKey(locale));
  if (cached) {
    const ageDays = (Date.now() - new Date(cached.generatedAt).getTime()) / 86_400_000;
    if (ageDays < TTL_DAYS && cached.sourceCount === entries.length) {
      return cached.text;
    }
  }

  const modelId = model('aboutMe');
  try {
    const response = await anthropic().messages.create({
      model: modelId,
      max_tokens: 100,
      system: buildSystemPrompt(locale),
      messages: [
        {
          role: 'user',
          content: buildUserPrompt({
            locale,
            entries: entries.map((e) => ({
              theme: e.theme,
              emotion: e.emotion,
              category: e.category,
              narrative: e.narrative,
            })),
          }),
        },
      ],
    });
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim()
      // Strip any wrapping quotes the model sometimes adds despite the rule.
      .replace(/^["']|["']$/g, '');
    if (!text) return cached?.text ?? null;

    const cachePayload: CachedFunFact = {
      text,
      generatedAt: new Date().toISOString(),
      sourceCount: entries.length,
    };
    await setCachedJson(
      userId,
      cacheKey(locale),
      cachePayload,
      {
        model: modelId,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    );
    await logUsage({
      userId,
      feature: 'DAILY',
      model: modelId,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    });
    return text;
  } catch (err) {
    console.error('[aboutFunFact] generation failed', err);
    return cached?.text ?? null;
  }
}
