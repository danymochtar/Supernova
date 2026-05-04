import type { Locale } from '@/lib/i18n/config';
import type { ConversationSummary } from '@prisma/client';
import { listPeople } from '@/lib/db/repositories/person';
import { getReadingForLocalDay } from '@/lib/db/repositories/reading';
import { getRecentFeedback } from '@/lib/db/repositories/feedback';
import { listSummaries } from '@/lib/db/repositories/conversationSummary';
import { aggregate, promptSummary } from '@/lib/patterns/aggregate';
import { ageAt, buildCoreProfile, formatNumerology, personalCycles } from '@/lib/numerology';
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
  history: [
    'kemarin', 'yesterday', 'minggu lalu', 'last week', 'bulan lalu', 'last month',
    'pernah', 'sebelumnya', 'previously', 'dulu',
    'kita pernah', 'ingat', 'remember',
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
  /** Daily / weekly / monthly summary cascade — always present if any exist. */
  history?: string;
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
  const base = `<profile>
name: ${profile.fullName}
date of birth: ${dobStr}
age: ${age}
today (${profile.timezone}): ${todayDate}
core numbers: Life Path=${r(core.lifePath)}, Expression=${r(core.expression)}, Soul Urge=${r(core.soulUrge)}, Personality=${r(core.personality)}, Birthday=${r(core.birthday)}
karmic lessons: ${core.karmicLessons.length ? core.karmicLessons.join(', ') : 'none'}
today's cycles: Personal Year=${r(cycles.personalYear)}, Personal Month=${r(cycles.personalMonth)}, Personal Day=${r(cycles.personalDay)}
</profile>`;

  const result: SmartContext = { base, loaded };

  // Decide which conditional sources to fetch up-front so we can fan them
  // out in parallel with the always-on history cascade.
  const wantPeople = matches(question, KEYWORDS.people);
  const wantReading = matches(question, KEYWORDS.reading);
  const wantPatterns = matches(question, KEYWORDS.patterns);

  const since = new Date(Date.UTC(ctx.year, ctx.month - 1, ctx.day));
  since.setUTCDate(since.getUTCDate() - 30);

  const [dailies, weeklies, monthlies, people, reading, feedback] = await Promise.all([
    listSummaries(userId, 'DAILY', 7),
    listSummaries(userId, 'WEEKLY', 4),
    listSummaries(userId, 'MONTHLY', 6),
    wantPeople ? listPeople(userId) : Promise.resolve([] as Awaited<ReturnType<typeof listPeople>>),
    wantReading ? getReadingForLocalDay(userId, ctx.year, ctx.month, ctx.day) : Promise.resolve(null),
    wantPatterns
      ? getRecentFeedback(userId, since)
      : Promise.resolve([] as Awaited<ReturnType<typeof getRecentFeedback>>),
  ]);

  if (dailies.length || weeklies.length || monthlies.length) {
    result.history = formatHistory(dailies, weeklies, monthlies, locale);
    loaded.push('history');
  }

  if (wantPeople && people.length > 0) {
    result.people = people
      .map((p) => {
        const c = buildCoreProfile(p.fullName, p.dob);
        return `- ${p.fullName} (${p.relationship.toLowerCase()}, born ${p.dob.year}-${String(p.dob.month).padStart(2, '0')}-${String(p.dob.day).padStart(2, '0')}): LP=${r(c.lifePath)}, Expr=${r(c.expression)}, SU=${r(c.soulUrge)}`;
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

function formatHistory(
  daily: ConversationSummary[],
  weekly: ConversationSummary[],
  monthly: ConversationSummary[],
  locale: Locale,
): string {
  const blocks: string[] = [];

  if (monthly.length) {
    blocks.push(
      `=== ${locale === 'id' ? 'Ringkasan bulanan' : 'Monthly summaries'} ===\n` +
        monthly
          .slice(0, 6)
          .reverse()
          .map(
            (m) =>
              `[${m.periodStart.toISOString().slice(0, 7)}] ${m.summary}`,
          )
          .join('\n\n'),
    );
  }
  if (weekly.length) {
    blocks.push(
      `=== ${locale === 'id' ? 'Ringkasan mingguan' : 'Weekly summaries'} ===\n` +
        weekly
          .slice(0, 4)
          .reverse()
          .map(
            (w) =>
              `[${w.periodStart.toISOString().slice(0, 10)} → ${w.periodEnd.toISOString().slice(0, 10)}] ${w.summary}`,
          )
          .join('\n\n'),
    );
  }
  if (daily.length) {
    blocks.push(
      `=== ${locale === 'id' ? 'Ringkasan harian (terbaru)' : 'Daily summaries (recent)'} ===\n` +
        daily
          .slice(0, 7)
          .reverse()
          .map(
            (d) =>
              `[${d.periodStart.toISOString().slice(0, 10)}] ${d.summary}`,
          )
          .join('\n\n'),
    );
  }
  return blocks.join('\n\n');
}

/** Compose the smart context into a single user-turn string for the model. */
export function composeContextBlock(c: SmartContext, personalNotes?: string | null): string {
  const parts: string[] = [c.base];
  if (personalNotes && personalNotes.trim()) {
    parts.push(`<personal_notes>\n${personalNotes.trim()}\n</personal_notes>`);
  }
  if (c.history) {
    parts.push(`<conversation_history>\n${c.history}\n</conversation_history>`);
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
