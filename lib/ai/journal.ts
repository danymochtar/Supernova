import { anthropic, model } from '@/lib/ai/client';
import {
  buildJournalSystem,
  buildJournalUser,
  type JournalSynthInput,
} from '@/lib/ai/prompts/journal';
import { logUsage } from '@/lib/db/repositories/usage';

export type JournalActionItemKind = 'action' | 'question';

export interface JournalActionItemDraft {
  title: string;
  /** 'action' is a concrete next step; 'question' is a clarifying question
   *  the AI asks because the next step isn't clear yet. */
  kind: JournalActionItemKind;
}

export interface JournalSynthResult {
  narrative: string;
  reframe: string;
  emotion: string;
  theme: string;
  actionItems: JournalActionItemDraft[];
  inputTokens: number;
  outputTokens: number;
}

/**
 * Parse the AI's JSON output. Tolerant: strips code fences, returns null
 * if the narrative is empty (the only truly required field). Reframe,
 * emotion, theme, and actionItems are optional.
 */
function parseJournalJson(raw: string): Omit<JournalSynthResult, 'inputTokens' | 'outputTokens'> | null {
  let body = raw.trim();
  if (body.startsWith('```')) {
    body = body.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  }
  try {
    const obj = JSON.parse(body) as Record<string, unknown>;
    const narrative = typeof obj.narrative === 'string' ? obj.narrative.trim() : '';
    if (!narrative) return null;
    const reframe = typeof obj.reframe === 'string' ? obj.reframe.trim() : '';
    const emotion = typeof obj.emotion === 'string' ? obj.emotion.trim().toLowerCase() : '';
    const theme = typeof obj.theme === 'string' ? obj.theme.trim().toLowerCase() : '';
    const itemsRaw = Array.isArray(obj.actionItems) ? obj.actionItems : [];
    const actionItems: JournalActionItemDraft[] = itemsRaw
      .map((it) => {
        if (!it || typeof it !== 'object') return null;
        const title = (it as { title?: unknown }).title;
        if (typeof title !== 'string' || !title.trim()) return null;
        const rawKind = (it as { kind?: unknown }).kind;
        const kind: JournalActionItemKind = rawKind === 'question' ? 'question' : 'action';
        return { title: title.trim(), kind };
      })
      .filter((it): it is JournalActionItemDraft => it !== null)
      .slice(0, 3);
    return { narrative, reframe, emotion, theme, actionItems };
  } catch {
    return null;
  }
}

/**
 * Synthesize a journal entry from the source turns: first-person
 * narrative + Supernova-voiced reframe + extracted emotion/theme +
 * action items. Returns null if generation fails or the JSON can't
 * be parsed — caller can persist the raw sources without insights
 * as a graceful fallback.
 */
export async function synthesizeJournalNarrative(
  userId: string,
  input: JournalSynthInput,
): Promise<JournalSynthResult | null> {
  const modelId = model('aboutMe', input.preferredModel);
  try {
    const response = await anthropic().messages.create({
      model: modelId,
      max_tokens: 900,
      system: buildJournalSystem(input.locale, input.tone, input.pronoun),
      messages: [{ role: 'user', content: buildJournalUser(input) }],
    });

    const raw = response.content
      .filter((b): b is typeof b & { type: 'text'; text: string } => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();

    const parsed = parseJournalJson(raw);
    if (!parsed) return null;

    await logUsage({
      userId,
      feature: 'QA',
      model: modelId,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    });

    return {
      ...parsed,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    };
  } catch (err) {
    console.error('[journal] synthesis failed', err);
    return null;
  }
}
