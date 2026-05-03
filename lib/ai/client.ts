import Anthropic from '@anthropic-ai/sdk';

let cached: Anthropic | null = null;

export function anthropic(): Anthropic {
  if (!cached) {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error('ANTHROPIC_API_KEY is not set');
    cached = new Anthropic({ apiKey: key });
  }
  return cached;
}

export type AiFeatureKind = 'chat' | 'daily' | 'aboutMe' | 'rollup';

/**
 * Per-feature model picker. User-facing surfaces (chat, daily reading, About
 * Me synthesis) default to Sonnet 4.6 — quality matters because the user
 * reads the output. Internal summarization (rollups) defaults to Haiku 4.5
 * — output is just context for future calls, so cheap + fast wins.
 *
 * Per-user override (`profile.preferredModel`) wins for user-facing
 * surfaces only — rollups always use the rollup default since they're
 * internal and cost-sensitive.
 *
 * Env defaults (`ANTHROPIC_MODEL`, `ANTHROPIC_ROLLUP_MODEL`) sit between.
 */
export function model(feature: AiFeatureKind = 'chat', userOverride?: string | null): string {
  if (feature === 'rollup') {
    return process.env.ANTHROPIC_ROLLUP_MODEL ?? 'claude-haiku-4-5';
  }
  if (userOverride) return userOverride;
  return process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';
}
