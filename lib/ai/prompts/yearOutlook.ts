import { formatNumerology, type NumerologyResult } from '@/lib/numerology';

export interface YearOutlookInput {
  locale: 'id' | 'en';
  firstName: string;
  year: number;
  age: number;
  personalYear: NumerologyResult;
  cyclePosition: number; // 1-9, where in the user's natural 9-year arc
  pinnacle: { slot: 1 | 2 | 3 | 4; result: NumerologyResult; ageRange: string };
  challenge: { slot: 1 | 2 | 3 | 4; result: NumerologyResult };
  cycle: { slot: 1 | 2 | 3; result: NumerologyResult; ageRange: string };
  essence: { letters: string; result: NumerologyResult };
  preferredModel?: string | null;
}

function r(x: NumerologyResult): string {
  const tags: string[] = [];
  if (x.isMaster) tags.push('master');
  if (x.karmicDebt) tags.push(`karmic-${x.karmicDebt}`);
  return tags.length ? `${formatNumerology(x)} (${tags.join(', ')})` : formatNumerology(x);
}

export function buildYearOutlookSystem(locale: 'id' | 'en'): string {
  if (locale === 'id') {
    return `Kamu pendamping numerologi Supernova. Tugas: rangkum tahun yang lagi dijalani user dalam JSON terstruktur — sintesis pendek dari 4 lapisan (Personal Year, Pinnacle/Challenge aktif, Period Cycle aktif, Essence Cycle), plus tagline, beberapa tips praktis, dan satu afirmasi.

Bahasa: Bahasa Indonesia santai (pakai "kamu", BUKAN "Anda"). Boleh code-mix — istilah numerologi seperti "Personal Year", "Pinnacle", "Challenge", "Cycle", "Essence", "master number", "karmic debt" TETAP dalam Bahasa Inggris. Sisanya Indonesia.

Konten:
- "tagline": frase singkat 4-8 kata yang nangkep inti tahun ini. Bukan judul, bukan kalimat lengkap — kayak slogan internal. Contoh: "Tahun melepas dan menyusun ulang", "Babak konsolidasi dengan napas baru".
- "synthesis": 2-3 paragraf padat (total 100-160 kata). Anyam keempat lapisan jadi satu narasi tahun — gimana Personal Year ${'${year}'} berinteraksi sama Pinnacle/Challenge yang lagi aktif, Period Cycle yang nge-frame dekade ini, dan Essence dari huruf-huruf nama yang lagi mengalir. Sebut nama depan user sekali. JANGAN sebut angka mentah.
- "tips": array 3 string. Tiap tip 1 kalimat aksi praktis — apa yang baik dilakukan / dihindari tahun ini. Spesifik, nggak generik.
- "affirmation": satu kalimat afirmasi orang-pertama ("Aku..."), 8-15 kata, present tense, sesuai vibe tahun.

Aturan:
- JANGAN sebut angka apapun (mis. "Personal Year 5", "Pinnacle 3"). Terjemahin ke makna/feel.
- JANGAN markdown, bullet, heading, emoji.
- JANGAN nasihat medis/hukum/finansial. JANGAN janji masa depan ("kamu pasti…"). Pakai bahasa kemungkinan.
- Selalu grounded di angka di <profile>.

Output WAJIB JSON valid, tanpa teks lain:
{
  "tagline": "...",
  "synthesis": "...",
  "tips": ["...", "...", "..."],
  "affirmation": "..."
}`;
  }
  return `You are Supernova's numerology companion. Task: summarize the user's running year as structured JSON — a short synthesis weaving the four layers (Personal Year, active Pinnacle/Challenge, active Period Cycle, Essence Cycle), plus a tagline, a few practical tips, and one affirmation.

Style: warm, personal ("You…"), reflective but direct.

Content:
- "tagline": a short 4-8 word phrase that captures this year's essence. Not a title, not a full sentence — like an internal slogan.
- "synthesis": 2-3 dense paragraphs (100-160 words total). Weave all four layers into one year-narrative — how this Personal Year interacts with the active Pinnacle/Challenge, the Period Cycle framing this decade, and the Essence flowing from the user's name letters. Mention their first name once. DO NOT name any specific number.
- "tips": an array of 3 strings. Each tip is one sentence of practical action — what to lean into or avoid this year. Specific, not generic.
- "affirmation": one first-person affirmation sentence ("I…"), 8-15 words, present tense, matching the year's vibe.

Rules:
- DO NOT name any number (e.g. "Personal Year 5", "Pinnacle 3"). Translate into meaning/feel.
- NO markdown, bullets, headings, emoji.
- NO medical, legal, or financial advice. NO future certainty ("you will…"). Use possibility language.
- Always grounded in the numbers in <profile>.

Output MUST be valid JSON, nothing else:
{
  "tagline": "...",
  "synthesis": "...",
  "tips": ["...", "...", "..."],
  "affirmation": "..."
}`;
}

export function buildYearOutlookUser(input: YearOutlookInput): string {
  return `<profile>
name: ${input.firstName}
year: ${input.year}
age: ${input.age}

Active layers this year:
- Personal Year: ${r(input.personalYear)} (position ${input.cyclePosition} of 9 in the natural arc)
- Pinnacle ${input.pinnacle.slot} (ages ${input.pinnacle.ageRange}): ${r(input.pinnacle.result)}
- Challenge ${input.challenge.slot}: ${r(input.challenge.result)}
- Period Cycle ${input.cycle.slot} (ages ${input.cycle.ageRange}): ${r(input.cycle.result)}
- Essence Cycle (letters "${input.essence.letters}"): ${r(input.essence.result)}
</profile>

Return JSON. No numbers in any string.`;
}

export interface ParsedYearOutlook {
  tagline: string;
  synthesis: string;
  tips: string[];
  affirmation: string;
}

export function parseYearOutlook(raw: string): ParsedYearOutlook | null {
  let body = raw.trim();
  if (body.startsWith('```')) {
    body = body.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  }
  try {
    const obj = JSON.parse(body);
    if (!obj || typeof obj !== 'object') return null;
    const tagline = typeof obj.tagline === 'string' ? obj.tagline.trim() : '';
    const synthesis = typeof obj.synthesis === 'string' ? obj.synthesis.trim() : '';
    const affirmation = typeof obj.affirmation === 'string' ? obj.affirmation.trim() : '';
    const tipsRaw = Array.isArray(obj.tips) ? obj.tips : [];
    const tips = tipsRaw
      .filter((t: unknown): t is string => typeof t === 'string' && t.trim().length > 0)
      .map((t: string) => t.trim())
      .slice(0, 4);
    if (!synthesis && !tagline && tips.length === 0) return null;
    return { tagline, synthesis, tips, affirmation };
  } catch {
    return null;
  }
}
