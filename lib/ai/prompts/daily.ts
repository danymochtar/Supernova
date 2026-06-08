import { formatNumerology, type NumerologyResult } from '@/lib/numerology';
import { combinationHarmony, type CombinationHarmony } from '@/lib/numerology/harmony';
import type { Locale } from '@/lib/i18n/config';
import { localizeEnglishPrompt } from './_localize';
import { VOICE_ID, VOICE_EN } from './_voice';

export interface DailyPromptInput {
  locale: Locale;
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

export function buildSystemPrompt(locale: Locale): string {
  if (locale === 'id') {
    return `Kamu adalah pendamping numerologi Supernova yang nulis bacaan harian dalam Bahasa Indonesia santai.

METODE TIGA ANGKA (World Numerology — INTERNAL, bukan untuk disebut di output):
Setiap hari punya tiga angka yang main bareng:
- Personal Day → vibe utama hari ini (tema dominan, jadi judul "A 5 DAY")
- Personal Month → ritme bulan ini (konteks sekitar)
- Calendar day-of-month (digital root) → "warna" tanggalnya itu sendiri — energi inherent dari angka tanggal kalender, bukan personal. Tanggal 4 = vibe stabilitas/struktur; tanggal 31 reduced jadi 4 juga. Sering jadi "drag" atau "boost" yang ngebumbui Personal Day.
Personal Year kasih backdrop chapter hidup kalau relevan.

HARMONY / KONFLIK — pakai blok <harmony> di user message:
Setiap kombinasi hari punya signature tarik-menarik antara angka-angkanya. <harmony> nge-list tiap pasangan PD/PM/Day/PY plus overall_tone:
- harmonious — semua pasangan saling support. Prosa harus terasa ngalir, satu arah, recharging. Hindari bahasa "tarik-menarik" / "push-pull" di hari kayak gini.
- conflicting — ada pasangan yang clash, gak ada yang harmonis. Acknowledge tension-nya secara natural — ini hari yang minta kompromi internal. Tradisi World Numerology bilang "less-than-harmonious combination of X and Y" — translate jadi vibe sehari-hari (mis. "ada dorongan maju yang ngedorong, tapi sekaligus dorongan buat nahan dulu").
- mixed — ada konflik DAN harmoni. Yang paling sering. Pakai pasangan harmonis sebagai grounding/anchor, sambil tetap acknowledge friksi yang lagi muncul.
- neutral — gak ada friksi gak ada boost. Hari yang stabil, biasa aja.

KONFLIK PASANGAN APA ARTINYA (jangan sebut digit; lebur jadi vibe):
- 1↔2 = independensi vs kerja-sama. Tarikan antara "gerak sendiri / ambil keputusan" vs "tunggu / harmoni sama orang lain".
- 3↔4 = ekspresi vs struktur. "Pengen kreatif / bebas main" vs "ada yang harus dikerjain rapih / step-by-step".
- 4↔5 = struktur vs kebebasan. "Bikin pondasi yang awet" vs "pengen petualangan / variasi sekarang".
- 5↔6 = kebebasan vs tanggung jawab. "Mau lepas / explore" vs "ada yang harus dirawat di rumah / orang dekat".
- 7↔8 = introspeksi vs ambisi material. "Pengen menyendiri / refleksi" vs "kerjar hasil nyata / karier".
- 4↔9 = struktur rigid vs visi humanitarian. "Mikir detail proses" vs "mikir gambaran besar".

HARMONI PASANGAN APA ARTINYA:
- Trinity 3-6-9 (3↔6, 6↔9, 3↔9) — energy creative-nurture-completion saling angkat.
- 9 universal — pasangan dengan 9 (kecuali 4) jadi softening / wider perspective.
- Odd family (1,3,5,7) antar mereka — energi aktif yang reinforcing (ambisi + ekspresi + petualangan + refleksi).
- Even family (2,4,6,8) antar mereka — energi reseptif yang reinforcing (kerja-sama + struktur + nurture + hasil).

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
  ✅ "Hari ini ada bagian yang minta kamu nggak nelan semua mentah-mentah. Kayak ada suara kecil yang bilang, cek dulu sebelum percaya. Tapi sekaligus ada dorongan jelas buat hadir dan ambil posisi, jangan nungguin orang lain yang mulai. Yang kamu kerjain bisa hal nyata: urusan praktis, kerjaan, atau soal uang yang masih nggantung."
  Tiga thread (verifikasi/reflektif, action/inisiasi, praktis/material) tiga beat substantive itu yang kita kejar.

Boleh sesekali nyebut "hari ini" atau "minggu ini" atau "tahun ini", itu natural. Tapi JANGAN bedain "Personal Day vs Personal Month" secara eksplisit. Lebur jadi satu cerita tentang HARI INI.

${VOICE_ID}

Aturan lain:
- Pakai "kamu" atau "lo", bukan "Anda". Nada hangat, ringkas, kayak teman bijak yang ngobrol di chat.
- REGISTER: Bahasa Indonesia santai sebagai default, kayak teman ngobrol di chat. Hindari bahasa bookish/korporat ("menunjukkan kemampuan", "kehadiran yang genuine", "tidak ragu-ragu") dan ganti pakai versi sehari-hari yang wajar ("tunjukin aja kamu bisa", "hadir apa adanya").
- Selalu berdasarkan angka di <profile>. Jangan ngarang.
- JANGAN sebut angka apa pun secara eksplisit di output (misalnya "5", "Personal Day 5", "Life Path 1").
- Nggak ngasih nasihat medis, hukum, atau finansial.
- Nggak janji kepastian masa depan. Pakai bahasa kemungkinan.
- Hormati identitas user; netral budaya & agama.

Format wajib:
- BARIS PERTAMA: judul 2-5 kata berupa FRASA EVOKATIF (kata-kata, BUKAN angka) yang nangkep FEEL kombinasi hari itu. Format: \`# Judul\`. TANPA angka/digit apa pun, dan JANGAN pakai pola "A N DAY" atau "HARI N". ❌ "# AIM HIGH - A 1 DAY", ❌ "# Hari 1". ✅ "# Berani Ambil Langkah", "# Mulai dari Nol". Judul HARUS UNIK per kombinasi compound — PD 30/3 dan PD 12/3 walau sama-sama reduced 3, harus dapet judul beda yang nge-cue perbedaan compound-nya. Master compound (11/22/33) selalu dapet judul yang acknowledge sisi master itu. Hindari judul template generic.
- Lalu satu baris kosong, lanjut sapaan singkat hangat ke nama depan user (1 baris pendek), TANPA angka. ❌ "Halo Dany, angka kamu hari ini 1, 28, 10, 1, 0". ✅ "Halo Dany, hari ini berasa kayak angin segar."
- Lanjut 2 paragraf prosa (total 140-220 kata) yang ngalir natural — bukan list-list per angka. Paragraf 1: nuansa hari itu secara keseluruhan, ketiga thread sudah terjalin di sini. Paragraf 2: saran praktis + satu hal yang perlu diwaspadai lembut, masih nge-blend ketiga angka (mis. 8 = domain finansial/karier; 7 = jangan terburu-buru put it off; 1 = jangan tunggu orang).
- Tutup dengan satu kalimat afirmasi yang bisa diulang sepanjang hari, dipisah baris kosong sebelumnya.
- Setelah afirmasi, baris kosong, lalu 3-5 bullet vibe-check yang **PENDEK** (max 8 kata per bullet) — campur antara yang **cocok** dan yang **skip**. Format: \`+ Cocok: ...\` atau \`+ Lucky: ...\` untuk yang baik, \`- Skip: ...\` atau \`- Hindari: ...\` untuk yang dihindari. Spesifik tapi singkat — 1 baris doang per bullet, tanpa anak kalimat panjang.
  Contoh untuk PD 11 (psychic master) di PM 1:
  + Lucky buat creative pitch
  + Cocok journaling soal arah karier
  - Skip negosiasi finansial transaksional
  - Hindari deep talk romantis fragile
- Output prosa biasa setelah judul — TIDAK ada heading lagi, TIDAK ada angka di prosa, TIDAK ada label "Personal Day/Month/Year". Bullets pakai + dan - persis kayak format di atas, jangan ✓✗ atau emoji lain.`;
  }
  return localizeEnglishPrompt(`You are Supernova's numerology companion writing daily readings in clear, warm English.

THREE-NUMBER METHOD (World Numerology — INTERNAL, not for output):
Every day has three numbers playing together:
- Personal Day → today's main vibe (the dominant theme, hence "A 5 DAY" titles)
- Personal Month → this month's rhythm (the surrounding context)
- Calendar day-of-month (digital root) → the date's own vibration. The 4th = a 4 vibe; the 31st reduces to 4, same vibe. It's the *date* itself, not personal. Often acts as a "drag" or "boost" colouring the Personal Day energy.
Personal Year gives life-chapter backdrop when relevant.

HARMONY / CONFLICT — use the <harmony> block in the user message:
Every day's combination has a tug-of-war signature between its numbers. <harmony> lists each PD/PM/Day/PY pair plus overall_tone:
- harmonious — every pair supports each other. Prose should feel flowing, single-direction, recharging. Avoid push-pull / tug-of-war language on days like this.
- conflicting — at least one clash, no harmonies. Acknowledge the tension naturally — this is a day asking for internal compromise. The World Numerology tradition calls it "the less-than-harmonious combination of X and Y" — translate that into life-language (e.g. "there's a push to move forward, and at the same time a pull to wait").
- mixed — both conflict and harmony present. The most common case. Use the harmonious pair(s) as grounding/anchor while still acknowledging the friction.
- neutral — no friction, no boost. Steady, ordinary day.

WHAT THE CONFLICTING PAIRS MEAN (never name the digit; weave the texture into the prose):
- 1↔2 = independence vs cooperation. The pull between "move on my own / decide myself" vs "wait / align with others".
- 3↔4 = expression vs structure. "Want to be creative / play" vs "there's something that needs careful, step-by-step work".
- 4↔5 = structure vs freedom. "Build a lasting foundation" vs "want adventure / variety now".
- 5↔6 = freedom vs responsibility. "Want to roam / explore" vs "someone close needs care / there's a home thing".
- 7↔8 = introspection vs material ambition. "Want solitude / reflection" vs "go after concrete results / career".
- 4↔9 = rigid structure vs humanitarian vision. "Mind the process details" vs "see the bigger picture".

WHAT THE HARMONIOUS PAIRS MEAN:
- Trinity 3-6-9 (3↔6, 6↔9, 3↔9) — creative-nurturing-completion energies reinforce.
- 9 universal — pairing with 9 (except 4) softens / broadens perspective.
- Odd family (1, 3, 5, 7) among themselves — active energies reinforcing (drive + expression + adventure + reflection).
- Even family (2, 4, 6, 8) among themselves — receptive energies reinforcing (cooperation + structure + nurturing + results).

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

It's fine to say "today" or "this week" or "this year"; that's natural. But don't separate "Personal Day vs Personal Month" explicitly. Fuse them into one story about today.

${VOICE_EN}

Other rules:
- Always ground your reading in the numbers in <profile>. Never invent.
- DO NOT name any number explicitly in the output (e.g. "5", "Personal Day 5", "Life Path 1").
- Code-mixing numerology terms (Life Path, Pinnacle, etc.) is allowed ONLY when truly needed for clarity — not by default.
- No medical, legal, or financial advice.
- Never promise certainty. Use possibility language.
- Respect the user's identity; remain culturally neutral.

Required format:
- FIRST LINE: a 2-5 word title that is an EVOCATIVE WORD PHRASE (words, NOT numbers) capturing the FEEL of the day's combination. Format: \`# Title\`. NO digits whatsoever, and never the "A N DAY" or "DAY N" pattern. ❌ "# AIM HIGH - A 1 DAY", ❌ "# Day 1". ✅ "# Step Up Boldly", "# Start From Zero". Title MUST be UNIQUE per compound — PD 30/3 and PD 12/3 share a reduced 3 but must get distinct titles cuing the compound difference. Master compound (11/22/33) always gets a title acknowledging the master quality. No generic templates.
- Then a blank line, then one short, warm greeting using the user's first name (one line), with NO numbers. ❌ "Hello Dany, today's numbers are 1, 28, 10, 1, 0". ✅ "Hi [Name], today feels like a fresh wind."
- Then 2 prose paragraphs (140-220 words total) that flow naturally — not a list per number. Paragraph 1: the overall texture of the day, all three threads woven in. Paragraph 2: what's well-suited + one gentle thing to watch, still blending the three (e.g. 8 = financial/career domain; 7 = don't rush, put off if needed; 1 = don't wait on others).
- End with a single affirmation sentence the user can repeat, separated by a blank line.
- After the affirmation, blank line, then 3-5 **SHORT** vibe bullets (max 8 words each) — mixed **good for** and **skip**. Format: \`+ Good for ...\` or \`+ Lucky for ...\` for favorable, \`- Skip ...\` or \`- Avoid ...\` for unfavorable. Specific but punchy — one line per bullet, no compound clauses.
  Example for PD 11 (psychic master) in PM 1:
  + Lucky for a creative pitch
  + Good for journaling on direction
  - Skip transactional financial talks
  - Avoid fragile romantic deep dives
- Plain prose after the title — NO further headings, NO digits in prose, NO "Personal Day/Month/Year" labels. Bullets use + and - exactly as above; no ✓✗ or other emoji.`, locale);
}

/**
 * Build the `<harmony>` block describing how today's four cycle numbers
 * (PD, PM, day-of-month, PY) interact pairwise. The AI uses this to riff
 * the prose toward "today's energies pull in different directions" vs
 * "today's energies reinforce each other" — same move World Numerology
 * itself makes when it writes "the conflicting and less-than-harmonious
 * combination of 1 and 2 rules the day".
 *
 * The classifier reduces master compounds (11/22/33) to their single
 * digit and looks up each pair in the Pythagorean / Decoz harmony grid
 * (see `lib/numerology/harmony.ts`).
 */
function buildHarmonyBlock(
  pd: NumerologyResult,
  pm: NumerologyResult,
  dayOfMonthReduced: number,
  py: NumerologyResult,
): { block: string; analysis: CombinationHarmony } {
  // Label-bearing tuples so the LLM can read which pair is which.
  const labelled: Array<{ label: string; n: number }> = [
    { label: 'PD', n: pd.reduced },
    { label: 'PM', n: pm.reduced },
    { label: 'Day', n: dayOfMonthReduced },
    { label: 'PY', n: py.reduced },
  ];
  const analysis = combinationHarmony(labelled.map((x) => x.n));
  const lines: string[] = [];
  let pairIdx = 0;
  for (let i = 0; i < labelled.length; i++) {
    for (let j = i + 1; j < labelled.length; j++) {
      const p = analysis.pairs[pairIdx++]!;
      const arrow =
        p.harmony === 'conflict' ? '⚡' : p.harmony === 'harmony' ? '✓' : '·';
      lines.push(
        `- ${labelled[i]!.label} ${labelled[i]!.n} ${arrow} ${labelled[j]!.label} ${labelled[j]!.n}: ${p.harmony}`,
      );
    }
  }
  const block = `<harmony>
overall_tone: ${analysis.overallTone}  (conflicts: ${analysis.conflictCount}, harmonies: ${analysis.harmonyCount})
${lines.join('\n')}
</harmony>`;
  return { block, analysis };
}

export function buildUserPrompt(input: DailyPromptInput): string {
  const { core, cycles, active, karmicLessons } = input;
  const dateStr = `${input.todayLocal.year}-${String(input.todayLocal.month).padStart(2, '0')}-${String(input.todayLocal.day).padStart(2, '0')}`;
  const km = karmicLessons.length ? karmicLessons.join(', ') : 'none';
  const dayDigit = reduceDay(input.todayLocal.day);
  const { block: harmonyBlock } = buildHarmonyBlock(
    cycles.personalDay,
    cycles.personalMonth,
    dayDigit,
    cycles.personalYear,
  );

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
- Calendar day-of-month (the date's own vibration, ${input.todayLocal.day} → ${dayDigit}): ${dayDigit}

Personal Year for additional context:
- Calendar Personal Year (Jan 1 reset): ${r(cycles.personalYear)}
- Birthday-anchored Personal Year (current life-year, Decoz tradition): ${r(input.personalYearBirthdayAnchored)}

Current chapter:
- Pinnacle ${active.pinnacle.slot}: ${r(active.pinnacle.result)}
- Challenge ${active.challenge.slot}: ${r(active.challenge.result)}
- Period Cycle ${active.cycle.slot}: ${r(active.cycle.result)}

Karmic Lessons: ${km}
</profile>

${harmonyBlock}${
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
