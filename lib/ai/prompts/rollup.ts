/**
 * Summarization prompts for the hierarchical chat history rollup.
 *
 * - Daily: turns from one day → ~80-120 word summary
 * - Weekly: 7 daily summaries → ~150-200 word arc
 * - Monthly: 4-5 weekly summaries → ~250-350 word narrative
 *
 * All summaries are written in first-person from the user's perspective so
 * they read like a journal continuation when re-injected into chat context.
 */

export type RollupKind = 'daily' | 'weekly' | 'monthly';

const TARGETS: Record<RollupKind, { max: number; words: string }> = {
  daily: { max: 280, words: '80-120' },
  weekly: { max: 480, words: '150-200' },
  monthly: { max: 800, words: '250-350' },
};

export function rollupSystemPrompt(kind: RollupKind, locale: 'id' | 'en'): string {
  const t = TARGETS[kind];
  if (locale === 'id') {
    return `Kamu nulis ringkasan jurnal ${kind === 'daily' ? 'harian' : kind === 'weekly' ? 'mingguan' : 'bulanan'} dari riwayat percakapan user dengan pendamping numerologi.

Aturan:
- Tulis dalam sudut pandang orang pertama ("Saya..."). Bukan "user" atau "kamu".
- ${t.words} kata. Padat, naratif, kronologis kalau relevan.
- Tangkap: nada emosional, topik utama, keputusan/wawasan, tema yang berulang.
- JANGAN ulang detail numerologi spesifik (angka, perhitungan) — itu udah ada di tempat lain.
- JANGAN pakai markdown, bullet, atau heading. Cuma paragraf prosa.
- Skip basa-basi; langsung ke isi.

Output: paragraf aja, tanpa pembuka.`;
  }
  return `You write ${kind} journal summaries from a user's chat history with their numerology companion.

Rules:
- Write in first person ("I..."). Not "the user" or "you".
- ${t.words} words. Dense, narrative, chronological where relevant.
- Capture: emotional tone, main topics, decisions/insights, recurring themes.
- DO NOT repeat specific numerology details (numbers, calculations) — those live elsewhere.
- NO markdown, bullets, or headings. Plain prose paragraphs only.
- Skip pleasantries; jump straight in.

Output: just the paragraph(s), no preamble.`;
}

export function rollupMaxTokens(kind: RollupKind): number {
  return TARGETS[kind].max;
}

/** Format raw turns into a transcript for the rollup prompt. */
export function turnsToTranscript(
  turns: { question: string; answer: string; createdAt: Date }[],
): string {
  return turns
    .map((t) => `[${t.createdAt.toISOString()}]\nUser: ${t.question}\nCompanion: ${t.answer}`)
    .join('\n\n');
}

/** Format prior summaries into a chronological list for higher-level rollup. */
export function summariesToList(
  summaries: { periodStart: Date; periodEnd: Date; summary: string }[],
): string {
  return summaries
    .map(
      (s) =>
        `[${s.periodStart.toISOString().slice(0, 10)} → ${s.periodEnd.toISOString().slice(0, 10)}]\n${s.summary}`,
    )
    .join('\n\n');
}
