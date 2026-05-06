import { anthropic, model } from '@/lib/ai/client';
import {
  buildJournalSystem,
  buildJournalUser,
  type JournalSynthInput,
} from '@/lib/ai/prompts/journal';
import { logUsage } from '@/lib/db/repositories/usage';

export interface JournalSynthResult {
  narrative: string;
  inputTokens: number;
  outputTokens: number;
}

/**
 * Synthesize a first-person journal narrative from the source turns.
 * Returns null if generation fails — caller can choose to persist the raw
 * sources without a narrative as a graceful fallback.
 */
export async function synthesizeJournalNarrative(
  userId: string,
  input: JournalSynthInput,
): Promise<JournalSynthResult | null> {
  const modelId = model('aboutMe', input.preferredModel);
  try {
    const response = await anthropic().messages.create({
      model: modelId,
      max_tokens: 600,
      system: buildJournalSystem(input.locale, input.tone),
      messages: [{ role: 'user', content: buildJournalUser(input) }],
    });

    const narrative = response.content
      .filter((b): b is typeof b & { type: 'text'; text: string } => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();

    if (!narrative) return null;

    await logUsage({
      userId,
      feature: 'QA',
      model: modelId,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    });

    return {
      narrative,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    };
  } catch (err) {
    console.error('[journal] synthesis failed', err);
    return null;
  }
}
