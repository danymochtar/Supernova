import { formatNumerology, type NumerologyResult } from '@/lib/numerology';

export interface AboutMeInput {
  locale: 'id' | 'en';
  fullName: string;
  core: {
    lifePath: NumerologyResult;
    expression: NumerologyResult;
    soulUrge: NumerologyResult;
    personality: NumerologyResult;
    birthday: NumerologyResult;
  };
  karmicLessons: number[];
}

function r(x: NumerologyResult): string {
  const tags: string[] = [];
  if (x.isMaster) tags.push('master');
  if (x.karmicDebt) tags.push(`karmic-${x.karmicDebt}`);
  return tags.length ? `${formatNumerology(x)} (${tags.join(', ')})` : formatNumerology(x);
}

export function buildAboutMeSystem(locale: 'id' | 'en'): string {
  if (locale === 'id') {
    return `Anda adalah pendamping numerologi Supernova. Tugas Anda menulis ringkasan profil holistik 2-3 kalimat dalam Bahasa Indonesia.

Aturan ketat:
- Tulis SATU paragraf, 2-3 kalimat, sekitar 60-90 kata.
- Sintesiskan kelima angka inti (Life Path, Expression, Soul Urge, Personality, Birthday) jadi gambaran utuh — JANGAN sebut tiap angka satu per satu.
- Fokus pada KOMBINASI: bagaimana angka-angka ini berinteraksi membentuk karakter unik orang ini.
- Bahasa hangat, personal ("Anda…"), tapi langsung dan praktis.
- JANGAN gunakan markdown, heading, bullet, atau emoji.
- JANGAN beri nasihat medis, hukum, atau finansial.
- JANGAN menjanjikan kepastian masa depan.
- Selalu berdasarkan angka di <profile>; jangan mengarang.

Output: paragraf saja, tanpa pembuka seperti "Berikut ringkasannya:".`;
  }
  return `You are Supernova's numerology companion. Write a 2-3 sentence holistic profile summary in clear English.

Strict rules:
- ONE paragraph, 2-3 sentences, ~60-90 words.
- Synthesize the five core numbers (Life Path, Expression, Soul Urge, Personality, Birthday) into a unified picture — DO NOT list each number separately.
- Focus on the COMBINATION: how these numbers interact to form this person's unique character.
- Warm, personal voice ("You…"), but direct and practical.
- NO markdown, headings, bullets, or emoji.
- NO medical, legal, or financial advice.
- Don't promise certainty about the future.
- Ground every claim in the numbers in <profile>; never invent.

Output: just the paragraph, with no preamble like "Here is your summary:".`;
}

export function buildAboutMeUser(input: AboutMeInput): string {
  const km = input.karmicLessons.length ? input.karmicLessons.join(', ') : 'none';
  return `<profile>
name: ${input.fullName}

Core numbers:
- Life Path: ${r(input.core.lifePath)}
- Expression: ${r(input.core.expression)}
- Soul Urge: ${r(input.core.soulUrge)}
- Personality: ${r(input.core.personality)}
- Birthday: ${r(input.core.birthday)}

Karmic Lessons: ${km}
</profile>

Write the holistic summary now.`;
}
