import { anthropic, model } from '@/lib/ai/client';
import { logUsage } from '@/lib/db/repositories/usage';
import {
  RESUME_SYSTEM_PROMPT,
  type ParsedResume,
  type ParsedResumeRole,
} from '@/lib/ai/prompts/resumeParse';
import type { TalentVocationId } from '@/lib/numerology/talents';

const VOCATION_IDS: TalentVocationId[] = [
  'business',
  'medicineEducation',
  'legalPolitics',
  'artsDesign',
  'salesPr',
  'scienceEngineering',
  'agriculture',
];

function isVocation(v: unknown): v is TalentVocationId {
  return typeof v === 'string' && (VOCATION_IDS as string[]).includes(v);
}

function safeStr(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function safeDate(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  // Accept YYYY-MM-DD; coerce YYYY-MM to YYYY-MM-01.
  const m = v.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if (!m) return null;
  const [, y, mo, d] = m;
  return `${y}-${mo}-${d ?? '01'}`;
}

function parseModelOutput(raw: string): ParsedResume | null {
  let body = raw.trim();
  if (body.startsWith('```')) {
    body = body.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  }
  try {
    const obj = JSON.parse(body);
    if (!obj || typeof obj !== 'object' || !Array.isArray(obj.roles)) return null;
    const roles: ParsedResumeRole[] = [];
    for (const r of obj.roles as unknown[]) {
      if (!r || typeof r !== 'object') continue;
      const o = r as Record<string, unknown>;
      const title = safeStr(o.title);
      if (!title) continue; // title is required
      const vocation = isVocation(o.vocation) ? o.vocation : 'business';
      roles.push({
        title,
        company: safeStr(o.company),
        startDate: safeDate(o.startDate),
        endDate: safeDate(o.endDate),
        current: o.current === true || o.endDate == null,
        summary: safeStr(o.summary),
        vocation,
      });
    }
    return { roles: roles.slice(0, 12) };
  } catch {
    return null;
  }
}

/**
 * Parse a base64-encoded PDF résumé via Anthropic, returning structured
 * roles (with vocation classification baked in by the model). Returns
 * null on any failure — caller should surface a clear "couldn't parse"
 * error to the user so they can try a different file.
 */
export async function parseResumePdf(
  userId: string,
  pdfBase64: string,
  preferredModel: string | null,
): Promise<ParsedResume | null> {
  const modelId = model('aboutMe', preferredModel);
  try {
    const response = await anthropic().messages.create({
      model: modelId,
      max_tokens: 2500,
      system: RESUME_SYSTEM_PROMPT,
      messages: [
        // SDK 0.32's MessageParam.content type doesn't list "document"
        // as a valid block kind, but the runtime API does accept it for
        // Anthropic's PDF support. Cast the whole message array around
        // the type gap.
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: pdfBase64,
              },
            },
            {
              type: 'text',
              text: 'Extract the work experience as JSON per the schema in the system prompt.',
            },
          ],
        },
      ] as unknown as Parameters<ReturnType<typeof anthropic>['messages']['create']>[0]['messages'],
    });

    const raw = response.content
      .filter((b): b is typeof b & { type: 'text'; text: string } => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();

    const parsed = parseModelOutput(raw);
    if (!parsed) return null;

    await logUsage({
      userId,
      feature: 'QA',
      model: modelId,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    });

    return parsed;
  } catch (err) {
    console.error('[resumeParse] failed', err);
    return null;
  }
}
