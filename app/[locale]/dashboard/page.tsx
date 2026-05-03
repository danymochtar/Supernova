import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getSession } from '@/lib/auth/requireSession';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { isLocale, type Locale } from '@/lib/i18n/config';
import {
  activeSlots,
  ageAt,
  buildCoreProfile,
  challengeAt,
  contextFromInstant,
  cycleAt,
  personalCycles,
  pinnacleAt,
} from '@/lib/numerology';
import { NumberCard } from '@/components/numerology/NumberCard';
import { AboutMe } from '@/components/numerology/AboutMe';
import { KarmicLessonsList } from '@/components/numerology/KarmicLessonsList';
import { AppHeader } from '@/components/layout/AppHeader';
import { DailyReadingView } from '@/components/reading/DailyReadingView';
import { FeedbackPrompt } from '@/components/feedback/FeedbackPrompt';
import { getReadingForLocalDay } from '@/lib/db/repositories/reading';
import { getFeedbackForLocalDay } from '@/lib/db/repositories/feedback';
import { getTurnsBetween } from '@/lib/db/repositories/qa';
import { meaningFor } from '@/lib/numerology/meanings';
import { getOrGenerateAboutMe } from '@/lib/ai/aboutMe';
import { greetingFor } from '@/lib/greeting';
import { generateDailyReading } from './actions';
import { submitFeedback } from './feedbackActions';

const SHORT_DAY_ID = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];
const SHORT_MONTH_ID = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];

function formatTodayShort(ctx: { year: number; month: number; day: number }, locale: Locale): string {
  const d = new Date(Date.UTC(ctx.year, ctx.month - 1, ctx.day));
  if (locale === 'id') {
    return `${SHORT_DAY_ID[d.getUTCDay()]}, ${ctx.day} ${SHORT_MONTH_ID[ctx.month - 1]}`;
  }
  return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).toUpperCase();
}


export default async function DashboardPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id';
  const t = await getTranslations({ locale, namespace: 'dashboard' });

  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const profile = await getProfileByUserId(session.user.id);
  if (!profile) redirect(`/${locale}/welcome`);

  const core = buildCoreProfile(profile.fullName, profile.dob);
  const ctx = contextFromInstant(new Date(), profile.timezone);
  const cycles = personalCycles(profile.dob, ctx);
  const age = ageAt(profile.dob, ctx);
  const slots = activeSlots(profile.dob, age);

  const activePinnacle = pinnacleAt(core.pinnacles, slots.pinnacle);
  const activeChallenge = challengeAt(core.challenges, slots.challenge);
  const activeCycle = cycleAt(core.periodCycles, slots.cycle);

  const todayStart = new Date(Date.UTC(ctx.year, ctx.month - 1, ctx.day));
  const todayEnd = new Date(todayStart);
  todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

  // Fan everything out in parallel — these don't depend on each other and
  // were sequential awaits before, adding ~4 round-trip latencies on the
  // critical path. The About Me cold-start AI call is by far the slowest;
  // doing it alongside the DB queries hides their latency under it.
  const [cachedReading, todayFeedback, todaysChatTurns, aboutMeText] = await Promise.all([
    getReadingForLocalDay(session.user.id, ctx.year, ctx.month, ctx.day),
    getFeedbackForLocalDay(session.user.id, ctx.year, ctx.month, ctx.day),
    getTurnsBetween(session.user.id, todayStart, todayEnd),
    getOrGenerateAboutMe(session.user.id, {
      locale,
      fullName: profile.fullName,
      core: {
        lifePath: core.lifePath,
        expression: core.expression,
        soulUrge: core.soulUrge,
        personality: core.personality,
        birthday: core.birthday,
      },
      karmicLessons: core.karmicLessons,
    }),
  ]);

  const showFeedbackPrompt = todaysChatTurns.length === 0;

  // Local hour in the user's timezone for time-of-day greeting.
  const localHour = (() => {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: profile.timezone,
      hour: 'numeric',
      hour12: false,
    });
    const part = fmt.formatToParts(new Date()).find((p) => p.type === 'hour');
    return part ? Number(part.value) : new Date().getHours();
  })();
  const localGreeting = greetingFor(localHour, locale);

  return (
    <main className="container max-w-3xl space-y-8 px-4 py-6 sm:px-6 sm:py-10">
      <AppHeader
        labels={{
          greeting: t('greeting'),
          contextLine: `${localGreeting.word.toUpperCase()} · ${formatTodayShort(ctx, locale)}`,
          firstName: profile.firstName,
        }}
      />

      {/* Daily AI reading */}
      <DailyReadingView initialBody={cachedReading?.body ?? null} generate={generateDailyReading} />

      {/* End-of-day journal prompt — hidden when the chat thread has activity today */}
      {showFeedbackPrompt ? (
        <FeedbackPrompt
          locale={locale}
          action={submitFeedback}
          initial={todayFeedback ? { note: todayFeedback.note } : null}
        />
      ) : null}

      {/* About Me — AI-synthesized holistic summary (cached per user) */}
      <AboutMe
        title={t('aboutMeTitle')}
        subtitle={t('aboutMeSubtitle')}
        text={aboutMeText}
        fallback={t('aboutMeFallback')}
      />

      {/* Today */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t('todayTitle')}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <NumberCard
            label={t('personalDay')}
            result={cycles.personalDay}
            locale={locale}
            type="personalDay"
            meaning={meaningFor('personalDay', cycles.personalDay, locale)}
            comingSoonLabel={t('meaningComingSoon')}
          />
          <NumberCard
            label={t('personalMonth')}
            result={cycles.personalMonth}
            locale={locale}
            type="personalMonth"
            meaning={meaningFor('personalMonth', cycles.personalMonth, locale)}
            comingSoonLabel={t('meaningComingSoon')}
          />
          <NumberCard
            label={t('personalYear')}
            result={cycles.personalYear}
            locale={locale}
            type="personalYear"
            meaning={meaningFor('personalYear', cycles.personalYear, locale)}
            comingSoonLabel={t('meaningComingSoon')}
          />
        </div>
      </section>

      {/* Static core */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t('coreTitle')}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <NumberCard
            label={t('lifePath')}
            hint={t('lifePathHint')}
            result={core.lifePath}
            locale={locale}
            type="lifePath"
            meaning={meaningFor('lifePath', core.lifePath, locale)}
            comingSoonLabel={t('meaningComingSoon')}
          />
          <NumberCard
            label={t('expression')}
            hint={t('expressionHint')}
            result={core.expression}
            locale={locale}
            type="expression"
            meaning={meaningFor('expression', core.expression, locale)}
            comingSoonLabel={t('meaningComingSoon')}
          />
          <NumberCard
            label={t('soulUrge')}
            hint={t('soulUrgeHint')}
            result={core.soulUrge}
            locale={locale}
            type="soulUrge"
            meaning={meaningFor('soulUrge', core.soulUrge, locale)}
            comingSoonLabel={t('meaningComingSoon')}
          />
          <NumberCard
            label={t('personality')}
            hint={t('personalityHint')}
            result={core.personality}
            locale={locale}
            type="personality"
            meaning={meaningFor('personality', core.personality, locale)}
            comingSoonLabel={t('meaningComingSoon')}
          />
          <NumberCard
            label={t('birthday')}
            hint={t('birthdayHint')}
            result={core.birthday}
            locale={locale}
            type="birthday"
            meaning={meaningFor('birthday', core.birthday, locale)}
            comingSoonLabel={t('meaningComingSoon')}
          />
        </div>
      </section>

      {/* Active long-cycles */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t('currentChapterTitle')}</h2>
        <p className="text-muted-foreground text-sm">{t('currentChapterSubtitle', { age })}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <NumberCard
            label={`${t('pinnacle')} ${slots.pinnacle}`}
            hint={t('pinnacleHint')}
            result={activePinnacle}
            locale={locale}
            type="pinnacle"
            meaning={meaningFor('pinnacle', activePinnacle, locale)}
            comingSoonLabel={t('meaningComingSoon')}
          />
          <NumberCard
            label={`${t('challenge')} ${slots.challenge}`}
            hint={t('challengeHint')}
            result={activeChallenge}
            locale={locale}
            type="challenge"
            meaning={meaningFor('challenge', activeChallenge, locale)}
            comingSoonLabel={t('meaningComingSoon')}
          />
          <NumberCard
            label={`${t('cycle')} ${slots.cycle}`}
            hint={t('cycleHint')}
            result={activeCycle}
            locale={locale}
            type="cycle"
            meaning={meaningFor('cycle', activeCycle, locale)}
            comingSoonLabel={t('meaningComingSoon')}
          />
        </div>
      </section>

      {/* Karmic lessons */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t('karmicLessonsTitle')}</h2>
        <p className="text-muted-foreground text-sm">{t('karmicLessonsHint')}</p>
        <KarmicLessonsList
          lessons={core.karmicLessons.map((n) => ({
            number: n,
            meaning: meaningFor('karmicLesson', { compound: n, reduced: n, isMaster: false }, locale),
          }))}
          emptyLabel={t('karmicLessonsNone')}
          comingSoonLabel={t('meaningComingSoon')}
        />
      </section>

      <Link
        href={`/${locale}/journey`}
        className="border-border hover:bg-muted/30 group block rounded-xl border p-5 transition"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
              {t('seeFullJourney')}
            </p>
            <p className="mt-1 font-medium">{t('seeFullJourneyHint')}</p>
          </div>
          <span className="text-muted-foreground text-2xl group-hover:translate-x-1 transition">→</span>
        </div>
      </Link>
    </main>
  );
}
