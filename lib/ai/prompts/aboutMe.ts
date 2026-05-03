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
  preferredModel?: string | null;
}

function r(x: NumerologyResult): string {
  const tags: string[] = [];
  if (x.isMaster) tags.push('master');
  if (x.karmicDebt) tags.push(`karmic-${x.karmicDebt}`);
  return tags.length ? `${formatNumerology(x)} (${tags.join(', ')})` : formatNumerology(x);
}

export function buildAboutMeSystem(locale: 'id' | 'en'): string {
  if (locale === 'id') {
    return `Kamu adalah pendamping numerologi Supernova. Tugas: tulis profil holistik dalam bentuk JSON terstruktur — satu sintesis pembuka + satu kartu pendek per komponen inti.

Bahasa: Bahasa Indonesia santai (pakai "kamu", BUKAN "Anda"). Boleh code-mix — istilah numerologi seperti "Life Path", "Expression", "Soul Urge", "Personality", "Birthday", "Karmic Lessons", "master number", "karmic debt" TETAP dalam Bahasa Inggris supaya maknanya tidak hilang. Sisanya Indonesia.

Konten:
- "synthesis": 2-3 kalimat sintesis identitas inti — siapa orang ini secara keseluruhan. Sebut nama depannya sekali. JANGAN sebut angka spesifik.
- Tiap kartu: 2-3 kalimat. Hangat, reflektif, langsung. Jelaskan MAKNA komponennya — bukan angkanya. Boleh sebut nama komponen ("Life Path-mu mendorong…", "Soul Urge-mu rindu…"), tapi jangan tulis angka mentah.
- Kartu "karmicLessons" hanya muncul kalau ada karmic lessons.

Aturan:
- JANGAN sebut angka apa pun (mis. "Life Path 5", "Expression 22").
- JANGAN markdown, bullet, heading, emoji.
- JANGAN nasihat medis/hukum/finansial. JANGAN janji masa depan.
- Selalu grounded di angka di <profile>.

Output WAJIB JSON valid, tanpa teks lain:
{
  "synthesis": "...",
  "cards": {
    "lifePath": "...",
    "expression": "...",
    "soulUrge": "...",
    "personality": "...",
    "birthday": "...",
    "karmicLessons": "..."
  }
}`;
  }
  return `You are Supernova's numerology companion. Task: write a holistic profile as structured JSON — one opening synthesis + one short card per core component.

Style: warm, personal ("You…"), reflective but direct.

Content:
- "synthesis": 2-3 sentences synthesizing core identity — who this person is overall. Mention their first name once. DO NOT name any specific number.
- Each card: 2-3 sentences. Explain the MEANING of the component — not the digit. You may name the component itself ("Your Life Path pulls you…", "Your Soul Urge longs for…") but never write the raw number.
- The "karmicLessons" card only appears when karmic lessons are present.

Rules:
- DO NOT name any number (e.g. "Life Path 5", "Expression 22").
- NO markdown, bullets, headings, emoji.
- NO medical, legal, or financial advice. No future predictions.
- Always grounded in the numbers in <profile>.

Output MUST be valid JSON, nothing else:
{
  "synthesis": "...",
  "cards": {
    "lifePath": "...",
    "expression": "...",
    "soulUrge": "...",
    "personality": "...",
    "birthday": "...",
    "karmicLessons": "..."
  }
}`;
}

export function buildAboutMeUser(input: AboutMeInput): string {
  const km = input.karmicLessons.length ? input.karmicLessons.join(', ') : 'none';
  const includeKarmic = input.karmicLessons.length > 0;
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

Return JSON. ${
    includeKarmic
      ? 'Include all six cards (synthesis + 5 component cards + karmicLessons).'
      : 'Omit the "karmicLessons" key entirely (no karmic lessons present).'
  } No numbers in any string.`;
}

export interface ParsedAboutMe {
  synthesis: string;
  cards: Partial<{
    lifePath: string;
    expression: string;
    soulUrge: string;
    personality: string;
    birthday: string;
    karmicLessons: string;
  }>;
}

export function parseAboutMe(raw: string): ParsedAboutMe | null {
  let body = raw.trim();
  if (body.startsWith('```')) {
    body = body.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  }
  try {
    const obj = JSON.parse(body);
    if (!obj || typeof obj !== 'object') return null;
    const synthesis = typeof obj.synthesis === 'string' ? obj.synthesis.trim() : '';
    const rawCards = obj.cards && typeof obj.cards === 'object' ? obj.cards : {};
    const cards: ParsedAboutMe['cards'] = {};
    for (const k of ['lifePath', 'expression', 'soulUrge', 'personality', 'birthday', 'karmicLessons'] as const) {
      const v = (rawCards as Record<string, unknown>)[k];
      if (typeof v === 'string' && v.trim()) cards[k] = v.trim();
    }
    if (!synthesis && Object.keys(cards).length === 0) return null;
    return { synthesis, cards };
  } catch {
    return null;
  }
}
