import type Anthropic from '@anthropic-ai/sdk';
import type { Relationship } from '@prisma/client';
import { anthropic, model } from '@/lib/ai/client';
import {
  buildPairsSystem,
  buildPairsUser,
  buildProfileSystem,
  buildProfileUser,
  parsePairs,
  type ProfilePromptInput,
  type RelationshipPromptInput,
} from '@/lib/ai/prompts/relationship';
import {
  getCachedJson,
  getCachedText,
  setCachedJson,
  setCachedText,
} from '@/lib/db/repositories/numerologyCache';
import { logUsage } from '@/lib/db/repositories/usage';

const PAIRS_VERSION = 'v3';
const PROFILE_VERSION = 'v3';

// Per-Anthropic-call timeout. Sits below the 60s function timeout so we
// can retry once if the first call stalls. The SDK default is 600s which
// would let a stuck call eat the whole function budget.
const CALL_TIMEOUT_MS = 40_000;

async function callWithRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    const status = (err as { status?: number; statusCode?: number })?.status
      ?? (err as { statusCode?: number })?.statusCode;
    const transient = !status || status >= 500 || status === 429 || status === 408;
    if (!transient) throw err;
    console.warn(`[${label}] first attempt failed, retrying once`, err);
    return await fn();
  }
}

function pairsKey(personId: string, relationship: Relationship, locale: string): string {
  return `relPairs-${PAIRS_VERSION}:${personId}:${relationship}:${locale}`;
}

function profileKey(personId: string, relationship: Relationship, locale: string): string {
  return `relProfile-${PROFILE_VERSION}:${personId}:${relationship}:${locale}`;
}

function extractText(blocks: Anthropic.ContentBlock[]): string {
  return blocks
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
}

/**
 * Cache-first per-pair narrative map. Keyed on (personId, relationship,
 * locale) — a relationship-type change re-generates, which is correct
 * since the lens itself differs.
 *
 * Returns an empty map if the call fails — caller can fall back to a
 * static "narrative coming soon" string.
 */
export async function getOrGeneratePairNarratives(
  userId: string,
  personId: string,
  preferredModel: string | null,
  input: RelationshipPromptInput,
): Promise<Record<string, string>> {
  const key = pairsKey(personId, input.relationship, input.locale);
  const cached = await getCachedJson<{ narratives: Record<string, string> }>(userId, key);
  if (cached?.narratives) return cached.narratives;

  // Pairs is a pure-format JSON task with structured output — Haiku 4.5
  // hits this well, ~3× faster than Sonnet and the narratives are short
  // enough that quality doesn't suffer noticeably.
  const modelId = preferredModel ?? process.env.ANTHROPIC_RELATIONSHIP_MODEL ?? 'claude-haiku-4-5';
  try {
    const response = await callWithRetry(
      () => anthropic().messages.create(
        {
          model: modelId,
          max_tokens: 1500,
          system: buildPairsSystem(input.locale),
          messages: [{ role: 'user', content: buildPairsUser(input) }],
        },
        { timeout: CALL_TIMEOUT_MS },
      ),
      'relationship.pairs',
    );
    const raw = extractText(response.content);
    const parsed = parsePairs(raw);
    if (Object.keys(parsed.narratives).length === 0) {
      console.warn('[relationship.pairs] empty narratives parsed from raw', raw.slice(0, 200));
      return {};
    }

    await setCachedJson(userId, key, parsed, {
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
    return parsed.narratives;
  } catch (err) {
    console.error('[relationship.pairs] generation failed', err);
    return {};
  }
}

/**
 * Cache-first long-form relationship profile (3-4 paragraphs, no numbers).
 * Mirrors the About Me pattern but for a pair.
 */
export async function getOrGenerateRelationshipProfile(
  userId: string,
  personId: string,
  preferredModel: string | null,
  input: ProfilePromptInput,
): Promise<string | null> {
  const key = profileKey(personId, input.relationship, input.locale);
  const cached = await getCachedText(userId, key);
  if (cached) return cached;

  // Profile is read-once, kept-around prose — Sonnet is worth it for
  // warmth/nuance. Per-user override still wins.
  const modelId = model('aboutMe', preferredModel);
  try {
    const response = await callWithRetry(
      () => anthropic().messages.create(
        {
          model: modelId,
          max_tokens: 800,
          system: buildProfileSystem(input.locale),
          messages: [{ role: 'user', content: buildProfileUser(input) }],
        },
        { timeout: CALL_TIMEOUT_MS },
      ),
      'relationship.profile',
    );
    const text = extractText(response.content);
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
    console.error('[relationship.profile] generation failed', err);
    return null;
  }
}
