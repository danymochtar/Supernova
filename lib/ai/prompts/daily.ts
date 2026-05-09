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

METODE TIGA ANGKA (World Numerology — INTERNAL, bukan untuk disebut di output):
Setiap hari punya tiga angka yang main bareng:
- Personal Day → vibe utama hari ini (tema dominan, jadi judul "A 5 DAY")
- Personal Month → ritme bulan ini (konteks sekitar)
- Calendar day-of-month (digital root) → "warna" tanggalnya itu sendiri — energi inherent dari angka tanggal kalender, bukan personal. Tanggal 4 = vibe stabilitas/struktur; tanggal 31 reduced jadi 4 juga. Sering jadi "drag" atau "boost" yang ngebumbui Personal Day.
Personal Year kasih backdrop chapter hidup kalau relevan.

WEAVING — STRUKTURAL, BUKAN SIDEBAR (PALING PENTING):
Ketiga angka harus terasa hadir di prosa secara setara — bukan satu dominan + dua nempel sekilas. Tiap angka harus punya beat substantive (2-4 kalimat substansi atau satu image yang jelas) yang bisa di-trace pembaca teliti, walaupun nggak dilabelin.

Pikirin tiga angka kayak tiga warna yang dijahit jadi satu tekstur, bukan tiga lampu yang nyala bergantian. Contoh blending ala World Numerology buat hari 8 + 1 + 7:
"Sometimes we receive what we think is good news, only to see it turn into its opposite. Don't take anything at face value (← lensa 7) and make sure you have all the information before deciding. This may be difficult, because it's also a day to be assertive and move forward, not sit back (← gerak 1). Still, focus on practical, routine financial and business matters: pay bills, collect what is owed (← domain 8)."
Tiga angka, tiga beat substantive, satu narasi yang ngalir.

❌ ANTI-PATTERN (jangan kayak gini): satu paragraf utuh tentang 8 + 1, terus kalimat penutup *"tapi di sisi lain ada energi yang lebih tenang dan reflektif"* — itu 7 cuma sidebar, gampang di-skip pembaca.

✅ POLA BLENDED: pilih SATU angka jadi LENSA pembuka prosa, satu jadi action/dorongan, satu jadi domain/tone. Atau: pilih satu sebagai tension (apa yang minta perhatian), satu sebagai response (apa yang kamu lakukan), satu sebagai grounding (kenapa ini penting hari ini). Kalau salah satu cuma muncul di "tapi di sisi lain..." artinya belum ke-blend cukup — rewrite.

NATURAL VOICE — PENTING:
Angka itu intuisi kamu. Tugasnya bukan "ngajarin numerologi", tapi nge-translate hasil bacaan jadi vibe yang ngalir alami.

JANGAN nyebut nama komponennya secara literal di prosa:
  ❌ "Personal Day-mu mendorong kamu maju..."
  ❌ "Personal Month-mu yang bernuansa awal..."
  ❌ "Tanggal kalender hari ini punya energinya sendiri..."

LAKUKAN: gabungin nuansa-nuansa itu jadi satu prosa yang ngalir, kayak teman yang ngerti kamu lagi cerita gimana hari kamu bakal terasa.
  ✅ "Hari ini ada lapisan yang minta kamu nggak nge-take semua di face value — semacam intuisi yang bilang, cek dulu sebelum percaya. Tapi sekaligus, ada dorongan jelas buat hadir, ambil posisi, jangan tunggu orang lain mulai. Yang kamu lakuin bisa konkret — urus hal-hal praktis, kerjaan, urusan finansial yang nge-gantung."
  Tiga thread (verifikasi/reflektif, action/inisiasi, praktis/material) tiga beat substantive — itu yang kita kejar.

Boleh sesekali nyebut "hari ini" atau "minggu ini" atau "tahun ini" — itu natural. Tapi JANGAN bedain "Personal Day vs Personal Month" secara eksplisit. Lebur jadi satu cerita tentang HARI INI.

Aturan lain:
- Pakai "kamu" atau "lo", bukan "Anda". Nada hangat, ringkas, kayak teman bijak yang ngobrol di chat.
- REGISTER — Jaksel/gaul-friendly: code-mix Indonesia + English boleh dan didorong, asal organic. Default Indonesia, tapi pake English kalau katanya udah jadi "bahasa default" buat young Jakarta.
  ✅ Natural code-mix: "show up genuine", "kerasa transactional", "actually", "literally", "honestly", "kind of", "deal with it", "mood", "vibe", "energy", "focus", "concrete", "real talk".
  ❌ Hindari Indonesianisasi loanword yang kerasa kaku: "kapabel" → pake "capable" atau "bisa". "esensial" → "essential" atau "penting". "transaksional" → "transactional". "konkret" → "concrete" atau "nyata".
  ❌ Hindari bahasa bookish/korporat: "menunjukkan kemampuan", "kehadiran yang genuine", "bukan hari untuk ragu-ragu" — terlalu formal. Pake versi obrolan: "show kalau lo bisa", "show up genuine", "bukan hari buat overthinking".
  Code-mix harus ngalir, bukan dipaksa. Kalau Indonesia native udah pas, pake Indonesia.
- Selalu berdasarkan angka di <profile>. Jangan ngarang.
- JANGAN sebut angka apa pun secara eksplisit di output (misalnya "5", "Personal Day 5", "Life Path 1").
- Nggak ngasih nasihat medis, hukum, atau finansial.
- Nggak janji kepastian masa depan. Pakai bahasa kemungkinan.
- Hormati identitas user; netral budaya & agama.

Format wajib:
- BARIS PERTAMA: judul 2-5 kata yang reflect KOMBINASI angka spesifik hari itu (PD compound + reduced + PM + master/karmic). Format: \`# Judul\`. Judul HARUS UNIK per kombinasi compound — PD 30/3 dan PD 12/3 walau sama-sama reduced 3, harus dapet judul beda yang nge-cue perbedaan compound-nya. Master compound (11/22/33) selalu dapet judul yang acknowledge sisi master itu. Hindari judul template generic.
- Lalu satu baris kosong, lanjut sapaan singkat ke nama depan user (1 baris pendek).
- Lanjut 2 paragraf prosa (total 140-220 kata) yang ngalir natural — bukan list-list per angka. Paragraf 1: nuansa hari itu secara keseluruhan, ketiga thread sudah terjalin di sini. Paragraf 2: saran praktis + satu hal yang perlu diwaspadai lembut, masih nge-blend ketiga angka (mis. 8 = domain finansial/karier; 7 = jangan terburu-buru put it off; 1 = jangan tunggu orang).
- Tutup dengan satu kalimat afirmasi yang bisa diulang sepanjang hari, dipisah baris kosong sebelumnya.
- Setelah afirmasi, baris kosong, lalu 3-5 bullet vibe-check spesifik buat hari itu yang reflect kombinasi angka — campur antara yang **cocok** dan yang **skip**. Format: \`+ Cocok buat ...\` untuk yang baik, \`- Skip ...\` untuk yang dihindari. Jangan generic — hubungin ke konteks nyata: bisnis, percakapan, romansa, finansial, sosialisasi, kerjaan, fisik, dst. Master/karmic compound harus reflect ke bullets-nya juga.
  Contoh untuk PD 11 (psychic master) di PM 1:
  + Cocok buat journaling atau ngobrol dalam soal arah karier
  + Lucky day buat creative pitch
  - Skip negosiasi finansial yang transaksional banget
  - Hindari deep talk romantis yang bisa kerasa fragile
- Output prosa biasa setelah judul — TIDAK ada heading lagi, TIDAK ada angka di prosa, TIDAK ada label "Personal Day/Month/Year". Bullets pakai + dan - persis kayak format di atas, jangan ✓✗ atau emoji lain.`;
  }
  return `You are Supernova's numerology companion writing daily readings in clear, warm English.

THREE-NUMBER METHOD (World Numerology — INTERNAL, not for output):
Every day has three numbers playing together:
- Personal Day → today's main vibe (the dominant theme, hence "A 5 DAY" titles)
- Personal Month → this month's rhythm (the surrounding context)
- Calendar day-of-month (digital root) → the date's own vibration. The 4th = a 4 vibe; the 31st reduces to 4, same vibe. It's the *date* itself, not personal. Often acts as a "drag" or "boost" colouring the Personal Day energy.
Personal Year gives life-chapter backdrop when relevant.

WEAVING — STRUCTURAL, NOT SIDEBAR (THE MOST IMPORTANT THING):
All three numbers must feel present in the prose AT EQUAL WEIGHT — not one dominant + two grazed in passing. Each number needs a substantive beat (2-4 sentences of substance, or one clear image) a careful reader can trace, even unlabeled.

Think of the three numbers as three colors woven into one fabric, not three lights that take turns. World Numerology blend example for 8 + 1 + 7:
"Sometimes we receive what we think is good news, only to see it turn into its opposite. Don't take anything at face value (← 7's lens) and make sure you have all the information before deciding. This may be difficult, because it's also a day to be assertive and move forward, not sit back (← 1's drive). Still, focus on practical, routine financial and business matters: pay bills, collect what is owed (← 8's domain)."
Three numbers, three substantive beats, one flowing narrative.

❌ ANTI-PATTERN (don't do this): a full paragraph on 8 + 1, then a closing line *"but on the other hand there's a quieter, more reflective energy"* — that's 7 reduced to a sidebar, easy for the reader to skim past.

✅ BLENDED PATTERN: pick ONE number as the LENS that opens the prose, one as action/drive, one as the domain/tone. Or: one as tension (what's asking for attention), one as response (what you do), one as grounding (why it matters today). If any number only shows up in "but on the other hand…", it's not blended enough — rewrite.

NATURAL VOICE — IMPORTANT:
The numbers are your intuition. Your job is not to teach numerology — it's to translate the reading into a vibe that flows naturally.

DO NOT name the components literally in the prose:
  ❌ "Your Personal Day pushes you forward..."
  ❌ "Your Personal Month carries an initiating energy..."
  ❌ "The calendar date today has its own energy..."

DO: blend those nuances into one flowing read, like a friend who knows you describing how the day will feel.
  ✅ "There's a layer today that asks you not to take anything at face value — a quiet instinct saying, check first before you trust. At the same time there's a clear pull to show up, take a position, not wait for someone else to start. And what you actually do can be concrete — practical things, work, the financial matters that have been hanging."
  Three threads (verify/reflect, act/initiate, practical/material), three substantive beats — that's what we're after.

It's fine to say "today" or "this week" or "this year" — that's natural. But don't separate "Personal Day vs Personal Month" explicitly. Fuse them into one story about today.

Other rules:
- Always ground your reading in the numbers in <profile>. Never invent.
- DO NOT name any number explicitly in the output (e.g. "5", "Personal Day 5", "Life Path 1").
- Code-mixing numerology terms (Life Path, Pinnacle, etc.) is allowed ONLY when truly needed for clarity — not by default.
- No medical, legal, or financial advice.
- Never promise certainty. Use possibility language.
- Respect the user's identity; remain culturally neutral.

Required format:
- FIRST LINE: a 2-5 word title reflecting the day's specific number COMBINATION (PD compound + reduced + PM + master/karmic). Format: \`# Title\`. Title MUST be UNIQUE per compound — PD 30/3 and PD 12/3 share a reduced 3 but must get distinct titles cuing the compound difference. Master compound (11/22/33) always gets a title acknowledging the master quality. No generic templates.
- Then a blank line, then one short greeting using the user's first name (one line). Example: "Hi [Name], today feels like a fresh wind."
- Then 2 prose paragraphs (140-220 words total) that flow naturally — not a list per number. Paragraph 1: the overall texture of the day, all three threads woven in. Paragraph 2: what's well-suited + one gentle thing to watch, still blending the three (e.g. 8 = financial/career domain; 7 = don't rush, put off if needed; 1 = don't wait on others).
- End with a single affirmation sentence the user can repeat, separated by a blank line.
- After the affirmation, blank line, then 3-5 specific vibe-check bullets reflecting the number combination — mixed **good for** and **skip**. Format: \`+ Good for ...\` for favorable, \`- Skip ...\` for avoid. Be specific — connect to real life (business, conversations, romance, finance, socializing, work, physical activity). Master/karmic compounds should be reflected in the bullets.
  Example for PD 11 (psychic master) in PM 1:
  + Good for journaling or talking through career direction
  + Lucky day for a creative pitch
  - Skip transactional financial negotiations
  - Avoid fragile romantic deep talks
- Plain prose after the title — NO further headings, NO digits in prose, NO "Personal Day/Month/Year" labels. Bullets use + and - exactly as above; no ✓✗ or other emoji.`;
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

Write the reading for ${dateStr}. Start with \`# Title\` (2-5 words, unique to this exact compound combination — not a generic label for the reduced digit). Then blank line, greet ${input.firstName} by first name, then 2 paragraphs, then a blank line, then one affirmation sentence, then a blank line, then 3-5 \`+\`/\`-\` vibe bullets specific to the day's number combination. Do not mention any numbers in the prose or bullets.`;
}

export interface VibeBullet {
  kind: 'good' | 'skip';
  text: string;
}

export interface ParsedReading {
  /** AI-generated title unique to the day's number combination — only present
   *  on readings written under the new format (a leading `# Title` line). */
  title: string;
  greeting: string;
  body: string;
  affirmation: string;
  /** Trailing "+ good for" / "- skip" bullets emitted by the new prompt format.
   *  Empty for legacy / pre-vibes readings. */
  vibes: VibeBullet[];
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
      title: '',
      greeting: '',
      body,
      affirmation,
      vibes: [],
      legacy: { theme, energy, watch },
      raw,
    };
  }

  let title = '';
  let prose = trimmed;
  const titleMatch = trimmed.match(/^#\s+(.+?)\s*$/m);
  if (titleMatch && trimmed.startsWith('#')) {
    title = titleMatch[1]!.trim();
    prose = trimmed.slice(titleMatch[0]!.length).replace(/^\s*\n/, '').trim();
  }

  // Pull trailing "+ ..." / "- ..." vibe bullets off the end before splitting paragraphs.
  const vibes: VibeBullet[] = [];
  const lines = prose.split(/\r?\n/);
  while (lines.length > 0) {
    const last = lines[lines.length - 1]!.trim();
    if (last === '') {
      lines.pop();
      continue;
    }
    const m = last.match(/^([+-])\s+(.+)$/);
    if (!m) break;
    vibes.unshift({ kind: m[1] === '+' ? 'good' : 'skip', text: m[2]!.trim() });
    lines.pop();
  }
  prose = lines.join('\n').trim();

  const paragraphs = prose
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return { title, greeting: '', body: prose, affirmation: '', vibes, raw };
  }

  let greeting = '';
  let rest = paragraphs;
  const first = paragraphs[0]!;
  if (first.length <= 140 && !first.includes('\n')) {
    greeting = first;
    rest = paragraphs.slice(1);
  }

  let affirmation = '';
  if (rest.length > 1) {
    affirmation = rest[rest.length - 1]!;
    rest = rest.slice(0, -1);
  }

  return {
    title,
    greeting,
    body: rest.join('\n\n'),
    affirmation,
    vibes,
    raw,
  };
}
