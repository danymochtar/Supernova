import type { Tone } from '@/lib/db/repositories/profile';

export interface JournalSourceTurn {
  question: string;
  answer: string;
  /** ISO-ish or formatted local timestamp string for context. */
  at: string;
}

export interface JournalSynthInput {
  locale: 'id' | 'en';
  firstName: string;
  tone: Tone;
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

export function buildJournalSystem(locale: 'id' | 'en', tone: Tone): string {
  if (locale === 'id') {
    return `Kamu nulis entri jurnal pribadi untuk user, dari sudut pandang ORANG PERTAMA — sebagai user itu sendiri ("aku..."), BUKAN sebagai pendamping yang ngomong ke user.

Voice: ${TONE_VOICE_ID[tone]}

Konteksnya: user baru aja ngobrol curhat sama Supernova. Mereka pilih beberapa pesan untuk disimpen jadi entri jurnal. Tugas kamu: rangkum apa yang lagi mereka pikirin / rasain / proses, kayak orang yang lagi nulis jurnal pas habis ngobrol panjang sama temen.

Aturan:
- Selalu pake "aku" (orang pertama). Jangan pake "kamu", "Supernova", "pendamping", atau referensi apapun ke obrolan eksternal — jurnal itu privat, isinya cuma POV user sendiri.
- 1-3 paragraf pendek. Total 80-180 kata. Padat, bukan transkrip.
- Tangkep INTI: apa yang lagi diolah, perasaan, keputusan yang lagi muncul, pertanyaan yang masih nge-gantung. Bukan ngulang isi obrolan.
- Boleh sebut nama orang/tempat/event spesifik kalau muncul di obrolan (misal "Sabri", "trip Sabah", "event Microsoft 7 Mei") — itu yang bikin entri kerasa hidup.
- JANGAN pake markdown, bullet, heading. Cuma paragraf prosa.
- JANGAN sebut detail numerologi (Personal Year, dll) — jurnal soal hidup, bukan sistem.
- JANGAN nasihat medis/hukum/finansial.

Output: cuma teks paragraf, tanpa pembuka, tanpa penutup.`;
  }
  return `You're writing a private journal entry for the user, from FIRST PERSON — as the user themselves ("I…"), NOT as a companion talking to them.

Voice: ${TONE_VOICE_EN[tone]}

Context: the user just chatted with Supernova and picked a few messages to keep as a journal entry. Your job: summarize what they're thinking through / feeling / processing — the way someone writes in their journal after a long conversation with a friend.

Rules:
- Always first person ("I…"). No "you", no "Supernova", no reference to any external companion — a journal is private, the POV is the user themselves.
- 1-3 short paragraphs. 80-180 words total. Dense, not a transcript.
- Capture the GIST: what they're processing, the feeling, decisions surfacing, questions still hanging. Don't replay the chat content.
- Concrete names/places/events from the chat are welcome ("Sabri", "Sabah trip", "Microsoft event on May 7") — they make the entry feel alive.
- NO markdown, bullets, headings. Only prose paragraphs.
- NO numerology specifics (Personal Year, etc.) — the journal is about life, not the system.
- NO medical/legal/financial advice.

Output: just the paragraph text, no preamble or sign-off.`;
}

export function buildJournalUser(input: JournalSynthInput): string {
  const turnLines = input.turns
    .map(
      (t, i) =>
        `--- Turn ${i + 1} (${t.at}) ---\n${input.firstName}: ${t.question}\nSupernova: ${t.answer}`,
    )
    .join('\n\n');

  return `Source conversation (chronological):

${turnLines}

Write the journal entry now, in first person, as ${input.firstName}.`;
}
