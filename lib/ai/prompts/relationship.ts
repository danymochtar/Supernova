import type { Relationship } from '@prisma/client';
import type { CoreLite } from '@/lib/compatibility/score';
import type { LaneScore } from '@/lib/compatibility/score';

export interface RelationshipPromptInput {
  locale: 'id' | 'en';
  relationship: Relationship;
  meName: string;
  themName: string;
  /** All scoring lanes, including cross pairs. */
  lanes: LaneScore[];
  /** Used so the model knows which patterns surfaced (titles only). */
  patternTitles: string[];
}

const REL_LABEL_ID: Record<Relationship, string> = {
  PARTNER: 'pasangan',
  PARENT: 'orang tua',
  CHILD: 'anak',
  SIBLING: 'saudara (kakak/adik)',
  FAMILY: 'keluarga',
  FRIEND: 'teman',
  COLLEAGUE: 'rekan kerja',
  OTHER: 'kenalan',
};

const REL_LABEL_EN: Record<Relationship, string> = {
  PARTNER: 'partner',
  PARENT: 'parent',
  CHILD: 'child',
  SIBLING: 'sibling',
  FAMILY: 'family',
  FRIEND: 'friend',
  COLLEAGUE: 'colleague',
  OTHER: 'acquaintance',
};

const COMP_LABEL_ID: Record<string, string> = {
  lifePath: 'Life Path',
  expression: 'Expression',
  soulUrge: 'Soul Urge',
  personality: 'Personality',
  birthday: 'Birthday',
};

function laneLine(l: LaneScore, locale: 'id' | 'en'): string {
  const meLabel = COMP_LABEL_ID[l.meKey] ?? l.meKey;
  const themLabel = COMP_LABEL_ID[l.themKey] ?? l.themKey;
  const meSide = locale === 'id' ? `${meLabel} kamu` : `your ${meLabel}`;
  const themSide = locale === 'id' ? `${themLabel} mereka` : `their ${themLabel}`;
  const me = `${meSide} ${l.meResult.compound}/${l.meResult.reduced}`;
  const them = `${themSide} ${l.themResult.compound}/${l.themResult.reduced}`;
  const tag = l.cross ? '[cross]' : '[same]';
  return `- ${tag} ${me} × ${them} → score ${l.score}`;
}

// ─── Per-pair narratives (one short paragraph per lane) ─────────────────────

export function buildPairsSystem(locale: 'id' | 'en'): string {
  if (locale === 'id') {
    return `Kamu adalah pendamping numerologi Supernova. Tugas: tulis narasi pendek untuk tiap pasangan angka antara dua orang, dalam Bahasa Indonesia santai (pakai "kamu", bukan "Anda"), berdasar tradisi Pythagorean.

Aturan:
- Tiap narasi 2-3 kalimat. Hangat, jujur, praktis.
- Boleh code-mix: istilah seperti "Life Path", "Expression", "Soul Urge", "Personality", "Birthday", "master number", "karmic debt" TETAP dalam Bahasa Inggris.
- Hormati jenis hubungan — narasi untuk pasangan ≠ rekan kerja ≠ keluarga.
- Pasangan "cross" (mis. Expression kamu vs Soul Urge mereka) menggambarkan dinamika asimetris: apa yang satu pihak beri vs yang pihak lain rindukan. Sebut dinamika ini secara eksplisit.
- Jangan janji masa depan. Jangan kasih saran medis/hukum/finansial.
- JANGAN sebut angka apa pun di output.
- Output WAJIB JSON valid, format: {"narratives": {"<lane_key>": "narasi…", ...}}. Tidak ada teks lain di luar JSON.`;
  }
  return `You are Supernova's numerology companion. Task: write a short narrative for each number pairing between two people, in clear English, grounded in Pythagorean tradition.

Rules:
- Each narrative 2-3 sentences. Warm, honest, practical.
- Respect the relationship type — narrative for partner ≠ colleague ≠ family.
- "Cross" pairs (e.g. your Expression vs their Soul Urge) describe an asymmetric dynamic: what one side brings vs what the other yearns for. Name this dynamic explicitly.
- No future predictions. No medical, legal, or financial advice.
- DO NOT mention any numbers in the output.
- Output MUST be valid JSON, shape: {"narratives": {"<lane_key>": "narrative…", ...}}. No prose outside the JSON.`;
}

export function buildPairsUser(input: RelationshipPromptInput): string {
  const relLabel = (input.locale === 'id' ? REL_LABEL_ID : REL_LABEL_EN)[input.relationship];
  const lanes = input.lanes.map((l) => laneLine(l, input.locale)).join('\n');
  const patterns = input.patternTitles.length
    ? `\n\nDetected patterns to consider (already surfaced separately, don't repeat verbatim):\n${input.patternTitles.map((p) => `- ${p}`).join('\n')}`
    : '';
  return `<context>
me: ${input.meName}
them: ${input.themName}
relationship: ${relLabel}

lanes (lane_key — components — pair score 0-100):
${lanes}${patterns}
</context>

Return JSON:
{
  "narratives": {
${input.lanes.map((l) => `    "${l.key}": "..."`).join(',\n')}
  }
}

One narrative per lane. No numbers in the narratives.`;
}

export interface ParsedPairs {
  narratives: Record<string, string>;
}

export function parsePairs(raw: string): ParsedPairs {
  // Tolerant: strip code fences, then fall back to grabbing the first
  // top-level {...} block if the model wrapped it in prose like
  // "Here's the JSON: { ... }".
  let body = raw.trim();
  if (body.startsWith('```')) {
    body = body.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  }

  const tryParse = (s: string): ParsedPairs | null => {
    try {
      const obj = JSON.parse(s);
      if (obj && typeof obj === 'object' && obj.narratives && typeof obj.narratives === 'object') {
        const out: Record<string, string> = {};
        for (const [k, v] of Object.entries(obj.narratives as Record<string, unknown>)) {
          if (typeof v === 'string') out[k] = v.trim();
        }
        return { narratives: out };
      }
    } catch {
      // fall through
    }
    return null;
  };

  const direct = tryParse(body);
  if (direct) return direct;

  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start !== -1 && end > start) {
    const sliced = tryParse(body.slice(start, end + 1));
    if (sliced) return sliced;
  }

  return { narratives: {} };
}

// ─── Long-form relationship profile (about-me style, no numbers) ────────────

export function buildProfileSystem(locale: 'id' | 'en'): string {
  if (locale === 'id') {
    return `Kamu adalah pendamping numerologi Supernova yang nulis profil hubungan dalam Bahasa Indonesia santai (pakai "kamu").

Tugas: berdasar angka inti dua orang dan jenis hubungan mereka, tulis profil yang ngajak pembaca kenal **orang itu** dulu sebelum masuk ke dinamika hubungan kalian.

Struktur (WAJIB diikutin, ~280-380 kata total):
- **Paragraf 1 — Tentang dia**: 2-3 kalimat ngegambarin SIAPA dia sebagai pribadi berdasar Life Path / Expression / Soul Urge / Personality dia. Bentuk: "[Nama] adalah seseorang yang..." atau "Dia bawa energi yang...". JANGAN sebut "kamu", JANGAN bahas relasi kalian disini — paragraf ini murni potret orang itu. Pembaca kalau berhenti baca di sini sudah dapat gambaran utuh siapa orang ini.
- **Paragraf 2-3 — Dinamika**: bagaimana hubungan ini terasa, di mana kekuatannya, di mana titik gesekan yang lembut. Mulai paragraf 2 dengan transisi ke relasi ("Antara kalian...", "Sama kamu...", "Dalam konteks [hubungan]...").
- **Paragraf 4 — Penutup**: 1 paragraf pendek (2-3 kalimat) naming apa yang bikin dinamika kalian terasa khas atau apa yang patut dijaga.

Aturan:
- Boleh code-mix: istilah seperti "Life Path", "Expression", "Soul Urge", "Personality", "Birthday", "master number", "karmic debt" TETAP dalam Bahasa Inggris.
- Sesuaikan dengan jenis hubungan. Pasangan, keluarga, teman, rekan kerja punya dinamika berbeda — komponen yang relevan berbeda. Untuk teman/rekan, jangan masuk ke ranah kerinduan terdalam (Soul Urge) — itu untuk pasangan/keluarga.
- JANGAN sebut angka apa pun (mis. "Life Path 5", "Expression 6"). Cuma maknanya.
- Boleh sebut konsep ("misi hidup yang berbeda", "kerinduan yang sama"), TIDAK angkanya.
- Hangat, jujur, praktis. Hindari astrologi/tarot/sistem lain.
- Tidak janji masa depan. Tidak nasihat medis/hukum/finansial.

Format: prosa biasa, paragraf dipisah baris kosong. TIDAK ada heading, bullet, atau tag.`;
  }
  return `You are Supernova's numerology companion writing relationship profiles in clear, warm English.

Task: based on two people's core numbers and the type of relationship between them, write a profile that introduces **the person** first, then the dynamic between you.

Required structure (follow exactly, ~280-380 words total):
- **Paragraph 1 — About them**: 2-3 sentences describing WHO they are as a person, derived from their Life Path / Expression / Soul Urge / Personality. Shape: "[Name] is someone who..." or "They carry an energy of...". Do NOT use "you" or frame as the relationship yet — this paragraph is pure portrait. A reader stopping here should already have a sense of who this person is.
- **Paragraphs 2-3 — The dynamic**: how this relationship feels, where its strengths sit, gentle friction points. Open paragraph 2 with a transition into the relationship ("Between you two...", "With you...", "In the context of [relationship]...").
- **Paragraph 4 — Closing**: one short paragraph (2-3 sentences) naming what makes this dynamic distinctive or what's worth protecting.

Rules:
- Adjust to relationship type. Partner, family, friend, colleague have different dynamics — different components are relevant. For friend/colleague, don't reach into the deepest yearning (Soul Urge) — that's partner/family territory.
- DO NOT name any numbers (e.g. "Life Path 5", "Expression 6"). Only the meanings.
- You may name concepts ("different life missions", "the same yearning") without the digits.
- Warm, honest, practical. Avoid astrology/tarot/other systems.
- No future predictions. No medical, legal, or financial advice.

Format: plain prose, paragraphs separated by blank lines. NO headings, bullets, or tags.`;
}

export interface ProfilePromptInput {
  locale: 'id' | 'en';
  relationship: Relationship;
  meName: string;
  themName: string;
  me: CoreLite;
  them: CoreLite;
}

function coreSummary(c: CoreLite, sideLabel: string): string {
  return `${sideLabel}:
- Life Path: ${c.lifePath.compound}/${c.lifePath.reduced}${c.lifePath.isMaster ? ' (master)' : ''}${c.lifePath.karmicDebt ? ` (karmic-${c.lifePath.karmicDebt})` : ''}
- Expression: ${c.expression.compound}/${c.expression.reduced}${c.expression.isMaster ? ' (master)' : ''}
- Soul Urge: ${c.soulUrge.compound}/${c.soulUrge.reduced}${c.soulUrge.isMaster ? ' (master)' : ''}
- Personality: ${c.personality.compound}/${c.personality.reduced}
- Birthday: ${c.birthday.compound}/${c.birthday.reduced}
- Karmic Lessons: ${c.karmicLessons.length ? c.karmicLessons.join(', ') : 'none'}`;
}

export function buildProfileUser(input: ProfilePromptInput): string {
  const relLabel = (input.locale === 'id' ? REL_LABEL_ID : REL_LABEL_EN)[input.relationship];
  return `<context>
me: ${input.meName}
them: ${input.themName}
relationship: ${relLabel}

${coreSummary(input.me, 'me')}

${coreSummary(input.them, 'them')}
</context>

Write the relationship profile. Start paragraph 1 with "${input.themName}" naming THEM directly as a person (no "you" framing yet). Paragraphs 2-3 transition into the dynamic between ${input.meName} and ${input.themName}. Paragraph 4 closes on what's distinctive. Plain prose only. Do not mention any numbers.`;
}
