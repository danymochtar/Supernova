import { formatNumerology, type NumerologyResult } from '@/lib/numerology';

export interface DailyPromptInput {
  locale: 'id' | 'en';
  fullName: string;
  firstName: string;
  todayLocal: { year: number; month: number; day: number; weekday: string };
  age: number;
  /** Deterministic theme name for today's Personal Day, e.g. "Change & Versatility". */
  dayTitle: string;
  /**
   * Birthday-anchored Personal Year (Decoz tradition) — the year-of-life
   * the user is currently inside, regardless of the calendar Jan 1 reset.
   * Used as the "year-level" backdrop for daily readings.
   */
  personalYearBirthdayAnchored: NumerologyResult;
  core: {
    lifePath: NumerologyResult;
    expression: NumerologyResult;
    soulUrge: NumerologyResult;
    personality: NumerologyResult;
    birthday: NumerologyResult;
  };
  cycles: {
    personalYear: NumerologyResult;
    personalMonth: NumerologyResult;
    personalDay: NumerologyResult;
  };
  active: {
    pinnacle: { slot: 1 | 2 | 3 | 4; result: NumerologyResult };
    challenge: { slot: 1 | 2 | 3 | 4; result: NumerologyResult };
    cycle: { slot: 1 | 2 | 3; result: NumerologyResult };
  };
  karmicLessons: number[];
  recentPatterns?: string | null;
}

function r(x: NumerologyResult): string {
  const tags: string[] = [];
  if (x.isMaster) tags.push('master');
  if (x.karmicDebt) tags.push(`karmic-${x.karmicDebt}`);
  return tags.length ? `${formatNumerology(x)} (${tags.join(', ')})` : formatNumerology(x);
}

export function buildSystemPrompt(locale: 'id' | 'en'): string {
  if (locale === 'id') {
    return `Kamu adalah pendamping numerologi Supernova yang nulis bacaan harian dalam Bahasa Indonesia santai.

METODE TIGA ANGKA (Decoz / World Numerology):
Setiap hari punya tiga angka yang main bareng:
- Personal Day → vibe utama hari ini (jadi tema dominan)
- Personal Month → ritme bulan ini (konteks sekitar)
- Personal Year (birthday-anchored) → chapter hidup yang lagi user jalani sekarang
Tiga angka ini saling tarik-menarik. Tugas kamu: jelasin gimana mereka bersatu jadi nuansa hari ini — kapan mereka harmonis, kapan mereka tegang, dan apa yang practical buat di-handle.

Aturan:
- Pakai "kamu", bukan "Anda". Nada hangat, ringkas, kayak teman bijak yang ngobrol.
- Boleh code-mix: istilah numerologi seperti "Personal Day", "Personal Month", "Personal Year", "Life Path", "Expression", "Soul Urge", "Pinnacle", "Challenge", "Karmic Lesson", "master number", "karmic debt" TETAP dalam Bahasa Inggris supaya maknanya tidak hilang. Sisanya Indonesia.
- Selalu berdasarkan angka di <profile>. Jangan ngarang.
- JANGAN sebut angka apa pun secara eksplisit di output (misalnya "5", "Personal Day 5", "Life Path 1"). User udah lihat angka di kartu lain — kamu cuma menafsirkan maknanya. Boleh sebut nama komponennya tanpa angkanya ("Personal Day-mu mendorong…", "Personal Year-mu lagi minta…").
- Boleh sebut konsep ("hari yang penuh perubahan", "energi kerjasama", "fase refleksi") tanpa menyebut angkanya.
- Nggak ngasih nasihat medis, hukum, atau finansial.
- Nggak janji kepastian masa depan. Pakai bahasa kemungkinan.
- Hormati identitas user; netral budaya & agama.

Format wajib:
- Mulai dengan satu sapaan singkat ke nama depan user (1 baris pendek).
- Lanjut 2 paragraf prosa (total 140-220 kata): paragraf 1 sintesis vibe hari ini dari kombinasi tiga angka (apa yang dominan, apa yang nge-balance), paragraf 2 saran praktis + satu hal yang perlu diwaspadai lembut.
- Tutup dengan satu kalimat afirmasi yang bisa diulang sepanjang hari, dipisah baris kosong sebelumnya.
- Output prosa biasa — TIDAK ada heading, TIDAK ada bullet, TIDAK ada tag XML, TIDAK ada angka.`;
  }
  return `You are Supernova's numerology companion writing daily readings in clear, warm English.

THREE-NUMBER METHOD (Decoz / World Numerology):
Every day has three numbers playing together:
- Personal Day → today's main vibe (the dominant theme)
- Personal Month → this month's rhythm (the surrounding context)
- Personal Year (birthday-anchored) → the life-chapter the user is in right now
These three pull on each other. Your job: show how they combine into today's texture — where they harmonize, where they tense, and what's practical to handle.

Strict rules:
- Always ground your reading in the numbers in <profile>. Never invent.
- DO NOT name any number explicitly in the output (e.g. "5", "Personal Day 5", "Life Path 1"). The user already sees the numbers on other cards — you only interpret their meaning.
- You may name the *concepts* ("a day of change", "a cooperative energy", "a reflective stretch") and the components by name ("your Personal Day pulls you…", "your Personal Year is asking for…") without writing the digits.
- No medical, legal, or financial advice.
- Never promise certainty. Use possibility language.
- Respect the user's identity; remain culturally neutral.

Required format:
- Open with one short greeting using the user's first name (one line). Example: "Hi [Name], today feels like a fresh wind."
- Then 2 prose paragraphs (120-200 words total) covering: the texture of the day, what's well-suited to do, and one gentle thing to watch.
- End with a single affirmation sentence the user can repeat, separated by a blank line.
- Plain prose only — NO headings, NO bullets, NO XML tags, NO digits.`;
}

export function buildUserPrompt(input: DailyPromptInput): string {
  const { core, cycles, active, karmicLessons } = input;
  const dateStr = `${input.todayLocal.year}-${String(input.todayLocal.month).padStart(2, '0')}-${String(input.todayLocal.day).padStart(2, '0')}`;
  const km = karmicLessons.length ? karmicLessons.join(', ') : 'none';

  return `<profile>
name: ${input.fullName}
first_name: ${input.firstName}
age: ${input.age}
today: ${dateStr} (${input.todayLocal.weekday})
day_theme: ${input.dayTitle}

Core numbers:
- Life Path: ${r(core.lifePath)}
- Expression: ${r(core.expression)}
- Soul Urge: ${r(core.soulUrge)}
- Personality: ${r(core.personality)}
- Birthday: ${r(core.birthday)}

Today's three numbers (this is the Decoz / World Numerology framing — Personal Day, Personal Month, and birthday-anchored Personal Year work together as the day's energy):
- Personal Day (today's vibe): ${r(cycles.personalDay)}
- Personal Month (this month's rhythm): ${r(cycles.personalMonth)}
- Personal Year (current life-year, birthday-anchored): ${r(input.personalYearBirthdayAnchored)}

Calendar Personal Year (Jan 1 reset, for reference): ${r(cycles.personalYear)}

Current chapter:
- Pinnacle ${active.pinnacle.slot}: ${r(active.pinnacle.result)}
- Challenge ${active.challenge.slot}: ${r(active.challenge.result)}
- Period Cycle ${active.cycle.slot}: ${r(active.cycle.result)}

Karmic Lessons: ${km}
</profile>${
    input.recentPatterns
      ? `

<recent_patterns>
${input.recentPatterns}
</recent_patterns>`
      : ''
  }

Write today's reading as prose only. Greet ${input.firstName} by first name, then 2 paragraphs, then a blank line, then one affirmation sentence. Do not mention any numbers.`;
}

export interface ParsedReading {
  /** Greeting line, if present. */
  greeting: string;
  /** Main prose body (2 paragraphs in the new format, 4 sections in the old). */
  body: string;
  /** Final affirmation sentence. Always last paragraph. */
  affirmation: string;
  /** Legacy XML sections, populated only when the cached body uses them. */
  legacy?: {
    theme: string;
    energy: string;
    watch: string;
  };
  raw: string;
}

const LEGACY_RE = {
  theme: /<theme>([\s\S]*?)<\/theme>/i,
  energy: /<energy>([\s\S]*?)<\/energy>/i,
  watch: /<watch>([\s\S]*?)<\/watch>/i,
  affirmation: /<affirmation>([\s\S]*?)<\/affirmation>/i,
};

export function parseReading(raw: string): ParsedReading {
  const trimmed = raw.trim();

  // Old XML format (cached pre-existing readings).
  if (LEGACY_RE.theme.test(trimmed) || LEGACY_RE.affirmation.test(trimmed)) {
    const theme = (trimmed.match(LEGACY_RE.theme)?.[1] ?? '').trim();
    const energy = (trimmed.match(LEGACY_RE.energy)?.[1] ?? '').trim();
    const watch = (trimmed.match(LEGACY_RE.watch)?.[1] ?? '').trim();
    const affirmation = (trimmed.match(LEGACY_RE.affirmation)?.[1] ?? '').trim();
    const body = [theme, energy, watch].filter(Boolean).join('\n\n');
    return {
      greeting: '',
      body,
      affirmation,
      legacy: { theme, energy, watch },
      raw,
    };
  }

  // New prose format. Split by blank lines.
  const paragraphs = trimmed
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return { greeting: '', body: trimmed, affirmation: '', raw };
  }

  // Heuristic: a short first paragraph (<= 140 chars and a single sentence)
  // is treated as the greeting line.
  let greeting = '';
  let rest = paragraphs;
  const first = paragraphs[0]!;
  if (first.length <= 140 && !first.includes('\n')) {
    greeting = first;
    rest = paragraphs.slice(1);
  }

  // Last paragraph is the affirmation.
  let affirmation = '';
  if (rest.length > 1) {
    affirmation = rest[rest.length - 1]!;
    rest = rest.slice(0, -1);
  }

  return {
    greeting,
    body: rest.join('\n\n'),
    affirmation,
    raw,
  };
}
