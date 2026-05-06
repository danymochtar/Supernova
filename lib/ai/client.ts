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
 * Per-feature model picker.
 *
 * - `chat`: Sonnet 4.6 by default — the chat needs to follow nuanced
 *   topic-flow / no-tangent / no-numerology-namedrop rules, and Haiku
 *   was drifting on those (re-asking closed topics, dragging in
 *   unrelated context, listing raw numbers). Worth the cost bump for
 *   quality. Override via ANTHROPIC_CHAT_MODEL env or per-user
 *   `profile.preferredModel`.
 * - `daily` / `aboutMe`: Sonnet 4.6 by default — read once, kept
 *   around; quality matters more than latency.
 * - `rollup`: Haiku 4.5 — internal summarization, cost-sensitive.
 *
 * Per-user override (`profile.preferredModel`) wins for user-facing
 * surfaces only — rollups always use the rollup default since they're
 * internal and cost-sensitive.
 */
export function model(feature: AiFeatureKind = 'chat', userOverride?: string | null): string {
  if (feature === 'rollup') {
    return process.env.ANTHROPIC_ROLLUP_MODEL ?? 'claude-haiku-4-5';
  }
  if (userOverride) return userOverride;
  if (feature === 'chat') {
    return process.env.ANTHROPIC_CHAT_MODEL ?? 'claude-sonnet-4-6';
  }
  return process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';
}
