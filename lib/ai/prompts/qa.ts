import { formatNumerology, type NumerologyResult } from '@/lib/numerology';
import type { Locale } from '@/lib/i18n/config';
import { localizeEnglishPrompt } from './_localize';

export interface QaPromptContext {
  locale: Locale;
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
  recentPatterns?: string | null;
}

function r(x: NumerologyResult): string {
  const tags: string[] = [];
  if (x.isMaster) tags.push('master');
  if (x.karmicDebt) tags.push(`karmic-${x.karmicDebt}`);
  return tags.length ? `${formatNumerology(x)} (${tags.join(', ')})` : formatNumerology(x);
}

export function buildQaSystemPrompt(locale: Locale): string {
  if (locale === 'id') {
    return `Kamu adalah pendamping numerologi Supernova. Tugas kamu jawab pertanyaan user tentang numerologi mereka dalam Bahasa Indonesia santai.

Aturan:
- Sapa user dengan "kamu", BUKAN "Anda". Nada hangat, ringkas, kayak teman yang nyimak.
- Boleh code-mix: istilah numerologi seperti "Life Path", "Expression", "Soul Urge", "Personality", "Birthday", "Personal Day/Month/Year", "Pinnacle", "Challenge", "Karmic Lesson", "master number", "karmic debt" TETAP dalam Bahasa Inggris supaya maknanya tidak hilang. Sisanya Indonesia.
- Selalu berdasarkan angka di <profile>. Jangan ngarang angka, jangan ubah perhitungan.
- Nggak ngasih nasihat medis, hukum, atau finansial. Kalau diminta, alihin ke tema umum yang relevan ke numerologi.
- Nggak janji kepastian masa depan. Pakai bahasa kemungkinan ("energinya mendukung…", "cocok buat…").
- Hormati identitas dan kepercayaan user; netral secara budaya dan agama.
- Hindari astrologi, tarot, atau sistem lain — fokus numerologi Pythagorean.
- Kalau pertanyaannya nggak nyambung sama numerologi, jawab singkat aja dan arahin balik ke tema numerologi.
- Format respons: Markdown ringan — paragraf biasa, **tebal** buat nama angka, nggak perlu heading.`;
  }
  return localizeEnglishPrompt(`You are Supernova's numerology companion. Your task is to answer the user's questions about their numerology in clear, supportive English.

Strict rules:
- Always ground your answers in the numbers in <profile>. Never invent numbers or change the math.
- Do not give medical, legal, or financial advice. Redirect gently to numerology-relevant themes.
- Never promise certainty about the future. Use possibility language ("the energy supports…", "well-suited for…").
- Respect the user's identity and beliefs; remain culturally neutral.
- Avoid astrology, tarot, or other systems — stay within Pythagorean numerology.
- If the question is unrelated to numerology, answer briefly and steer back to numerology themes.
- Write in a warm, concise voice (2-4 paragraphs), practical.
- Format responses as light Markdown: plain paragraphs, **bold** for number names, no headings needed.`, locale);
}

export function buildQaProfileBlock(ctx: QaPromptContext): string {
  const { core, cycles, active, karmicLessons } = ctx;
  const dateStr = `${ctx.todayLocal.year}-${String(ctx.todayLocal.month).padStart(2, '0')}-${String(ctx.todayLocal.day).padStart(2, '0')}`;
  const km = karmicLessons.length ? karmicLessons.join(', ') : 'none';

  return `<profile>
name: ${ctx.fullName}
age: ${ctx.age}
today: ${dateStr} (${ctx.todayLocal.weekday})

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
</profile>${
    ctx.recentPatterns
      ? `

<recent_patterns>
${ctx.recentPatterns}
</recent_patterns>`
      : ''
  }`;
}

export interface QaTurn {
  question: string;
  answer: string;
}

/**
 * Build the messages array for a Q&A turn.
 * - System prompt (cached)
 * - User: profile block (cached, since profile doesn't change between turns within a session)
 * - Assistant: "Profile noted. Ready for your question."
 * - Last N prior turns (alternating user/assistant)
 * - User: new question (volatile, after cache breakpoint)
 */
export function buildQaMessages(args: {
  ctx: QaPromptContext;
  history: QaTurn[];
  question: string;
}) {
  const messages: Array<{
    role: 'user' | 'assistant';
    content: Array<{ type: 'text'; text: string; cache_control?: { type: 'ephemeral' } }>;
  }> = [];

  // Profile context as the first user message — cache it so re-runs within
  // the 5-minute window don't re-process this block.
  messages.push({
    role: 'user',
    content: [
      {
        type: 'text',
        text: buildQaProfileBlock(args.ctx),
        cache_control: { type: 'ephemeral' },
      },
    ],
  });
  messages.push({
    role: 'assistant',
    content: [
      {
        type: 'text',
        text: args.ctx.locale === 'id' ? 'Profil dicatat. Saya siap menjawab pertanyaan Anda.' : 'Profile noted. Ready for your question.',
      },
    ],
  });

  // Last N prior turns — volatile but bounded.
  for (const turn of args.history) {
    messages.push({ role: 'user', content: [{ type: 'text', text: turn.question }] });
    messages.push({ role: 'assistant', content: [{ type: 'text', text: turn.answer }] });
  }

  // New question — volatile, no cache marker.
  messages.push({ role: 'user', content: [{ type: 'text', text: args.question }] });

  return messages;
}
