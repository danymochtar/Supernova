import { anthropic, model } from '@/lib/ai/client';
import {
  buildYearOutlookSystem,
  buildYearOutlookUser,
  parseYearOutlook,
  type ParsedYearOutlook,
  type YearOutlookInput,
} from '@/lib/ai/prompts/yearOutlook';
import { logUsage } from '@/lib/db/repositories/usage';
import { getCachedJson, setCachedJson } from '@/lib/db/repositories/numerologyCache';

/**
 * Cache key includes the calendar year so the outlook auto-invalidates when
 * the user crosses Jan 1 in their timezone — Personal Year recomputes,
 * narrative regenerates fresh. v1 prefix lets us bump in future when the
 * prompt schema changes.
 */
function cacheKey(year: number): string {
  return `yearOutlook-v2:${year}`;
}

/**
 * Cache-first synthesis of the user's running year. Returns `null` only
 * when generation fails on a cold cache; the journey hero degrades to its
 * non-narrative form in that case.
 *
 * Cost: one Claude call per (user, calendar year). For a 9-year cycle that's
 * 9 calls in a user's lifetime per active period.
 */
export async function getOrGenerateYearOutlook(
  userId: string,
  input: YearOutlookInput,
): Promise<ParsedYearOutlook | null> {
  const key = cacheKey(input.year);
  const cached = await getCachedJson<ParsedYearOutlook>(userId, key);
  if (cached) return cached;

  const modelId = model('aboutMe', input.preferredModel);
  try {
    const response = await anthropic().messages.create({
      model: modelId,
      max_tokens: 900,
      system: buildYearOutlookSystem(input.locale),
      messages: [{ role: 'user', content: buildYearOutlookUser(input) }],
    });

    const raw = response.content
      .filter((b): b is typeof b & { type: 'text'; text: string } => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();

    const parsed = parseYearOutlook(raw);
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
    console.error('[yearOutlook] generation failed', err);
    return null;
  }
}
