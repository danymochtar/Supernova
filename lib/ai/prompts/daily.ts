import { formatNumerology, type NumerologyResult } from '@/lib/numerology';

export interface DailyPromptInput {
  locale: 'id' | 'en';
  fullName: string;
  todayLocal: { year: number; month: number; day: number; weekday: string };
  age: number;
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
}

function r(x: NumerologyResult): string {
  const tags: string[] = [];
  if (x.isMaster) tags.push('master');
  if (x.karmicDebt) tags.push(`karmic-${x.karmicDebt}`);
  return tags.length ? `${formatNumerology(x)} (${tags.join(', ')})` : formatNumerology(x);
}

export function buildSystemPrompt(locale: 'id' | 'en'): string {
  if (locale === 'id') {
    return `Anda adalah pendamping numerologi yang menulis bacaan harian singkat dalam Bahasa Indonesia yang halus dan suportif.

Aturan ketat:
- Selalu berdasarkan angka-angka yang diberikan dalam <profile>. Jangan mengarang angka, jangan mengubah perhitungan.
- Tidak memberikan nasihat medis, hukum, atau finansial. Jika diminta, alihkan dengan halus ke tema umum.
- Tidak menjanjikan kepastian masa depan. Gunakan bahasa kemungkinan ("hari ini cocok untuk…", "energi mendukung…").
- Hormati identitas dan agama pengguna; netral secara budaya.
- Hindari astrologi, tarot, atau sistem lain — fokus pada numerologi Pythagorean.
- Tulis dalam nada hangat, ringkas, dan praktis — seperti teman yang bijak.

Format wajib (gunakan tag XML persis seperti ini, dalam Bahasa Indonesia):
<theme>1-2 kalimat tema utama hari ini berdasarkan Personal Day, dipadukan dengan Personal Month dan Year.</theme>
<energy>2-3 kalimat tentang energi yang mendukung — apa yang baik dilakukan hari ini.</energy>
<watch>1-2 kalimat tentang jebakan atau gesekan yang mungkin muncul, dengan saran lembut.</watch>
<affirmation>Satu kalimat afirmasi yang dapat diulang sepanjang hari.</affirmation>`;
  }
  return `You are a numerology companion writing short, supportive daily readings in clear English.

Strict rules:
- Always ground your reading in the numbers provided in <profile>. Never invent numbers or change the math.
- Do not give medical, legal, or financial advice. Redirect gently to general themes if asked.
- Never promise certainty about the future. Use possibility language ("today is well-suited for…", "the energy supports…").
- Respect the user's identity and beliefs; remain culturally neutral.
- Avoid astrology, tarot, or other systems — stay within Pythagorean numerology.
- Write in a warm, concise, practical voice — like a wise friend.

Required format (use the exact XML tags below, in English):
<theme>1-2 sentences naming the day's main theme, anchored on Personal Day with Personal Month and Year as context.</theme>
<energy>2-3 sentences on the supportive energy — what's well-suited for today.</energy>
<watch>1-2 sentences on potential friction or pitfalls, with a gentle suggestion.</watch>
<affirmation>One sentence affirmation the user can repeat through the day.</affirmation>`;
}

export function buildUserPrompt(input: DailyPromptInput): string {
  const { core, cycles, active, karmicLessons } = input;
  const dateStr = `${input.todayLocal.year}-${String(input.todayLocal.month).padStart(2, '0')}-${String(input.todayLocal.day).padStart(2, '0')}`;
  const km = karmicLessons.length ? karmicLessons.join(', ') : 'none';

  return `<profile>
name: ${input.fullName}
age: ${input.age}
today: ${dateStr} (${input.todayLocal.weekday})

Core numbers:
- Life Path: ${r(core.lifePath)}
- Expression: ${r(core.expression)}
- Soul Urge: ${r(core.soulUrge)}
- Personality: ${r(core.personality)}
- Birthday: ${r(core.birthday)}

Today's cycles:
- Personal Year: ${r(cycles.personalYear)}
- Personal Month: ${r(cycles.personalMonth)}
- Personal Day: ${r(cycles.personalDay)}

Current chapter:
- Pinnacle ${active.pinnacle.slot}: ${r(active.pinnacle.result)}
- Challenge ${active.challenge.slot}: ${r(active.challenge.result)}
- Period Cycle ${active.cycle.slot}: ${r(active.cycle.result)}

Karmic Lessons (energies absent from name): ${km}
</profile>

Write today's reading. Output ONLY the four XML sections, no prefix or commentary.`;
}

export interface ParsedReading {
  theme: string;
  energy: string;
  watch: string;
  affirmation: string;
  raw: string;
}

const RE = {
  theme: /<theme>([\s\S]*?)<\/theme>/i,
  energy: /<energy>([\s\S]*?)<\/energy>/i,
  watch: /<watch>([\s\S]*?)<\/watch>/i,
  affirmation: /<affirmation>([\s\S]*?)<\/affirmation>/i,
};

export function parseReading(raw: string): ParsedReading {
  return {
    theme: (raw.match(RE.theme)?.[1] ?? '').trim(),
    energy: (raw.match(RE.energy)?.[1] ?? '').trim(),
    watch: (raw.match(RE.watch)?.[1] ?? '').trim(),
    affirmation: (raw.match(RE.affirmation)?.[1] ?? '').trim(),
    raw,
  };
}
