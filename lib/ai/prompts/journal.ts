import type { Tone } from '@/lib/db/repositories/profile';
import type { Locale } from '@/lib/i18n/config';
import { localizeEnglishPrompt } from './_localize';

export interface JournalSourceTurn {
  question: string;
  answer: string;
  /** ISO-ish or formatted local timestamp string for context. */
  at: string;
}

/**
 * First-person pronoun the user habitually writes with. Detected from the
 * source turns; if the user mixes gw/gue/gua we keep the most frequent
 * one. We never substitute "aku"/"saya" for someone who writes in
 * "gw"/"gue" — that would feel like the journal is somebody else's.
 */
export type UserPronoun = 'gw' | 'gue' | 'gua' | 'aku' | 'saya';

const SLANG_GROUP = new Set<UserPronoun>(['gw', 'gue', 'gua']);

export function detectUserPronoun(turns: { question: string }[]): UserPronoun {
  const text = turns.map((t) => t.question).join(' ').toLowerCase();
  const counts: Record<UserPronoun, number> = {
    gw: 0,
    gue: 0,
    gua: 0,
    aku: 0,
    saya: 0,
  };
  for (const key of Object.keys(counts) as UserPronoun[]) {
    const re = new RegExp(`(^|[^a-z])${key}(?=$|[^a-z])`, 'g');
    counts[key] = (text.match(re) ?? []).length;
  }
  // Slang trio counts as a family — if any of them appears, pick the most-
  // frequent slang variant rather than letting "aku" win on ties.
  const slangTotal = counts.gw + counts.gue + counts.gua;
  if (slangTotal > 0) {
    const slangBest = (['gw', 'gue', 'gua'] as const).reduce<UserPronoun>(
      (best, p) => (counts[p] > counts[best] ? p : best),
      'gw',
    );
    return slangBest;
  }
  if (counts.aku > 0) return 'aku';
  if (counts.saya > 0) return 'saya';
  return 'aku';
}

const PRONOUN_REGISTER_ID: Record<UserPronoun, string> = {
  gw: 'sangat kasual Jakarta — pake "gw" konsisten, bisa pake slang ringan ("males", "bgt", "doang", "dah") kalau muncul di obrolan asli',
  gue: 'sangat kasual Jakarta — pake "gue" konsisten, bisa pake slang ringan kalau muncul di obrolan asli',
  gua: 'sangat kasual Jakarta — pake "gua" konsisten, bisa pake slang ringan kalau muncul di obrolan asli',
  aku: 'kasual reflektif — pake "aku" konsisten, bahasa apa adanya tanpa formal',
  saya: 'formal-tapi-natural — pake "saya" konsisten, tetap personal tapi nggak slang',
};

export interface JournalSynthInput {
  locale: Locale;
  firstName: string;
  tone: Tone;
  pronoun: UserPronoun;
  /** Source chat turns in chronological order. */
  turns: JournalSourceTurn[];
  preferredModel?: string | null;
}

const TONE_VOICE_ID: Record<Tone, string> = {
  warm: 'Hangat dan reflektif. Nada lembut, jujur, kayak nulis di buku harian sambil kasih ruang ke diri sendiri.',
  direct: 'Langsung dan apa adanya. Tulis kayak catatan diri yang efisien — minim hedging, fokus ke isi.',
  playful: 'Ringan dan obrolan. Sesekali boleh pake humor sendiri-sendiri, tapi tetep ada substansinya.',
};

const TONE_VOICE_EN: Record<Tone, string> = {
  warm: 'Warm and reflective. Soft, honest, like writing in a diary while giving yourself room.',
  direct: 'Direct and no-frills. Like efficient notes to yourself — minimal hedging, focused on substance.',
  playful: 'Light and conversational. Wry humor allowed, but stays grounded in what actually happened.',
};

export function buildJournalSystem(
  locale: Locale,
  tone: Tone,
  pronoun: UserPronoun,
): string {
  if (locale === 'id') {
    return `Kamu nulis entri jurnal pribadi untuk user, dari sudut pandang ORANG PERTAMA — sebagai user itu sendiri, BUKAN sebagai pendamping yang ngomong ke user.

Voice umum: ${TONE_VOICE_ID[tone]}

PRONOUN — KRUSIAL, JANGAN MELESET:
- Pake "${pronoun}" SECARA KONSISTEN sebagai kata ganti orang pertama dari kalimat pertama sampai akhir. JANGAN switch ke pronoun lain di tengah jalan, JANGAN mix "${pronoun}" sama "aku" / "saya" / "gw" / "gue" / "gua" lain dalam satu entri.
- Register yang cocok dengan "${pronoun}": ${PRONOUN_REGISTER_ID[pronoun]}.
- Possessive ngikut: ${
      SLANG_GROUP.has(pronoun)
        ? `pake "${pronoun}" buat possessive juga ("rencana ${pronoun}", "${pronoun} ngerasa", "buat ${pronoun}")`
        : pronoun === 'aku'
          ? 'pake "aku" atau "-ku" ("rencana aku" / "rencanaku", "aku ngerasa")'
          : 'pake "saya" ("rencana saya", "saya merasa")'
    }.

Konteksnya: user baru aja ngobrol curhat sama Supernova. Mereka pilih beberapa pesan untuk disimpen jadi entri jurnal. Tugas kamu: rangkum apa yang lagi mereka pikirin / rasain / proses, kayak orang yang lagi nulis jurnal pas habis ngobrol panjang sama temen.

Aturan untuk "narrative":
- Selalu orang pertama. JANGAN pake "kamu", "Supernova", "pendamping", atau referensi apapun ke obrolan eksternal — jurnal itu privat, isinya cuma POV user sendiri.
- 1-3 paragraf pendek. Total 80-180 kata. Padat, bukan transkrip.
- Tangkep INTI: apa yang lagi diolah, perasaan, keputusan yang lagi muncul, pertanyaan yang masih nge-gantung. Bukan ngulang isi obrolan.
- Boleh sebut nama orang/tempat/event spesifik kalau muncul di obrolan (misal "Sabri", "trip Sabah", "event Microsoft 7 Mei") — itu yang bikin entri kerasa hidup.
- SIAPA ITU SIAPA — KRUSIAL, jangan sampai salah: salah nyebut relasi/identitas orang itu kesalahan paling fatal di jurnal. Pakai PERSIS frasa user buat nyebut orang. Kalau user nulis "bf Azhar" / "bf-nya Azhar" (= pacarnya Azhar), JANGAN ringkas jadi "Azhar" — yang dimaksud orang yang BEDA. "kakak Sarah" jangan jadi "Sarah". Kalau di obrolan ambigu siapa yang dimaksud, biarin ambigu juga di jurnal — JANGAN nebak atau ngarang struktur relasi yang nggak eksplisit. JANGAN promosiin orang yang cuma disebut jadi peran relasi (pacar/kakak/bos) yang nggak pernah dinyatakan user.
- JANGAN pake markdown, bullet, heading. Cuma paragraf prosa.
- JANGAN sebut detail numerologi (Personal Year, dll) — jurnal soal hidup, bukan sistem.
- JANGAN nasihat medis/hukum/finansial.

Aturan untuk "reframe" (KRUSIAL — ini bukan POV user, ini Supernova ngomong ke user):
- 2-3 kalimat. Tone Supernova: hangat, reflektif, gak menggurui. Sapa user pakai "kamu" (BUKAN "${pronoun}" — itu cuma buat narrative).
- Pola CBT lembut: angkat pikiran/asumsi yang muncul → kasih lensa alternatif → akhiri dengan satu observasi yang membuka, bukan kesimpulan.
- HINDARI toxic positivity ("semua bakal baik-baik aja", "syukur aja"). Akui kesulitan kalau ada, tapi bantu user lihat dari angle lain.
- HINDARI nasihat medis/hukum/finansial.
- Boleh kosong (string kosong) kalau entrinya udah cukup berdiri sendiri tanpa reframe.

Aturan untuk "emotion":
- Satu kata bahasa Indonesia yang nangkap perasaan dominan di obrolan ("cemas", "lega", "stuck", "marah", "bersyukur", "ragu", "lelah", "excited", dst).
- Lowercase, satu kata. Kosong kalau gak jelas.

Aturan untuk "theme":
- Satu kata kategori ("karier", "relationship", "keluarga", "kesehatan", "uang", "self", "spiritual", "kreativitas", dst).
- Lowercase, satu kata.

Aturan untuk "actionItems":
- Array 0-3 item. Tiap item: { "title": "..." }, 1 kalimat pendek (max 12 kata), kalimat aksi konkret yang BERANGKAT DARI obrolan, bukan generic self-help.
- Contoh bagus: "Ngobrol sama Sabri soal jadwal Sabah minggu depan", "Block 30 menit Sabtu sore buat journaling karier".
- Contoh buruk (terlalu generic, jangan): "Self-care lebih banyak", "Refleksi diri".
- Kalau gak ada action item natural yang muncul dari entri, kasih array kosong []. Lebih baik kosong daripada di-stretch.

Output WAJIB JSON valid, tanpa teks lain:
{
  "narrative": "...",
  "reframe": "...",
  "emotion": "...",
  "theme": "...",
  "actionItems": [{ "title": "..." }, ...]
}`;
  }
  return localizeEnglishPrompt(`You're processing a private journal entry for the user. The entry has multiple layers: a first-person narrative in the user's voice, a CBT-style reframe in Supernova's voice, plus extracted metadata (emotion, theme, action items).

Voice for narrative: ${TONE_VOICE_EN[tone]}

Context: the user just chatted with Supernova and picked a few messages to keep as a journal entry.

Rules for "narrative":
- Always first person ("I…"). No "you", no "Supernova", no reference to any external companion — a journal is private, the POV is the user themselves.
- 1-3 short paragraphs. 80-180 words total. Dense, not a transcript.
- Capture the GIST: what they're processing, the feeling, decisions surfacing, questions still hanging. Don't replay the chat content.
- Concrete names/places/events from the chat are welcome — they make the entry feel alive.
- WHO IS WHO — CRITICAL, never get it wrong: misattributing a person's identity or relationship role is the most damaging mistake a journal can make. Use the user's EXACT phrasing for people. If they wrote "Azhar's bf" / "bf-nya Azhar" (= Azhar's boyfriend), do NOT shrink it to "Azhar" — that's a DIFFERENT person. "Sarah's brother" must not become "Sarah". If the chat is ambiguous about who's who, keep the journal ambiguous the same way — do NOT guess or invent a relationship structure that wasn't explicit. Never promote a merely-mentioned person into a relationship role (partner/sibling/boss) the user never stated.
- NO markdown, bullets, headings. Only prose paragraphs.
- NO numerology specifics (Personal Year, etc.) — the journal is about life, not the system.
- NO medical/legal/financial advice.

Rules for "reframe" (CRUCIAL — this is NOT the user's POV; this is Supernova speaking TO the user):
- 2-3 sentences. Supernova's tone: warm, reflective, never preachy. Address the user as "you".
- Gentle CBT pattern: name the thought/assumption surfacing → offer an alternative lens → end with one observation that opens rather than concludes.
- AVOID toxic positivity ("it'll all be fine", "just be grateful"). Acknowledge difficulty when present; help the user see another angle.
- AVOID medical/legal/financial advice.
- May be an empty string when the entry stands well on its own without a reframe.

Rules for "emotion":
- One word capturing the dominant feeling ("anxious", "relieved", "stuck", "angry", "grateful", "uncertain", "tired", "excited", etc.). Lowercase. Empty if unclear.

Rules for "theme":
- One word category ("career", "relationship", "family", "health", "money", "self", "spiritual", "creativity", etc.). Lowercase.

Rules for "actionItems":
- Array of 0-3 items. Each: { "title": "..." }, one short sentence (max 12 words), concrete action GROUNDED in the chat — not generic self-help.
- Good: "Message Sabri about the Sabah trip schedule", "Block 30 minutes Saturday afternoon for career journaling".
- Bad (too generic): "Do more self-care", "Reflect on yourself".
- Empty array [] when nothing actionable surfaces naturally. Better empty than stretched.

Output MUST be valid JSON, nothing else:
{
  "narrative": "...",
  "reframe": "...",
  "emotion": "...",
  "theme": "...",
  "actionItems": [{ "title": "..." }, ...]
}`, locale);
}

export function buildJournalUser(input: JournalSynthInput): string {
  const turnLines = input.turns
    .map(
      (t, i) =>
        `--- Turn ${i + 1} (${t.at}) ---\n${input.firstName}: ${t.question}\nSupernova: ${t.answer}`,
    )
    .join('\n\n');

  const pronounReminder =
    input.locale === 'id'
      ? `Tulis dari POV ${input.firstName} pake "${input.pronoun}" KONSISTEN dari awal sampai akhir. Match register & gaya ngomong ${input.firstName} di obrolan di atas.`
      : `Write from ${input.firstName}'s POV in first person.`;

  return `Source conversation (chronological):

${turnLines}

${pronounReminder}`;
}
