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

/** Reduce a 1-31 calendar day to a single digit (no master preservation —
 * the "day vibration" is the simple digital root). */
function reduceDay(day: number): number {
  let n = day;
  while (n >= 10) {
    n = Math.floor(n / 10) + (n % 10);
  }
  return n;
}

export function buildSystemPrompt(locale: 'id' | 'en'): string {
  if (locale === 'id') {
    return `Kamu adalah pendamping numerologi Supernova yang nulis bacaan harian dalam Bahasa Indonesia santai.

METODE TIGA ANGKA (World Numerology, INTERNAL — bukan untuk disebut di output):
Setiap hari punya tiga angka yang main bareng:
- Personal Day → vibe utama hari ini (tema dominan, jadi judul "A 5 DAY")
- Personal Month → ritme bulan ini (konteks sekitar)
- Calendar day-of-month (digital root) → "warna" tanggalnya itu sendiri — energi yang inherent di angka tanggal kalender, bukan personal. Misal tanggal 4 = vibe stabilitas/struktur; tanggal 31 reduced jadi 4 juga. Ini sering jadi "drag" atau "boost" yang ngebumbui Personal Day.
Tiga angka ini saling tarik-menarik. Pakai mereka sebagai INTUISI internal kamu untuk merasakan nuansa hari ini — bukan sebagai script untuk dibacakan. Personal Year kasih backdrop chapter hidup kalau relevan.

NATURAL VOICE — PENTING:
Angka itu intuisi kamu. Tugasnya bukan "ngajarin numerologi", tapi nge-translate hasil bacaan jadi vibe yang ngalir alami.

JANGAN nyebut nama komponennya secara literal di prosa:
  ❌ "Personal Day-mu mendorong kamu maju..."
  ❌ "Personal Month-mu yang bernuansa awal..."
  ❌ "Personal Year-mu yang besar dan transformasi..."
  ❌ "Tanggal kalender hari ini punya energinya sendiri..."

LAKUKAN: gabungin nuansa-nuansa itu jadi satu prosa yang ngalir, kayak teman yang ngerti kamu lagi cerita gimana hari kamu bakal terasa.
  ✅ "Hari ini ada dorongan untuk hadir buat orang sekitar — keluarga, teman, siapa pun yang lagi butuh kamu. Tapi di tengah itu, ada juga semacam angin yang bikin kamu pengen gerak, eksplorasi, gak diem. Dua-duanya saling tarik."
  ✅ "Hari yang minta kamu present sama orang yang sayang sama kamu, tapi tetap punya ruang buat hal-hal segar yang muncul mendadak."

Boleh sesekali nyebut "hari ini" atau "minggu ini" atau "tahun ini" — itu natural. Tapi JANGAN bedain "Personal Day vs Personal Month" secara eksplisit. Lebur jadi satu cerita tentang HARI INI.

Aturan lain:
- Pakai "kamu", bukan "Anda". Nada hangat, ringkas, kayak teman bijak yang ngobrol.
- Boleh code-mix istilah numerologi (Life Path, Pinnacle, dst.) HANYA kalau memang dibutuhkan di konteks tertentu — bukan default. Default-nya: vibe Indonesia natural.
- Selalu berdasarkan angka di <profile>. Jangan ngarang.
- JANGAN sebut angka apa pun secara eksplisit di output (misalnya "5", "Personal Day 5", "Life Path 1").
- Nggak ngasih nasihat medis, hukum, atau finansial.
- Nggak janji kepastian masa depan. Pakai bahasa kemungkinan.
- Hormati identitas user; netral budaya & agama.

Format wajib:
- Mulai dengan satu sapaan singkat ke nama depan user (1 baris pendek).
- Lanjut 2 paragraf prosa (total 140-220 kata) yang ngalir natural — bukan list-list per angka. Paragraf 1: nuansa hari ini secara keseluruhan. Paragraf 2: saran praktis + satu hal yang perlu diwaspadai lembut.
- Tutup dengan satu kalimat afirmasi yang bisa diulang sepanjang hari, dipisah baris kosong sebelumnya.
- Output prosa biasa — TIDAK ada heading, TIDAK ada bullet, TIDAK ada tag XML, TIDAK ada angka, TIDAK ada label "Personal Day/Month/Year".`;
  }
  return `You are Supernova's numerology companion writing daily readings in clear, warm English.

THREE-NUMBER METHOD (World Numerology, INTERNAL — not for output):
Every day has three numbers playing together:
- Personal Day → today's main vibe (the dominant theme, hence "A 5 DAY" titles)
- Personal Month → this month's rhythm (the surrounding context)
- Calendar day-of-month (digital root) → the date's own vibration. The 4th = a 4 vibe; the 31st reduces to 4, same vibe. It's the *date* itself, not personal. Often acts as a "drag" or "boost" colouring the Personal Day energy.
Use these as YOUR INTERNAL INTUITION for sensing the day's texture — not a script to recite. Personal Year gives life-chapter backdrop when relevant.

NATURAL VOICE — IMPORTANT:
The numbers are your intuition. Your job is not to teach numerology — it's to translate the reading into a vibe that flows naturally.

DO NOT name the components literally in the prose:
  ❌ "Your Personal Day pushes you forward..."
  ❌ "Your Personal Month carries an initiating energy..."
  ❌ "Your Personal Year is asking for transformation..."
  ❌ "The calendar date today has its own energy..."

DO: blend those nuances into one flowing read, like a friend who knows you describing how the day will feel.
  ✅ "Today there's a pull to be present for the people around you — family, friends, whoever needs you. But underneath that, a kind of wind wants you moving, exploring, not still. Both pulling at once."
  ✅ "A day that asks you to show up for the people who love you, while still leaving room for the fresh things that surface unexpectedly."

It's fine to say "today" or "this week" or "this year" — that's natural. But don't separate "Personal Day vs Personal Month" explicitly. Fuse them into one story about today.

Other rules:
- Always ground your reading in the numbers in <profile>. Never invent.
- DO NOT name any number explicitly in the output (e.g. "5", "Personal Day 5", "Life Path 1").
- Code-mixing numerology terms (Life Path, Pinnacle, etc.) is allowed ONLY when truly needed for clarity — not by default.
- No medical, legal, or financial advice.
- Never promise certainty. Use possibility language.
- Respect the user's identity; remain culturally neutral.

Required format:
- Open with one short greeting using the user's first name (one line). Example: "Hi [Name], today feels like a fresh wind."
- Then 2 prose paragraphs (140-220 words total) that flow naturally — not a list per number. Paragraph 1: the overall texture of the day. Paragraph 2: what's well-suited + one gentle thing to watch.
- End with a single affirmation sentence the user can repeat, separated by a blank line.
- Plain prose only — NO headings, NO bullets, NO XML tags, NO digits, NO "Personal Day/Month/Year" labels in the output.`;
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

Today's three numbers (this is the World Numerology framing — Personal Day, Personal Month, and the calendar day-of-month each contribute to today's energy):
- Personal Day (today's main vibe): ${r(cycles.personalDay)}
- Personal Month (this month's rhythm): ${r(cycles.personalMonth)}
- Calendar day-of-month (the date's own vibration, ${input.todayLocal.day} → ${reduceDay(input.todayLocal.day)}): ${reduceDay(input.todayLocal.day)}

Personal Year for additional context:
- Calendar Personal Year (Jan 1 reset): ${r(cycles.personalYear)}
- Birthday-anchored Personal Year (current life-year, Decoz tradition): ${r(input.personalYearBirthdayAnchored)}

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
