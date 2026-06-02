import type { Relationship } from '@prisma/client';
import type { Locale } from '@/lib/i18n/config';
import { localizeEnglishPrompt } from './_localize';
import { VOICE_ID, VOICE_EN } from './_voice';

export interface PairMonthlyInput {
  locale: Locale;
  relationship: Relationship;
  /** Display name for the user (the "me" side). */
  myName: string;
  /** Display name for the person. */
  themName: string;
  year: number;
  month: number; // 1-12
  /** Both Personal Months for the same calendar month, reduced single digits
   *  (masters reduced to root for the pair narrative — matches WN's
   *  Relationship Monthly Forecast convention). */
  myPm: number;
  themPm: number;
  /** Optional Personal Years for context (both people's PYs for the year). */
  myPy: number;
  themPy: number;
}

/**
 * Short Pair Monthly Compatibility narrative — mirrors WN's
 * "Your Personal Month's Compatibility for {Month} is {a} and {b}" panel.
 * Output: 3-5 sentences of plain prose. No numbers in the body.
 */
export function buildSystemPrompt(locale: Locale): string {
  if (locale === 'id') {
    return `Kamu pendamping numerologi Supernova. Tulis 3-5 kalimat tentang dinamika hubungan antara dua orang untuk satu bulan kalender, berdasarkan pasangan Personal Month mereka (masing-masing 1-9). Nada hangat, observasional. Sesuaikan tone dengan jenis hubungan: pasangan = boleh masuk ke ranah emosi; teman/rekan kerja = lebih ringan dan praktis; orang tua/saudara = hormat + family-aware.

${VOICE_ID}

JANGAN sebut angka spesifik, JANGAN sebut nama "Personal Month", JANGAN kasih saran medis/hukum/finansial. JANGAN pakai em-dash. Output: cuma paragraf itu, nothing else.`;
  }
  return localizeEnglishPrompt(
    `You are Supernova's numerology companion. Write 3-5 sentences about the dynamic between two people for one calendar month, based on the pair of their Personal Months (each 1-9). Warm, observational tone. Adapt to the relationship type: partner = emotional territory OK; friend/colleague = lighter and practical; parent/sibling = respectful and family-aware.

${VOICE_EN}

Do NOT name specific numbers, do NOT say "Personal Month", no medical/legal/financial advice, no em-dashes. Output: just that paragraph, nothing else.`,
    locale,
  );
}

export function buildUserPrompt(input: PairMonthlyInput): string {
  const monthName = new Intl.DateTimeFormat(input.locale, { month: 'long' }).format(
    new Date(Date.UTC(2000, input.month - 1, 1)),
  );
  return `<context>
relationship: ${input.relationship}
month: ${monthName} ${input.year}
${input.myName}'s personal month: ${input.myPm} (year cycle: ${input.myPy})
${input.themName}'s personal month: ${input.themPm} (year cycle: ${input.themPy})
</context>

Return just the 3-5 sentence pair-monthly narrative, nothing else.`;
}
