import { anthropic, model } from '@/lib/ai/client';
import {
  buildAboutMeSystem,
  buildAboutMeUser,
  parseAboutMe,
  type AboutMeInput,
  type ParsedAboutMe,
} from '@/lib/ai/prompts/aboutMe';
import { logUsage } from '@/lib/db/repositories/usage';
import { getCachedJson, setCachedJson } from '@/lib/db/repositories/numerologyCache';

// v3: structured carousel — synthesis + per-component cards. Bumping the
// key invalidates v2 prose-only blobs without needing a migration.
// v4: bridge numbers added to prompt context → tone shifts to acknowledge
// internal integration / friction. Old v3 blobs regenerate on next access.
// v5: EN was removed from the app — invalidate any blob that was generated
// in English so users who picked EN before the lockdown see ID copy. New
// entries are always ID since profile.locale is now coerced to 'id'. When
// EN is reintroduced, switch to a locale-suffixed key (\`aboutMe-v6:${locale}\`).
// v7: added minorNarrative + bridgeNarrative plain-language paragraphs so
// the Minor + Bridge sections lead with human-language context before
// showing the raw cards. Old v6 blobs regenerate on next access.
// v8: natural-voice pass — kill the "[Name] adalah sosok yang…" opener +
// "X — bukan Y" AI tells, and lengthen the synthesis. Old v7 regenerates.
// v14: cache key now suffixed with the LOCALE (`aboutMe-v14:id` /
// `aboutMe-v14:en` / …) so switching languages doesn't return prose in
// the old language. Pre-v14 unsuffixed rows simply miss → regenerate.
const CACHE_VERSION = 'aboutMe-v14';
function cacheKey(locale: string): string {
  return `${CACHE_VERSION}:${locale}`;
}

/**
 * Cache-first structured About Me. Profile name + DOB never change so the
 * cached row is good for the lifetime of the account (per locale). Returns
 * `null` only when generation fails on a cold cache — caller should render
 * a graceful fallback.
 */
export async function getOrGenerateAboutMe(
  userId: string,
  input: AboutMeInput,
): Promise<ParsedAboutMe | null> {
  const key = cacheKey(input.locale);
  const cached = await getCachedJson<ParsedAboutMe>(userId, key);
  if (cached) return cached;

  const modelId = model('aboutMe', input.preferredModel);
  try {
    const response = await anthropic().messages.create({
      model: modelId,
      max_tokens: 1500,
      system: buildAboutMeSystem(input.locale),
      messages: [{ role: 'user', content: buildAboutMeUser(input) }],
    });

    const raw = response.content
      .filter((b): b is typeof b & { type: 'text'; text: string } => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();

    const parsed = parseAboutMe(raw);
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
    console.error('[aboutMe] generation failed', err);
    return null;
  }
}
