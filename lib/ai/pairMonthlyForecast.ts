import type Anthropic from '@anthropic-ai/sdk';
import { anthropic, model } from '@/lib/ai/client';
import { buildSystemPrompt, buildUserPrompt, type PairMonthlyInput } from '@/lib/ai/prompts/pairMonthlyForecast';
import { getCachedText, setCachedText } from '@/lib/db/repositories/numerologyCache';
import { logUsage } from '@/lib/db/repositories/usage';

const CACHE_VERSION = 'v1';

function cacheKey(personId: string, year: number, month: number, locale: string): string {
  return `pairMonthlyForecast-${CACHE_VERSION}:${personId}:${year}-${String(month).padStart(2, '0')}:${locale}`;
}

/**
 * Cache-first Pair Monthly Compatibility narrative. Keyed on
 * (personId, year-month, locale) so a re-render in the same month hits
 * cache instantly, and switching person regenerates as needed.
 *
 * Returns null on cold-cache failure so the caller can render a graceful
 * "narrative coming soon" placeholder.
 */
export async function getOrGeneratePairMonthlyForecast(
  userId: string,
  personId: string,
  preferredModel: string | null,
  input: PairMonthlyInput,
): Promise<string | null> {
  const key = cacheKey(personId, input.year, input.month, input.locale);
  const cached = await getCachedText(userId, key);
  if (cached) return cached;

  const modelId = model('aboutMe', preferredModel);
  try {
    const response = await anthropic().messages.create({
      model: modelId,
      max_tokens: 300,
      system: buildSystemPrompt(input.locale),
      messages: [{ role: 'user', content: buildUserPrompt(input) }],
    });
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();
    if (!text) return null;

    await setCachedText(userId, key, text, {
      model: modelId,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    });
    await logUsage({
      userId,
      feature: 'RELATIONSHIP',
      model: modelId,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    });
    return text;
  } catch (err) {
    console.error('[pairMonthlyForecast] generation failed', err);
    return null;
  }
}
