/**
 * Anthropic pricing snapshots (USD per 1M tokens). Used for cost tracking
 * in `AiUsage` rows — not for billing. Keep this in sync manually when
 * Anthropic changes pricing.
 */
const PRICES: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-6': { input: 3, output: 15 },
  'claude-sonnet-4': { input: 3, output: 15 },
  'claude-opus-4-7': { input: 15, output: 75 },
  'claude-haiku-4-5': { input: 0.8, output: 4 },
};

/** Returns USD cost as a number with up to 6 decimals. */
export function estimateCostUsd(modelId: string, inputTokens: number, outputTokens: number): number {
  const p = PRICES[modelId] ?? PRICES['claude-sonnet-4-6']!;
  const cost = (inputTokens * p.input + outputTokens * p.output) / 1_000_000;
  return Math.round(cost * 1_000_000) / 1_000_000;
}
