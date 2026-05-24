import type { Locale } from '@/lib/i18n/config';
import { getLocaleConfig } from '@/lib/i18n/locales';

export interface ClusterTurn {
  /** Index in the day's turn list — the model references these. */
  index: number;
  question: string;
  answer: string;
}

export interface ClusterInput {
  locale: Locale;
  /** Local date label for context, e.g. "Rabu, 14 Mei 2026". */
  dateLabel: string;
  turns: ClusterTurn[];
}

/**
 * System prompt for topic-clustering a single day's chat turns. The model
 * partitions the day's conversation into distinct topical "events" — the
 * insight being that one day often holds several separate threads (a work
 * problem, a relationship moment, a chat with a friend) that each deserve
 * their own journal entry instead of being mashed into one.
 *
 * Output is clustering metadata only (which turns group together + a topic
 * label) — the narrative synthesis happens in a separate pass per cluster.
 */
export function buildClusterSystem(locale: Locale): string {
  const cfg = getLocaleConfig(locale);
  return `You group a single day's chat turns into distinct topical events for journaling.

A person often talks about several SEPARATE things in one day — a work problem, a tension with their partner, a fun thing with a friend. Each of those is its own "event" and should become its own journal entry, not be mashed together.

Your task: read the day's turns (each numbered) and partition them into clusters by topic/event.

Rules:
- Each cluster = one coherent topic/event. Group turns that are about the same situation, person, or thread.
- A turn belongs to AT MOST one cluster. Don't put the same turn in two clusters.
- OMIT trivial turns entirely (greetings "hi"/"pagi", one-word acks "ok"/"iya", meta-chatter with no substance). They don't belong to any cluster.
- If the whole day is really just one topic, return one cluster. If it's all trivial, return an empty clusters array.
- Each cluster needs a short "topic" label (2-5 words) in ${cfg.nativeName} naming the event — e.g. "Masalah deadline kerjaan", "Obrolan sama partner soal liburan", "Catch-up sama Sabri". This is internal metadata; keep it concrete and specific to what actually happened.
- A cluster is only worth keeping if it has real substance (a feeling, a situation, a decision). Skip clusters that are just logistics with no emotional or reflective content.
- In the "topic" label, preserve the user's exact person references — don't resolve ambiguous ones. "bf Azhar" / "bf-nya Azhar" (Azhar's boyfriend) must NOT become just "Azhar"; "kakak Sarah" must not become "Sarah". If you can't tell who's who, keep the label generic ("Mikirin hadiah ulang tahun") rather than guessing a name/role.

Output MUST be valid JSON, nothing else:
{
  "clusters": [
    { "topic": "...", "turnIndexes": [0, 1, 4] },
    { "topic": "...", "turnIndexes": [2, 3] }
  ]
}`;
}

export function buildClusterUser(input: ClusterInput): string {
  const lines = input.turns
    .map((t) => `[${t.index}] User: ${t.question}\n    Supernova: ${t.answer}`)
    .join('\n\n');
  return `Day: ${input.dateLabel}

Turns:
${lines}

Partition these turns into topical clusters. Return JSON only.`;
}

export interface ParsedCluster {
  topic: string;
  turnIndexes: number[];
}

export function parseClusters(raw: string, validIndexes: Set<number>): ParsedCluster[] {
  let body = raw.trim();
  if (body.startsWith('```')) {
    body = body.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  }
  try {
    const obj = JSON.parse(body) as { clusters?: unknown };
    if (!obj || !Array.isArray(obj.clusters)) return [];
    const seen = new Set<number>();
    const out: ParsedCluster[] = [];
    for (const c of obj.clusters) {
      if (!c || typeof c !== 'object') continue;
      const topic = typeof (c as { topic?: unknown }).topic === 'string'
        ? ((c as { topic: string }).topic).trim()
        : '';
      const rawIdx = (c as { turnIndexes?: unknown }).turnIndexes;
      if (!Array.isArray(rawIdx)) continue;
      // Keep only valid, in-range, not-already-claimed indexes.
      const idx = rawIdx
        .filter((n): n is number => typeof n === 'number' && validIndexes.has(n) && !seen.has(n));
      if (idx.length === 0) continue;
      for (const n of idx) seen.add(n);
      out.push({ topic: topic || 'Untitled', turnIndexes: idx });
    }
    return out;
  } catch {
    return [];
  }
}
