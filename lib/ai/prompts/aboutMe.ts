import { bridges, formatNumerology, type MinorNumbers, type NumerologyResult } from '@/lib/numerology';
import type { Locale } from '@/lib/i18n/config';
import { localizeEnglishPrompt } from './_localize';
import { VOICE_ID, VOICE_EN } from './_voice';

export interface AboutMeInput {
  locale: Locale;
  fullName: string;
  core: {
    lifePath: NumerologyResult;
    expression: NumerologyResult;
    soulUrge: NumerologyResult;
    personality: NumerologyResult;
    birthday: NumerologyResult;
  };
  /** Minor numbers from the call-name (nickname || firstName). When the
   * user hasn't set a nickname, the caller may pass null and the model
   * will omit the minorNarrative card. */
  minor: MinorNumbers | null;
  karmicLessons: number[];
  preferredModel?: string | null;
}

function r(x: NumerologyResult): string {
  const tags: string[] = [];
  if (x.isMaster) tags.push('master');
  if (x.karmicDebt) tags.push(`karmic-${x.karmicDebt}`);
  return tags.length ? `${formatNumerology(x)} (${tags.join(', ')})` : formatNumerology(x);
}

export function buildAboutMeSystem(locale: Locale): string {
  if (locale === 'id') {
    return `Kamu adalah pendamping numerologi Supernova. Tugas: tulis profil holistik dalam bentuk JSON terstruktur — satu sintesis pembuka + satu kartu pendek per komponen inti + dua narasi pendek untuk Minor dan Bridge.

Bahasa: Bahasa Indonesia santai (pakai "kamu", BUKAN "Anda"). Boleh code-mix — istilah numerologi seperti "Life Path", "Expression", "Soul Urge", "Personality", "Birthday", "Karmic Lessons", "Minor", "Bridge", "master number", "karmic debt" TETAP dalam Bahasa Inggris supaya maknanya tidak hilang. Sisanya Indonesia.

${VOICE_ID}

Sudut pandang: tulis ke orang kedua, ngomong LANGSUNG ke "kamu". JANGAN pakai nama atau "dia" (ini bacaan tentang diri user sendiri).

Konten:
- "synthesis": 4-5 kalimat, satu paragraf utuh yang ngalir — potret identitas inti kamu: gimana kamu bergerak di dunia, apa yang ngegerakin kamu, ketegangan/keunikan yang bikin kamu jadi kamu. Lebih kaya dari sekadar daftar sifat. JANGAN sebut nama. JANGAN sebut angka spesifik.
- Tiap kartu inti: 2-3 kalimat, ngomong langsung ke "kamu". Hangat, reflektif, langsung. Jelaskan MAKNA komponennya, bukan angkanya.
- Kartu "karmicLessons" hanya muncul kalau ada karmic lessons.
- "minorNarrative": 2-3 kalimat — jelaskan MAKNA Minor Numbers spesifik kamu (cara kamu muncul di hubungan sehari-hari saat dipanggil dengan call-name) pakai bahasa manusia yang gampang dicerna. Singgung halus di mana beda/selaras sama core dari nama akta. Hanya muncul kalau <profile> punya minor block.
- "bridgeNarrative": 2-3 kalimat — jelaskan apa artinya Bridge Numbers kamu buat hidup kamu: seberapa selaras misi & bakat (Life Path × Expression), dan inner self & tampilan luar (Soul Urge × Personality). Pakai bahasa manusia. Selalu muncul.

Aturan:
- JANGAN sebut angka apa pun di output (mis. "Life Path 5", "Bridge 4").
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
  },
  "minorNarrative": "...",
  "bridgeNarrative": "..."
}`;
  }
  return localizeEnglishPrompt(`You are Supernova's numerology companion. Task: write a holistic profile as structured JSON — one opening synthesis + one short card per core component + two short narratives for Minor and Bridge.

Style: warm, personal, reflective but direct.

Point of view: write in the second person, addressing "you" DIRECTLY. Do NOT use a name or "they/them" (this is the user's reading of their own self).

${VOICE_EN}

Content:
- "synthesis": 4-5 sentences, one flowing paragraph — a fuller portrait of your core identity: how you move through the world, what drives you, the tension/signature that makes you *you*. Richer than a list of traits. Do NOT mention a name. DO NOT name any specific number.
- Each core card: 2-3 sentences, speaking directly to "you". Explain the MEANING of the component, not the digit.
- The "karmicLessons" card only appears when karmic lessons are present.
- "minorNarrative": 2-3 sentences — explain the MEANING of your specific Minor Numbers (how you show up in day-to-day interactions when people call you by your call-name) in plain, easy-to-digest language. Gently compare to the legal-name core: where there's friction, where alignment. Only included when <profile> has a minor block.
- "bridgeNarrative": 2-3 sentences — explain what your Bridge Numbers mean for your life: how aligned mission and talent are (Life Path × Expression), and inner self vs outer presentation (Soul Urge × Personality). Plain language, not technical numerology jargon. Always included.

Rules:
- DO NOT name any number in the output (e.g. "Life Path 5", "Bridge 4").
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
  },
  "minorNarrative": "...",
  "bridgeNarrative": "..."
}`, locale);
}

export function buildAboutMeUser(input: AboutMeInput): string {
  const km = input.karmicLessons.length ? input.karmicLessons.join(', ') : 'none';
  const includeKarmic = input.karmicLessons.length > 0;
  const br = bridges(input.core);
  const minorBlock = input.minor
    ? `

Minor Numbers (computed from call-name, the day-to-day social self):
- Minor Expression: ${r(input.minor.minorExpression)}
- Minor Soul Urge: ${r(input.minor.minorSoulUrge)}
- Minor Personality: ${r(input.minor.minorPersonality)}
The Minor numbers describe how this person shows up when people use their nickname / call-name in everyday life. The core numbers above (from the full legal name) remain the deeper foundation. Use the Minor block to color "minorNarrative" — call out subtle differences vs the core where helpful.`
    : '';
  return `<profile>
name: ${input.fullName}

Core numbers:
- Life Path: ${r(input.core.lifePath)}
- Expression: ${r(input.core.expression)}
- Soul Urge: ${r(input.core.soulUrge)}
- Personality: ${r(input.core.personality)}
- Birthday: ${r(input.core.birthday)}

Karmic Lessons: ${km}

Bridge Numbers (gap between paired core numbers — informs how easily two facets integrate):
- Life Path × Expression bridge: ${br.lifePathExpression.reduced} (talent ↔ mission alignment)
- Soul Urge × Personality bridge: ${br.soulUrgePersonality.reduced} (inner self ↔ outer presentation alignment)
Use these to write "bridgeNarrative" in plain human language — small bridges = smooth integration, large bridges = the person is stretched between two facets and growth lives in the gap. Also let them subtly color the opening synthesis tone. Do NOT mention bridge numbers literally in the output.${minorBlock}
</profile>

Return JSON. ${
    includeKarmic
      ? 'Include all six core cards (synthesis + 5 component cards + karmicLessons) plus bridgeNarrative.'
      : 'Omit the "karmicLessons" key entirely (no karmic lessons present). Always include bridgeNarrative.'
  } ${input.minor ? 'Include "minorNarrative".' : 'Omit "minorNarrative" entirely.'} No numbers in any string.`;
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
  /** Plain-language narrative explaining the user's Minor numbers in the
   * context of their day-to-day social self. Only present when minor
   * numbers were supplied in the input. */
  minorNarrative?: string;
  /** Plain-language narrative for the two Bridge gaps (LP×Expr, SU×Pers).
   * Always present unless the model failed to emit it. */
  bridgeNarrative?: string;
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
    const minorNarrative =
      typeof (obj as Record<string, unknown>).minorNarrative === 'string'
        ? ((obj as Record<string, unknown>).minorNarrative as string).trim() || undefined
        : undefined;
    const bridgeNarrative =
      typeof (obj as Record<string, unknown>).bridgeNarrative === 'string'
        ? ((obj as Record<string, unknown>).bridgeNarrative as string).trim() || undefined
        : undefined;
    if (!synthesis && Object.keys(cards).length === 0) return null;
    return { synthesis, cards, minorNarrative, bridgeNarrative };
  } catch {
    return null;
  }
}
