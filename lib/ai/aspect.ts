import { anthropic, model } from '@/lib/ai/client';
import {
  ASPECTS,
  buildAspectSystem,
  buildAspectUser,
  parseAspect,
  type AspectId,
  type AspectInput,
  type ParsedAspect,
} from '@/lib/ai/prompts/aspect';
import { logUsage } from '@/lib/db/repositories/usage';
import { getCachedJson, setCachedJson } from '@/lib/db/repositories/numerologyCache';

// Cache key carries the aspect + calendar year: the "*Season" field is
// Personal-Year-dependent, so the bundle refreshes once per year. Bump
// the version when the prompt schema changes.
// v3: stronger un-AI voice (no em-dash, no negation framing, no English flexing).
// v5: cache key suffixed with the LOCALE so switching languages doesn't
// surface a cached aspect reading in the old language.
function cacheKey(aspectId: AspectId, year: number, locale: string): string {
  return `aspect-v5:${aspectId}:${year}:${locale}`;
}

/** Read-only cache fetch — never generates. */
export async function getCachedAspect(
  userId: string,
  aspectId: AspectId,
  year: number,
  locale: string,
): Promise<ParsedAspect | null> {
  return getCachedJson<ParsedAspect>(userId, cacheKey(aspectId, year, locale));
}

/**
 * Cache-first life-aspect reading (love / finance / …). Mirrors the
 * AboutMe pipeline: cached row per (user, aspect, year); cold cache calls
 * Anthropic once, parses the structured JSON, caches it. Returns null on
 * failure so the caller can render a graceful fallback.
 */
export async function getOrGenerateAspect(
  userId: string,
  aspectId: AspectId,
  year: number,
  input: AspectInput,
): Promise<ParsedAspect | null> {
  const key = cacheKey(aspectId, year, input.locale);
  const cached = await getCachedJson<ParsedAspect>(userId, key);
  if (cached) return cached;

  const config = ASPECTS[aspectId];
  const modelId = model('aboutMe', input.preferredModel);
  try {
    const response = await anthropic().messages.create({
      model: modelId,
      max_tokens: 1200,
      system: buildAspectSystem(config, input.locale),
      messages: [{ role: 'user', content: buildAspectUser(config, input) }],
    });

    const raw = response.content
      .filter((b): b is typeof b & { type: 'text'; text: string } => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();

    const parsed = parseAspect(config, raw);
    if (!parsed) return null;

    await setCachedJson(userId, key, parsed, {
      model: modelId,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    });
    await logUsage({
      userId,
      feature: 'DAILY',
      model: modelId,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    });

    return parsed;
  } catch (err) {
    console.error(`[aspect:${aspectId}] generation failed`, err);
    return null;
  }
}
