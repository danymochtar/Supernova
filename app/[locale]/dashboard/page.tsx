import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Settings2 } from 'lucide-react';
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
import { Widget } from '@/components/layout/Widget';
import { DailyReadingView } from '@/components/reading/DailyReadingView';
import { FeedbackPrompt } from '@/components/feedback/FeedbackPrompt';
import { getFeedbackForLocalDay } from '@/lib/db/repositories/feedback';
import { getTurnsBetween } from '@/lib/db/repositories/qa';
import { meaningFor } from '@/lib/numerology/meanings';
import { getOrGenerateAboutMe } from '@/lib/ai/aboutMe';
import { getOrGenerateDailyReading } from '@/lib/ai/dailyReading';
import { parseLayout, type WidgetId } from '@/lib/dashboard/layout';
import { submitFeedback } from './feedbackActions';

const LONG_DAY_ID = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
const LONG_MONTH_ID = [
  'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
  'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER',
];

function formatDateLong(ctx: { year: number; month: number; day: number }, locale: Locale): string {
  const d = new Date(Date.UTC(ctx.year, ctx.month - 1, ctx.day));
  if (locale === 'id') {
    return `${LONG_DAY_ID[d.getUTCDay()]}, ${ctx.day} ${LONG_MONTH_ID[ctx.month - 1]}`;
  }
  return d.toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
  }).toUpperCase();
}


export default async function DashboardPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id';
  const t = await getTranslations({ locale, namespace: 'dashboard' });
  const tReading = await getTranslations({ locale, namespace: 'reading' });

  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const profile = await getProfileByUserId(session.user.id);
  if (!profile) redirect(`/${locale}/welcome`);

  const layout = parseLayout(profile.dashboardLayout);
  const visible = new Set<WidgetId>(layout.filter((w) => !w.hidden).map((w) => w.id));

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

  // Lazy fetch — only data for widgets the user has visible. Reading + About
  // Me are the slow ones; if hidden, we skip them entirely (saving a DB call
  // and a cold-start AI call respectively).
  const [readingBody, todayFeedback, todaysChatTurns, aboutMeText] = await Promise.all([
    visible.has('reading')
      ? getOrGenerateDailyReading(session.user.id, profile)
      : Promise.resolve(null),
    visible.has('feedback')
      ? getFeedbackForLocalDay(session.user.id, ctx.year, ctx.month, ctx.day)
      : Promise.resolve(null),
    visible.has('feedback')
      ? getTurnsBetween(session.user.id, todayStart, todayEnd)
      : Promise.resolve([] as Awaited<ReturnType<typeof getTurnsBetween>>),
    visible.has('aboutMe')
      ? getOrGenerateAboutMe(session.user.id, {
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
          preferredModel: profile.preferredModel,
        })
      : Promise.resolve(null),
  ]);

  const showFeedbackPrompt = visible.has('feedback') && todaysChatTurns.length === 0;

  function renderWidget(id: WidgetId): React.ReactNode {
    switch (id) {
      case 'reading':
        return (
          <DailyReadingView
            key={id}
            body={readingBody}
            dateLabel={formatDateLong(ctx, locale)}
            dayTitle={meaningFor('personalDayTitle', cycles.personalDay, locale) ?? ''}
            labels={{
              todaysTheme: tReading('todaysTheme'),
              affirmation: tReading('affirmation'),
              fallback: tReading('fallback'),
            }}
          />
        );
      case 'feedback':
        return showFeedbackPrompt ? (
          <FeedbackPrompt
            key={id}
            locale={locale}
            action={submitFeedback}
            initial={todayFeedback ? { note: todayFeedback.note } : null}
          />
        ) : null;
      case 'aboutMe':
        return (
          <AboutMe
            key={id}
            title={t('aboutMeTitle')}
            subtitle={t('aboutMeSubtitle')}
            text={aboutMeText}
            fallback={t('aboutMeFallback')}
          />
        );
      case 'today':
        return (
          <Widget key={id} title={t('todayTitle')}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <NumberCard label={t('personalDay')} result={cycles.personalDay} locale={locale} type="personalDay" meaning={meaningFor('personalDay', cycles.personalDay, locale)} comingSoonLabel={t('meaningComingSoon')} />
              <NumberCard label={t('personalMonth')} result={cycles.personalMonth} locale={locale} type="personalMonth" meaning={meaningFor('personalMonth', cycles.personalMonth, locale)} comingSoonLabel={t('meaningComingSoon')} />
              <NumberCard label={t('personalYear')} result={cycles.personalYear} locale={locale} type="personalYear" meaning={meaningFor('personalYear', cycles.personalYear, locale)} comingSoonLabel={t('meaningComingSoon')} />
            </div>
          </Widget>
        );
      case 'core':
        return (
          <Widget key={id} title={t('coreTitle')} defaultOpen={false}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <NumberCard label={t('lifePath')} hint={t('lifePathHint')} result={core.lifePath} locale={locale} type="lifePath" meaning={meaningFor('lifePath', core.lifePath, locale)} comingSoonLabel={t('meaningComingSoon')} />
              <NumberCard label={t('expression')} hint={t('expressionHint')} result={core.expression} locale={locale} type="expression" meaning={meaningFor('expression', core.expression, locale)} comingSoonLabel={t('meaningComingSoon')} />
              <NumberCard label={t('soulUrge')} hint={t('soulUrgeHint')} result={core.soulUrge} locale={locale} type="soulUrge" meaning={meaningFor('soulUrge', core.soulUrge, locale)} comingSoonLabel={t('meaningComingSoon')} />
              <NumberCard label={t('personality')} hint={t('personalityHint')} result={core.personality} locale={locale} type="personality" meaning={meaningFor('personality', core.personality, locale)} comingSoonLabel={t('meaningComingSoon')} />
              <NumberCard label={t('birthday')} hint={t('birthdayHint')} result={core.birthday} locale={locale} type="birthday" meaning={meaningFor('birthday', core.birthday, locale)} comingSoonLabel={t('meaningComingSoon')} />
            </div>
          </Widget>
        );
      case 'chapter':
        return (
          <Widget key={id} title={t('currentChapterTitle')} hint={t('currentChapterSubtitle', { age })} defaultOpen={false}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <NumberCard label={`${t('pinnacle')} ${slots.pinnacle}`} hint={t('pinnacleHint')} result={activePinnacle} locale={locale} type="pinnacle" meaning={meaningFor('pinnacle', activePinnacle, locale)} comingSoonLabel={t('meaningComingSoon')} />
              <NumberCard label={`${t('challenge')} ${slots.challenge}`} hint={t('challengeHint')} result={activeChallenge} locale={locale} type="challenge" meaning={meaningFor('challenge', activeChallenge, locale)} comingSoonLabel={t('meaningComingSoon')} />
              <NumberCard label={`${t('cycle')} ${slots.cycle}`} hint={t('cycleHint')} result={activeCycle} locale={locale} type="cycle" meaning={meaningFor('cycle', activeCycle, locale)} comingSoonLabel={t('meaningComingSoon')} />
            </div>
          </Widget>
        );
      case 'karmic':
        return (
          <Widget key={id} title={t('karmicLessonsTitle')} hint={t('karmicLessonsHint')} defaultOpen={false}>
            <KarmicLessonsList
              lessons={core.karmicLessons.map((n) => ({
                number: n,
                meaning: meaningFor('karmicLesson', { compound: n, reduced: n, isMaster: false }, locale),
              }))}
              emptyLabel={t('karmicLessonsNone')}
              comingSoonLabel={t('meaningComingSoon')}
            />
          </Widget>
        );
      case 'journey':
        return (
          <Link
            key={id}
            href={`/${locale}/journey`}
            className="border-border hover:bg-muted/30 press-soft group block rounded-xl border p-5 transition-colors"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  {t('seeFullJourney')}
                </p>
                <p className="mt-1 font-medium">{t('seeFullJourneyHint')}</p>
              </div>
              <span className="text-muted-foreground text-2xl transition group-hover:translate-x-1">→</span>
            </div>
          </Link>
        );
      default:
        return null;
    }
  }

  return (
    <main className="container flex max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
      <AppHeader />

      {layout.filter((w) => !w.hidden).map((w) => renderWidget(w.id))}

      <Link
        href={`/${locale}/me/layout`}
        className="text-muted-foreground hover:text-foreground press-soft inline-flex items-center gap-1.5 self-start text-xs underline-offset-4 hover:underline"
      >
        <Settings2 className="h-3.5 w-3.5" aria-hidden />
        {t('customizeDashboard')}
      </Link>
    </main>
  );
}
