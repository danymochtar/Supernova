import { formatNumerology, type Bridges, type NumerologyResult } from '@/lib/numerology';
import type { Locale } from '@/lib/i18n/config';
import { localizeEnglishPrompt } from './_localize';
import { VOICE_ID, VOICE_EN } from './_voice';

export type AspectId = 'love' | 'finance';

export interface AspectInput {
  locale: Locale;
  /** Call-name (nickname || firstName) so prose addresses the user warmly. */
  fullName: string;
  core: {
    lifePath: NumerologyResult;
    expression: NumerologyResult;
    soulUrge: NumerologyResult;
    personality: NumerologyResult;
    birthday: NumerologyResult;
  };
  /** Current Personal Year — drives the "season" section. */
  personalYear: NumerologyResult;
  karmicLessons: number[];
  bridge: Bridges;
  preferredModel?: string | null;
}

/** A section the model emits + its i18n heading key (under the aspect's
 * message namespace). The render iterates this order. */
export interface AspectSection {
  key: string;
  headingKey: string;
}

export interface AspectConfig {
  id: AspectId;
  /** next-intl namespace holding title/subtitle/fallback/section headings. */
  namespace: string;
  sections: AspectSection[];
  idSystem: string;
  enSystem: string;
  buildProfile: (input: AspectInput) => string;
}

function r(x: NumerologyResult): string {
  const tags: string[] = [];
  if (x.isMaster) tags.push('master');
  if (x.karmicDebt) tags.push(`karmic-${x.karmicDebt}`);
  return tags.length ? `${formatNumerology(x)} (${tags.join(', ')})` : formatNumerology(x);
}

// ─── Love ───────────────────────────────────────────────────────────────────

const LOVE_SECTIONS: AspectSection[] = [
  { key: 'whatHeartWants', headingKey: 'whatHeartWantsTitle' },
  { key: 'howYouLove', headingKey: 'howYouLoveTitle' },
  { key: 'partnerArchetype', headingKey: 'partnerArchetypeTitle' },
  { key: 'romanceSeason', headingKey: 'romanceSeasonTitle' },
  { key: 'growthEdge', headingKey: 'growthEdgeTitle' },
];

const LOVE_ID = `Kamu adalah pendamping numerologi Supernova yang nulis profil PERCINTAAN seseorang — gaya cinta dia sendiri, bukan kecocokan sama orang spesifik.

Bahasa: Bahasa Indonesia santai (pakai "kamu", BUKAN "Anda"). Istilah numerologi ("Life Path", "Expression", "Soul Urge", "Personality", "Personal Year", "master number", "karmic debt") TETAP Bahasa Inggris. Sisanya Indonesia. Nada hangat, penuh harap, grounded.

${VOICE_ID}

Output JSON, tiap field 2-3 kalimat:
- "synthesis": buka dengan gimana kamu hadir di percintaan — apa yang kamu bawa ke sebuah hubungan. Sebut nama depan sekali, di tempat yang natural.
- "whatHeartWants": dari Soul Urge — kebutuhan emosional terdalam kamu di hubungan, apa yang bikin kamu ngerasa benar-benar dicintai.
- "howYouLove": dari Expression — cara kamu nunjukin & ngasih cinta, gimana kamu muncul di hubungan.
- "partnerArchetype": tipe partner yang nyambung sama angka kamu — jelasin SIFAT yang melengkapi kamu secara kualitatif. JANGAN ngarang orang spesifik, JANGAN kasih skor.
- "romanceSeason": dari Personal Year — energi percintaan kamu TAHUN INI (lagi waktu buka diri? konsolidasi? refleksi?).
- "growthEdge": dari Karmic Lessons + Bridge — pola yang perlu kamu sadari/tumbuhin biar cinta lebih sehat.

Aturan: JANGAN sebut angka mentah. JANGAN janji masa depan. JANGAN nasihat medis/hukum/finansial. Output WAJIB JSON valid:
{"synthesis":"...","whatHeartWants":"...","howYouLove":"...","partnerArchetype":"...","romanceSeason":"...","growthEdge":"...","affirmation":"..."}`;

const LOVE_EN = `You are Supernova's numerology companion writing a person's LOVE profile — their own romantic nature, NOT compatibility with a specific person.

Warm, hopeful, grounded.

${VOICE_EN}

Output JSON, each field 2-3 sentences:
- "synthesis": open with how you show up in love — what you bring to a relationship. Mention the first name once, somewhere natural.
- "whatHeartWants": from Soul Urge — your deepest emotional need in relationships, what makes you feel truly loved.
- "howYouLove": from Expression — how you show and give love, how you show up in relationships.
- "partnerArchetype": the kind of partner who complements your numbers — describe the qualities qualitatively. DO NOT invent a specific person, DO NOT give a score.
- "romanceSeason": from Personal Year — your romantic energy THIS YEAR (time to open up? consolidate? reflect?).
- "growthEdge": from Karmic Lessons + Bridge — a pattern to be aware of / grow through for healthier love.

Rules: never name raw numbers; no future certainty; no medical/legal/financial advice. Output MUST be valid JSON:
{"synthesis":"...","whatHeartWants":"...","howYouLove":"...","partnerArchetype":"...","romanceSeason":"...","growthEdge":"...","affirmation":"..."}`;

// ─── Finance ──────────────────────────────────────────────────────────────────

const FINANCE_SECTIONS: AspectSection[] = [
  { key: 'moneyNature', headingKey: 'moneyNatureTitle' },
  { key: 'moneyStyle', headingKey: 'moneyStyleTitle' },
  { key: 'financialSeason', headingKey: 'financialSeasonTitle' },
  { key: 'abundanceEdge', headingKey: 'abundanceEdgeTitle' },
];

const FINANCE_ID = `Kamu adalah pendamping numerologi Supernova yang nulis profil KEUANGAN seseorang — hubungan dia sama uang & abundance, bukan nasihat investasi.

Bahasa: Bahasa Indonesia santai (pakai "kamu", BUKAN "Anda"). Istilah numerologi ("Life Path", "Expression", "Soul Urge", "Personality", "Personal Year", "master number", "karmic debt") TETAP Bahasa Inggris. Nada hangat, grounded, memberdayakan.

${VOICE_ID}

Output JSON, tiap field 2-3 kalimat:
- "synthesis": buka dengan gimana kamu relate sama uang & rezeki — ritme kamu sama hal-hal material. Sebut nama depan sekali, di tempat yang natural.
- "moneyNature": dari Life Path & Expression — cara natural kamu menghasilkan & relate sama uang, bakat yang bisa jadi sumber rezeki.
- "moneyStyle": dari Personality & core — kecenderungan kamu soal spend/save/risk, gaya kamu ngurus duit.
- "financialSeason": dari Personal Year — energi finansial kamu TAHUN INI (waktu nabung & konsolidasi? berani ambil peluang? hati-hati?).
- "abundanceEdge": dari Karmic Lessons + Challenge — blok atau pola soal uang yang perlu kamu sadari & tumbuhin.

Aturan KERAS: ini soal MINDSET & hubungan sama uang, BUKAN nasihat investasi/finansial spesifik — jangan pernah nyaranin instrumen, beli/jual, atau angka rupiah. JANGAN sebut angka numerologi mentah. JANGAN janji kekayaan/masa depan. Output WAJIB JSON valid:
{"synthesis":"...","moneyNature":"...","moneyStyle":"...","financialSeason":"...","abundanceEdge":"...","affirmation":"..."}`;

const FINANCE_EN = `You are Supernova's numerology companion writing a person's MONEY profile — their relationship with money & abundance, NOT investment advice.

Warm, grounded, empowering.

${VOICE_EN}

Output JSON, each field 2-3 sentences:
- "synthesis": open with how you relate to money & provision — your rhythm with material things. Mention the first name once, somewhere natural.
- "moneyNature": from Life Path & Expression — how you naturally earn and relate to money, talents that can be a source of income.
- "moneyStyle": from Personality & core — your spend/save/risk tendency, how you handle money.
- "financialSeason": from Personal Year — your financial energy THIS YEAR (time to save & consolidate? take an opportunity? stay cautious?).
- "abundanceEdge": from Karmic Lessons + Challenge — a money block or pattern to be aware of and grow through.

HARD rule: this is about MINDSET & relationship with money, NOT specific investment/financial advice — never recommend instruments, buy/sell, or currency amounts. Never name raw numbers. No wealth/future promises. Output MUST be valid JSON:
{"synthesis":"...","moneyNature":"...","moneyStyle":"...","financialSeason":"...","abundanceEdge":"...","affirmation":"..."}`;

function loveProfile(input: AspectInput): string {
  return `<profile>
name: ${input.fullName}
Soul Urge (heart's desire): ${r(input.core.soulUrge)}
Expression (how you love): ${r(input.core.expression)}
Personality (romantic first impression): ${r(input.core.personality)}
Life Path (love mission): ${r(input.core.lifePath)}
Personal Year (this year's romance season): ${r(input.personalYear)}
Karmic Lessons: ${input.karmicLessons.length ? input.karmicLessons.join(', ') : 'none'}
Bridge (inner alignment): LP×Expr ${input.bridge.lifePathExpression.reduced}, SU×Pers ${input.bridge.soulUrgePersonality.reduced}
</profile>

Return JSON. No raw numbers in any string.`;
}

function financeProfile(input: AspectInput): string {
  return `<profile>
name: ${input.fullName}
Life Path (core drive): ${r(input.core.lifePath)}
Expression (earning talents): ${r(input.core.expression)}
Personality (outer money style): ${r(input.core.personality)}
Soul Urge (what drives value): ${r(input.core.soulUrge)}
Personal Year (this year's financial season): ${r(input.personalYear)}
Karmic Lessons: ${input.karmicLessons.length ? input.karmicLessons.join(', ') : 'none'}
Bridge (inner alignment): LP×Expr ${input.bridge.lifePathExpression.reduced}, SU×Pers ${input.bridge.soulUrgePersonality.reduced}
</profile>

Return JSON. No raw numbers in any string.`;
}

export const ASPECTS: Record<AspectId, AspectConfig> = {
  love: {
    id: 'love',
    namespace: 'love',
    sections: LOVE_SECTIONS,
    idSystem: LOVE_ID,
    enSystem: LOVE_EN,
    buildProfile: loveProfile,
  },
  finance: {
    id: 'finance',
    namespace: 'finance',
    sections: FINANCE_SECTIONS,
    idSystem: FINANCE_ID,
    enSystem: FINANCE_EN,
    buildProfile: financeProfile,
  },
};

export function buildAspectSystem(config: AspectConfig, locale: Locale): string {
  if (locale === 'id') return config.idSystem;
  return localizeEnglishPrompt(config.enSystem, locale);
}

export function buildAspectUser(config: AspectConfig, input: AspectInput): string {
  return config.buildProfile(input);
}

export interface ParsedAspect {
  synthesis: string;
  /** Section key → prose. Only keys declared in the config are kept. */
  sections: Record<string, string>;
  affirmation?: string;
}

export function parseAspect(config: AspectConfig, raw: string): ParsedAspect | null {
  let body = raw.trim();
  if (body.startsWith('```')) {
    body = body.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  }
  try {
    const obj = JSON.parse(body) as Record<string, unknown>;
    const synthesis = typeof obj.synthesis === 'string' ? obj.synthesis.trim() : '';
    if (!synthesis) return null;
    const sections: Record<string, string> = {};
    for (const { key } of config.sections) {
      const v = obj[key];
      if (typeof v === 'string' && v.trim()) sections[key] = v.trim();
    }
    const affirmation =
      typeof obj.affirmation === 'string' && obj.affirmation.trim()
        ? obj.affirmation.trim()
        : undefined;
    return { synthesis, sections, affirmation };
  } catch {
    return null;
  }
}
