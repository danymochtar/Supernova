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
 * Either default can be overridden via env (`ANTHROPIC_MODEL` for the
 * primary surfaces, `ANTHROPIC_ROLLUP_MODEL` for rollups) without a code
 * change.
 */
export function model(feature: AiFeatureKind = 'chat'): string {
  if (feature === 'rollup') {
    return process.env.ANTHROPIC_ROLLUP_MODEL ?? 'claude-haiku-4-5';
  }
  return process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';
}
