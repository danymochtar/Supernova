/**
 * Translate `messages/id.json` (source of truth) into every non-ID
 * locale bundle declared in `lib/i18n/locales.ts`, using Claude.
 *
 * Why Claude and not Google Translate: the source copy is intentionally
 * casual code-mixed Bahasa Indonesia with English numerology terms left
 * intact ("Life Path", "Soul Urge", "master number", "karmic debt").
 * Google Translate flattens that register and translates the jargon
 * literally. Claude can be instructed to preserve the jargon and adapt
 * the casual register to each target language's equivalent.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... pnpm tsx scripts/translate-messages.ts          # all non-ID locales
 *   ANTHROPIC_API_KEY=sk-... pnpm tsx scripts/translate-messages.ts ms zh    # specific locales only
 *   ANTHROPIC_API_KEY=sk-... pnpm tsx scripts/translate-messages.ts --force  # overwrite existing bundles
 *
 * Re-run when `messages/id.json` changes — the script SKIPS locales
 * whose existing bundle has every key the source has (assumed up to
 * date), unless `--force` is passed.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import Anthropic from '@anthropic-ai/sdk';
import { LOCALES, type LocaleCode } from '../lib/i18n/locales';

const ROOT = resolve(__dirname, '..');
const SOURCE = resolve(ROOT, 'messages/id.json');
const MODEL = 'claude-opus-4-7';

interface FlatEntry {
  path: string[];
  value: string;
}

function flatten(obj: unknown, path: string[] = []): FlatEntry[] {
  if (typeof obj === 'string') return [{ path, value: obj }];
  if (Array.isArray(obj)) {
    return obj.flatMap((v, i) => flatten(v, [...path, String(i)]));
  }
  if (obj && typeof obj === 'object') {
    return Object.entries(obj).flatMap(([k, v]) => flatten(v, [...path, k]));
  }
  return [];
}

function setAt(target: Record<string, unknown>, path: string[], value: string): void {
  let cursor: Record<string, unknown> | unknown[] = target;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i]!;
    const next = (cursor as Record<string, unknown>)[key];
    if (next === undefined || next === null) {
      // Auto-create the missing node. Use array if the next path segment
      // is an integer index, else an object.
      const childKey = path[i + 1]!;
      const isArrayChild = /^\d+$/.test(childKey);
      const created: Record<string, unknown> | unknown[] = isArrayChild ? [] : {};
      (cursor as Record<string, unknown>)[key] = created;
      cursor = created;
    } else {
      cursor = next as Record<string, unknown>;
    }
  }
  (cursor as Record<string, unknown>)[path[path.length - 1]!] = value;
}

async function translateBatch(
  client: Anthropic,
  target: LocaleCode,
  entries: FlatEntry[],
): Promise<Record<string, string>> {
  const cfg = LOCALES[target]!;

  const system = `You translate UI strings for Supernova, a numerology PWA, from Bahasa Indonesia (source) into ${cfg.nativeName} (${cfg.englishName}).

CRITICAL RULES (BREAK THESE AND OUTPUT WILL BE REJECTED):
1. Output MUST be valid JSON: one object, keys = "id" indices passed in, values = translated string. Nothing else. No code fences, no commentary.
2. Preserve every ICU placeholder EXACTLY: \`{name}\`, \`{count}\`, \`{year}\`, \`{age}\`, etc. Do NOT translate the placeholder name; do NOT change \`{x}\` to anything else.
3. Preserve numerology jargon in English: Life Path, Expression, Soul Urge, Personality, Birthday, Karmic Lessons, Karmic Debt, Master Number, Pinnacle, Challenge, Period Cycle, Essence Cycle, Personal Year, Personal Month, Personal Day, Bridge.
4. Preserve product names: Supernova.
5. Preserve markdown / formatting if present (line breaks, **bold**, etc.).
6. Match the source's register: it's intentionally casual, code-mixed where natural, friendly — NOT formal. Translate the energy, not literally word-for-word.

STYLE OVERLAY for ${cfg.nativeName}:
${cfg.aiStyleNote}

You will receive a JSON object {"<id>": "<source string>"} and must return {"<id>": "<translated string>"} with the same ids.`;

  // Build numbered batch so we can map back accurately.
  const batch: Record<string, string> = {};
  entries.forEach((e, i) => {
    batch[String(i)] = e.value;
  });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    system,
    messages: [
      {
        role: 'user',
        content: `Translate every value to ${cfg.nativeName}. Return the same JSON shape.\n\n${JSON.stringify(
          batch,
          null,
          2,
        )}`,
      },
    ],
  });

  const raw = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();

  let body = raw;
  if (body.startsWith('```')) {
    body = body.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  }
  const parsed = JSON.parse(body) as Record<string, unknown>;

  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(parsed)) {
    if (typeof v === 'string') out[k] = v;
  }
  return out;
}

async function run() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const explicit = args.filter((a) => !a.startsWith('--')) as LocaleCode[];

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY not set.');
    process.exit(1);
  }

  const source = JSON.parse(readFileSync(SOURCE, 'utf-8'));
  const flat = flatten(source);
  console.log(`Source: ${flat.length} strings from messages/id.json`);

  const targets: LocaleCode[] =
    explicit.length > 0
      ? explicit
      : (Object.keys(LOCALES) as LocaleCode[]).filter((c) => c !== 'id');

  const client = new Anthropic();

  for (const target of targets) {
    const outPath = resolve(ROOT, `messages/${target}.json`);
    const exists = existsSync(outPath);
    if (exists && !force) {
      const existing = JSON.parse(readFileSync(outPath, 'utf-8'));
      const existingFlat = flatten(existing);
      const existingKeys = new Set(existingFlat.map((e) => e.path.join('.')));
      const missing = flat.filter((e) => !existingKeys.has(e.path.join('.')));
      if (missing.length === 0) {
        console.log(`[${target}] up to date — skipping. Pass --force to re-translate.`);
        continue;
      }
      console.log(`[${target}] ${missing.length} new strings to fill`);
      const filled = await translateBatch(client, target, missing);
      missing.forEach((entry, i) => {
        const v = filled[String(i)];
        if (v !== undefined) setAt(existing, entry.path, v);
      });
      writeFileSync(outPath, JSON.stringify(existing, null, 2) + '\n', 'utf-8');
      console.log(`[${target}] wrote ${missing.length} new strings`);
    } else {
      console.log(`[${target}] full translation — ${flat.length} strings`);
      // Chunk into 80-entry batches to keep response sizes manageable.
      const chunkSize = 80;
      const out: Record<string, unknown> = {};
      for (let i = 0; i < flat.length; i += chunkSize) {
        const chunk = flat.slice(i, i + chunkSize);
        const filled = await translateBatch(client, target, chunk);
        chunk.forEach((entry, j) => {
          const v = filled[String(j)];
          if (v !== undefined) setAt(out, entry.path, v);
          else console.warn(`[${target}] missing translation for ${entry.path.join('.')}`);
        });
        console.log(`[${target}] ${Math.min(i + chunkSize, flat.length)}/${flat.length}`);
      }
      writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n', 'utf-8');
      console.log(`[${target}] wrote messages/${target}.json`);
    }
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
