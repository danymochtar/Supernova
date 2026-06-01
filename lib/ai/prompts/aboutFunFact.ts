import type { Locale } from '@/lib/i18n/config';
import { localizeEnglishPrompt } from './_localize';

export interface FunFactEntry {
  theme: string | null;
  emotion: string | null;
  category: string | null;
  narrative: string;
}

export interface AboutFunFactInput {
  locale: Locale;
  entries: FunFactEntry[];
}

/**
 * One-liner "signature trait" surfaced on the About card. Reads like a
 * friend pointing out WHO you are — not what you've been doing. Trait
 * gets detected by reading across recent journal entries, but the output
 * frames it as a characteristic, not a diary summary.
 *
 * Strict length cap + no advice + no numbers, so it stays a soft
 * observation that won't drown out the bio card.
 */
export function buildSystemPrompt(locale: Locale): string {
  if (locale === 'id') {
    return `Kamu pendamping numerologi Supernova. Tugas: tulis SATU kalimat pendek (max 18 kata) yang nyoroti SIFAT atau TRAIT khas user — vibe/signature yang konsisten muncul di balik entry-entry jurnal mereka.

Fokus ke SIAPA mereka sebagai orang, BUKAN apa yang lagi mereka alami atau lakuin belakangan ini. Bukan "belakangan kamu sering X" — itu diary report. Tapi "kamu tipe orang yang Y" / "trait khas kamu Z" / "vibe kamu kayak A yang B".

Gaya: hangat, spesifik, percaya diri, kayak teman lama yang bilang "gw tau lo itu orangnya begini". JANGAN sebut nama, JANGAN kasih saran, JANGAN sebut angka, JANGAN pakai em-dash. Output: cuma satu kalimat itu, nothing else.`;
  }
  return localizeEnglishPrompt(
    `You are Supernova's numerology companion. Task: write ONE short sentence (max 18 words) that highlights a SIGNATURE TRAIT or CHARACTERISTIC of the user — the consistent vibe/signature showing through across their journal entries.

Focus on WHO they are as a person, NOT what they've been doing or going through lately. Not "you've been X recently" — that's a diary report. Rather "you're the type who Y" / "your signature trait is Z" / "your vibe is the kind that A while B".

Style: warm, specific, confident, like a friend who's known them and is naming what they see. Do NOT mention a name, NO advice, NO numbers, no em-dashes. Output: just the sentence itself, nothing else.`,
    locale,
  );
}

export function buildUserPrompt(input: AboutFunFactInput): string {
  const lines = input.entries
    .map((e, i) => {
      const tags = [e.category, e.theme, e.emotion].filter(Boolean).join(' / ');
      const head = tags ? `[${tags}] ` : '';
      // Trim narrative so we don't blow tokens — the model only needs the gist.
      return `${i + 1}. ${head}${e.narrative.slice(0, 240)}`;
    })
    .join('\n');
  return `<entries>\n${lines}\n</entries>\n\nRead across these as evidence of WHO this person is. Return just the one-sentence trait observation (not a diary summary), nothing else.`;
}
