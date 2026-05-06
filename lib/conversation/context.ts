import type { Locale } from '@/lib/i18n/config';
import { listPeople } from '@/lib/db/repositories/person';
import { getReadingForLocalDay } from '@/lib/db/repositories/reading';
import { getRecentFeedback } from '@/lib/db/repositories/feedback';
import { aggregate, promptSummary } from '@/lib/patterns/aggregate';
import {
  ageAt,
  buildCoreProfile,
  formatNumerology,
  minorNumbers,
  personalCycles,
} from '@/lib/numerology';
import type { BirthDate } from '@/lib/numerology/types';
import type { ProfileView } from '@/lib/db/repositories/profile';

/**
 * Heuristic intent detection. Cheap keyword match — keeps prompts tight by
 * only loading the side context the user's question is actually asking about.
 *
 * If the keyword landscape grows we can swap this for a small classifier
 * call, but for now keywords cover the obvious cases without spending tokens.
 */
const KEYWORDS = {
  people: [
    'pasangan', 'partner', 'pacar', 'suami', 'istri', 'kekasih',
    'keluarga', 'family', 'mama', 'papa', 'ayah', 'ibu', 'anak', 'kakak', 'adik',
    'teman', 'sahabat', 'friend', 'rekan', 'colleague', 'bos', 'atasan',
    'kompatibilitas', 'compatibility', 'cocok', 'jodoh',
  ],
  reading: [
    'bacaan', 'reading', 'hari ini', 'today',
    'tema hari', 'fokus hari',
  ],
  patterns: [
    'pola', 'pattern', 'biasanya', 'usually', 'sering', 'tend',
    'tracking', 'feedback', 'mood',
  ],
};

function matches(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

function r(x: { compound: number; reduced: number; isMaster: boolean; karmicDebt?: number }): string {
  return formatNumerology(x as Parameters<typeof formatNumerology>[0]);
}

export interface SmartContext {
  /** Always present — base profile facts the assistant should know. */
  base: string;
  /** Only present when the question asks about people the user has added. */
  people?: string;
  /** Only present when the question asks about today's reading or daily themes. */
  reading?: string;
  /** Only present when the question asks about patterns / mood / habits. */
  patterns?: string;
  /** What was loaded — surfaced in dev logs for debugging. */
  loaded: string[];
}

interface LoadOpts {
  userId: string;
  locale: Locale;
  profile: ProfileView;
  question: string;
  /** Local context for "today". */
  ctx: { year: number; month: number; day: number };
  dob: BirthDate;
}

export async function loadSmartContext(opts: LoadOpts): Promise<SmartContext> {
  const { userId, locale, profile, question, ctx, dob } = opts;
  const loaded: string[] = ['base'];

  // ---- Base (always) -----------------------------------------------------
  // Includes DOB and today's personal cycles directly. These are cheap
  // (pure functions, no DB) and high-value — most chat questions reference
  // "this year", "today", "my Personal Day/Month/Year", and the model
  // shouldn't have to ask the user for data we already know.
  const core = buildCoreProfile(profile.fullName, dob);
  const cycles = personalCycles(dob, ctx);
  const age = ageAt(dob, ctx);
  const dobStr = `${dob.year}-${String(dob.month).padStart(2, '0')}-${String(dob.day).padStart(2, '0')}`;
  const todayDate = `${ctx.year}-${String(ctx.month).padStart(2, '0')}-${String(ctx.day).padStart(2, '0')}`;

  // Pre-compute the user's next birthday so the model never has to derive
  // "when is their birthday" — a known hallucination path where the model
  // confuses the Birthday core number (day-of-month reduced) with an
  // actual calendar date.
  const todayMs = Date.UTC(ctx.year, ctx.month - 1, ctx.day);
  let nbYear = ctx.year;
  let nbMs = Date.UTC(nbYear, dob.month - 1, dob.day);
  if (nbMs < todayMs) {
    nbYear = ctx.year + 1;
    nbMs = Date.UTC(nbYear, dob.month - 1, dob.day);
  }
  const nbStr = `${nbYear}-${String(dob.month).padStart(2, '0')}-${String(dob.day).padStart(2, '0')}`;
  const daysUntilBirthday = Math.round((nbMs - todayMs) / 86_400_000);
  const turningAge = nbYear - dob.year;

  const base = `<profile>
name: ${profile.fullName}
date of birth: ${dobStr}
age: ${age}
next birthday: ${nbStr} (in ${daysUntilBirthday} day${daysUntilBirthday === 1 ? '' : 's'}, turning ${turningAge})
today (${profile.timezone}): ${todayDate}
core numbers: Life Path=${r(core.lifePath)}, Expression=${r(core.expression)}, Soul Urge=${r(core.soulUrge)}, Personality=${r(core.personality)}, Birthday=${r(core.birthday)}
karmic lessons: ${core.karmicLessons.length ? core.karmicLessons.join(', ') : 'none'}
today's cycles: Personal Year=${r(cycles.personalYear)}, Personal Month=${r(cycles.personalMonth)}, Personal Day=${r(cycles.personalDay)}
</profile>`;

  const result: SmartContext = { base, loaded };

  // People are now always loaded — the user often references them by
  // name without using a relationship keyword ("mood [name] gimana?"),
  // and we want the model to recognize and answer with their data
  // without bouncing back to ask. The list is small (most users have
  // < 20 people) so the token cost is bounded.
  const wantReading = matches(question, KEYWORDS.reading);
  const wantPatterns = matches(question, KEYWORDS.patterns);

  const since = new Date(Date.UTC(ctx.year, ctx.month - 1, ctx.day));
  since.setUTCDate(since.getUTCDate() - 30);

  const [people, reading, feedback] = await Promise.all([
    listPeople(userId),
    wantReading ? getReadingForLocalDay(userId, ctx.year, ctx.month, ctx.day) : Promise.resolve(null),
    wantPatterns
      ? getRecentFeedback(userId, since)
      : Promise.resolve([] as Awaited<ReturnType<typeof getRecentFeedback>>),
  ]);

  if (people.length > 0) {
    // For each known person we precompute their core numbers + today's
    // Personal Day/Month/Year so the model can answer "mood dia gimana
    // hari ini?" without asking for data we already have. Nickname is
    // included so the model knows what to call them.
    result.people = people
      .map((p) => {
        const c = buildCoreProfile(p.fullName, p.dob);
        const cyc = personalCycles(p.dob, ctx);
        const m = minorNumbers(p.nickname);
        const dobLine = `${p.dob.year}-${String(p.dob.month).padStart(2, '0')}-${String(p.dob.day).padStart(2, '0')}`;
        const nick = p.nickname ? `, dipanggil "${p.nickname}"` : '';
        const minorLine = m
          ? `\n  minor (from "${m.source}"): Expr=${r(m.minorExpression)}, SU=${r(m.minorSoulUrge)}, Pers=${r(m.minorPersonality)}`
          : '';
        return `- ${p.fullName}${nick} (${p.relationship.toLowerCase()}, born ${dobLine})
  core: LP=${r(c.lifePath)}, Expr=${r(c.expression)}, SU=${r(c.soulUrge)}, Pers=${r(c.personality)}, BD=${r(c.birthday)}
  today's cycles: PD=${r(cyc.personalDay)}, PM=${r(cyc.personalMonth)}, PY=${r(cyc.personalYear)}${minorLine}`;
      })
      .join('\n');
    loaded.push('people');
  }

  if (wantReading && reading) {
    result.reading = `Today's daily reading body:\n${reading.body}`;
    loaded.push('reading');
  }

  if (wantPatterns) {
    const summary = aggregate(
      feedback.map((f) => ({ date: f.date, rating: f.rating, tags: f.tags })),
      dob,
      30,
      locale,
    );
    const text = promptSummary(summary);
    if (text) {
      result.patterns = text;
      loaded.push('patterns');
    }
  }

  return result;
}

/**
 * Tiny "ground-truth date facts" string injected right next to the user's
 * current question. The system prompt and full <profile> already carry
 * these facts, but the model sometimes anchors on its OWN earlier
 * assistant turns (where it may have fabricated a wrong DOB) and ignores
 * the system context. Putting the date facts at the very end of the
 * prompt — adjacent to the question being answered — gives them recency
 * weight that overrides the bad narrative.
 */
export function dateFactAnchor(
  dob: BirthDate,
  ctx: { year: number; month: number; day: number },
  locale: Locale,
): string {
  const todayMs = Date.UTC(ctx.year, ctx.month - 1, ctx.day);
  let nbYear = ctx.year;
  let nbMs = Date.UTC(nbYear, dob.month - 1, dob.day);
  if (nbMs < todayMs) {
    nbYear = ctx.year + 1;
    nbMs = Date.UTC(nbYear, dob.month - 1, dob.day);
  }
  const dobStr = `${dob.year}-${String(dob.month).padStart(2, '0')}-${String(dob.day).padStart(2, '0')}`;
  const nbStr = `${nbYear}-${String(dob.month).padStart(2, '0')}-${String(dob.day).padStart(2, '0')}`;
  const days = Math.round((nbMs - todayMs) / 86_400_000);
  const turning = nbYear - dob.year;
  // Compute current age the same way ageAt does: we already imported it,
  // but to keep this helper free of personal.ts' PersonalContext shape
  // we recompute trivially here.
  const beforeBirthday =
    ctx.month < dob.month || (ctx.month === dob.month && ctx.day < dob.day);
  const age = ctx.year - dob.year - (beforeBirthday ? 1 : 0);

  if (locale === 'id') {
    return `[FAKTA dari <profile> — pakai persis ini, jangan diinferensi: tanggal lahir ${dobStr}, umur ${age}, ulang tahun berikutnya ${nbStr} (${days} hari lagi, jadi ${turning}).]`;
  }
  return `[FACTS from <profile> — use exactly, do not infer: date of birth ${dobStr}, age ${age}, next birthday ${nbStr} (in ${days} day${days === 1 ? '' : 's'}, turning ${turning}).]`;
}

/**
 * Internal note telling the model how much wall-clock time has passed
 * since the user's last message. Used to keep the assistant from
 * resurfacing stale topics ("done with the gym?") hours after the user
 * actually was at the gym. Strictly internal — the prompt forbids ever
 * mentioning timestamps in replies.
 *
 * Buckets are intentionally coarse — the model just needs the vibe of
 * "still in the moment" vs "fresh thread", not minute-by-minute math.
 */
export function chatPaceNote(
  lastTurnAt: Date | null,
  now: Date,
  locale: Locale,
): string | null {
  if (!lastTurnAt) return null;
  const minutes = Math.max(0, Math.round((now.getTime() - lastTurnAt.getTime()) / 60_000));

  type Bucket = 'active' | 'lull' | 'gap' | 'stale' | 'fresh_day';
  let bucket: Bucket;
  if (minutes < 30) bucket = 'active';
  else if (minutes < 180) bucket = 'lull';
  else if (minutes < 720) bucket = 'gap';
  else if (minutes < 1440) bucket = 'stale';
  else bucket = 'fresh_day';

  if (locale === 'id') {
    const lines: Record<Bucket, string> = {
      active:
        'Obrolan masih aktif (jeda <30 menit). Boleh nyambung topik yang lagi dibahas.',
      lull:
        'Ada jeda beberapa puluh menit – beberapa jam sejak pesan terakhir. Boleh nyambungin kalau pas, tapi jangan force topik lama.',
      gap:
        'Udah lewat beberapa jam sejak pesan terakhir. Anggep topik lama udah lewat – JANGAN proaktif nanyain follow-up "udah selesai gym?" / "jadi mutusin X?" dsb. Tunggu user yang bawa.',
      stale:
        'Udah lebih dari setengah hari sejak pesan terakhir. Treat ini sebagai thread baru – langsung respon ke pesan user sekarang aja, jangan nyangkut ke topik kemarin kecuali user yang nyebut.',
      fresh_day:
        'Udah ganti hari (atau lebih) sejak pesan terakhir. Treat ini sebagai pembukaan thread baru – jangan resurface apapun dari sesi sebelumnya kecuali user yang bawa.',
    };
    return `<chat_pace>\n${lines[bucket]} Pakai info ini diam-diam buat ngatur respon — JANGAN sebut jam, hari, atau jeda waktu di balasanmu.\n</chat_pace>`;
  }
  const lines: Record<Bucket, string> = {
    active: 'Conversation is active (<30 min gap). Continue the current topic if the user is still in it.',
    lull: 'Tens of minutes to a few hours have passed since the last message. Continue softly, but don\'t force prior topics.',
    gap: 'Several hours have passed. Treat earlier topics as past — DO NOT proactively follow up ("are you done at the gym?", "did you decide on X?"). Let the user steer.',
    stale: 'More than half a day has passed. Treat this as a new thread — respond to the current message only, don\'t loop back to yesterday\'s topics unless the user does.',
    fresh_day: 'The day has rolled over (or longer) since the last message. Treat this as a fresh thread opening — don\'t resurface anything from prior sessions unless the user brings it up.',
  };
  return `<chat_pace>\n${lines[bucket]} Use this internally to shape the reply — NEVER mention times, days, or elapsed gaps in your output.\n</chat_pace>`;
}

/** Compose the smart context into a single user-turn string for the model. */
export function composeContextBlock(c: SmartContext, personalNotes?: string | null): string {
  const parts: string[] = [c.base];
  if (personalNotes && personalNotes.trim()) {
    parts.push(`<personal_notes>\n${personalNotes.trim()}\n</personal_notes>`);
  }
  if (c.people) {
    parts.push(`<people>\n${c.people}\n</people>`);
  }
  if (c.reading) {
    parts.push(`<todays_reading>\n${c.reading}\n</todays_reading>`);
  }
  if (c.patterns) {
    parts.push(`<recent_patterns>\n${c.patterns}\n</recent_patterns>`);
  }
  return parts.join('\n\n');
}
