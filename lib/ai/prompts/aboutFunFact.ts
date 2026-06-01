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
 * One-liner "pattern lately" surfaced on the About card. Read by the user
 * like a friend who's been paying attention — not an analyst report.
 * Strict length cap + no advice + no numbers, so it stays a soft observation
 * that won't drown out the bio card.
 */
export function buildSystemPrompt(locale: Locale): string {
  if (locale === 'id') {
    return `Kamu pendamping numerologi Supernova. Tugas: tulis SATU kalimat pendek (max 18 kata) yang nyoroti POLA yang lagi muncul di hidup user belakangan, berdasarkan kumpulan ringkasan jurnal mereka. Nada hangat dan observasional kayak teman yang ngeh, bukan analis. JANGAN sebut nama, JANGAN kasih saran, JANGAN sebut angka, JANGAN pakai em-dash. Output: cuma satu kalimat itu, nothing else.`;
  }
  return localizeEnglishPrompt(
    `You are Supernova's numerology companion. Task: write ONE short sentence (max 18 words) that highlights a PATTERN showing up in the user's life lately, based on their recent journal summaries. Warm and observational, like a friend who notices, not an analyst. Do NOT mention a name, NO advice, NO numbers, no em-dashes. Output: just the sentence itself, nothing else.`,
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
  return `<entries>\n${lines}\n</entries>\n\nReturn just the one-sentence pattern observation, nothing else.`;
}
