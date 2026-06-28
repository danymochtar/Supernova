/**
 * Server-side cache + AI generation for the "Your Design Story" surface
 * on the Life > Desain Manusia tab. One row per (userId, locale) in
 * `design_story`; regenerates when the underlying HD chart changes.
 *
 * Invalidation strategy: stable hash of the HD fields the story is
 * derived from. If birth data is edited and `hdType` (or any other
 * field) shifts, the hash changes and the next read regenerates.
 */

import { createHash } from 'crypto';
import type { Locale } from '@/lib/i18n/config';
import { anthropic, model } from '@/lib/ai/client';
import {
  DESIGN_STORY_PROMPT_VERSION,
  buildDesignStorySystem,
  buildDesignStoryUserPrompt,
} from '@/lib/ai/prompts/humanDesign';
import { logUsage } from '@/lib/db/repositories/usage';
import { prisma } from '@/lib/db/prisma';
import type { ProfileView } from '@/lib/db/repositories/profile';

export interface DesignStoryResult {
  body: string;
  cached: boolean;
}

/**
 * Compute the cache key from the HD fields the story depends on. Bumping
 * `DESIGN_STORY_PROMPT_VERSION` in `prompts/humanDesign.ts` invalidates
 * every cached story across all users.
 */
function chartHashOf(profile: ProfileView): string {
  const parts = [
    DESIGN_STORY_PROMPT_VERSION,
    profile.hdType ?? '',
    profile.hdStrategy ?? '',
    profile.hdAuthority ?? '',
    profile.hdProfileConscious ?? '',
    profile.hdProfileUnconscious ?? '',
    profile.hdDefinition ?? '',
    profile.hdIncarnationCross ?? '',
  ].join('|');
  return createHash('sha1').update(parts).digest('hex').slice(0, 16);
}

/**
 * Returns the cached story when present + still fresh, otherwise calls
 * Claude to generate a new one, persists it, and returns the body.
 * Returns `null` when the profile has no HD chart yet (the UI shows
 * the same empty state used by the hero card).
 */
export async function getOrGenerateDesignStory(
  profile: ProfileView,
  userId: string,
): Promise<DesignStoryResult | null> {
  if (!profile.hdChart || !profile.hdType || !profile.hdStrategy || !profile.hdAuthority) {
    return null;
  }
  const locale: Locale = profile.locale;
  const expectedHash = chartHashOf(profile);

  const cached = await prisma.designStory.findUnique({
    where: { userId_locale: { userId, locale } },
  });
  if (cached && cached.chartHash === expectedHash) {
    return { body: cached.body, cached: true };
  }

  const definedCenters = Object.entries(profile.hdChart.centers)
    .filter(([, v]) => v.defined)
    .map(([k]) => k);

  const sys = buildDesignStorySystem(locale);
  const user = buildDesignStoryUserPrompt({
    locale,
    firstName: profile.nickname?.trim() || profile.firstName,
    type: profile.hdType,
    strategy: profile.hdStrategy,
    authority: profile.hdAuthority,
    profileConscious: profile.hdProfileConscious ?? 1,
    profileUnconscious: profile.hdProfileUnconscious ?? 1,
    definition: profile.hdDefinition ?? 'NONE',
    incarnationCrossName: profile.hdIncarnationCross,
    activeGates: profile.hdChart.activeGates,
    definedCenters,
  });

  const modelId = model('daily', profile.preferredModel);

  let body: string;
  let inputTokens = 0;
  let outputTokens = 0;
  try {
    const response = await anthropic().messages.create({
      model: modelId,
      max_tokens: 600,
      system: sys,
      messages: [{ role: 'user', content: user }],
    });
    inputTokens = response.usage.input_tokens;
    outputTokens = response.usage.output_tokens;
    const block = response.content[0];
    body = block && block.type === 'text' ? block.text.trim() : '';
    if (!body) return null;
  } catch (err) {
    console.error('[designStory] anthropic call failed', err);
    // If the call fails but we have a stale cached version, surface that
    // instead of nothing — better to show stale than blank.
    if (cached) return { body: cached.body, cached: true };
    return null;
  }

  try {
    await prisma.designStory.upsert({
      where: { userId_locale: { userId, locale } },
      update: {
        chartHash: expectedHash,
        body,
        inputTokens,
        outputTokens,
      },
      create: {
        userId,
        locale,
        chartHash: expectedHash,
        body,
        inputTokens,
        outputTokens,
      },
    });
    await logUsage({
      userId,
      feature: 'DAILY',
      model: modelId,
      inputTokens,
      outputTokens,
    });
  } catch (err) {
    console.error('[designStory] persist failed', err);
  }

  return { body, cached: false };
}
