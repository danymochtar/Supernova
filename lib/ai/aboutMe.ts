import { anthropic, model } from '@/lib/ai/client';
import {
  buildAboutMeSystem,
  buildAboutMeUser,
  type AboutMeInput,
} from '@/lib/ai/prompts/aboutMe';
import { logUsage } from '@/lib/db/repositories/usage';
import { getCachedText, setCachedText } from '@/lib/db/repositories/numerologyCache';

const CACHE_KEY = 'aboutMe';

/**
 * Cache-first About Me text. Profile name + DOB never change so the cached
 * row is good for the lifetime of the account.
 *
 * Returns `null` only if the model call fails on a cold cache — caller
 * should fall back to a graceful UI (or a manual retry button).
 */
export async function getOrGenerateAboutMe(
  userId: string,
  input: AboutMeInput,
): Promise<string | null> {
  const cached = await getCachedText(userId, CACHE_KEY);
  if (cached) return cached;

  const modelId = model();
  try {
    const response = await anthropic().messages.create({
      model: modelId,
      max_tokens: 350,
      system: buildAboutMeSystem(input.locale),
      messages: [{ role: 'user', content: buildAboutMeUser(input) }],
    });

    const text = response.content
      .filter((b): b is typeof b & { type: 'text'; text: string } => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();

    if (!text) return null;

    await setCachedText(userId, CACHE_KEY, text, {
      model: modelId,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    });
    await logUsage({
      userId,
      feature: 'DAILY', // AiFeature enum has no ABOUT yet — log under DAILY for cost tracking
      model: modelId,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    });

    return text;
  } catch (err) {
    console.error('[aboutMe] generation failed', err);
    return null;
  }
}
