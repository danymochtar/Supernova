import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Settings2 } from 'lucide-react';
import { getSession } from '@/lib/auth/requireSession';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { isLocale, type Locale } from '@/lib/i18n/config';
import {
  buildCoreProfile,
  contextFromInstant,
  personalCycles,
} from '@/lib/numerology';
import { NumberCard } from '@/components/numerology/NumberCard';
import { AboutMe } from '@/components/numerology/AboutMe';
import { KarmicLessonsList } from '@/components/numerology/KarmicLessonsList';
import { AppHeader } from '@/components/layout/AppHeader';
import { Widget } from '@/components/layout/Widget';
import { Explainer } from '@/components/layout/Explainer';
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
    return `${LONG_DAY_ID[d.getUTCDay()]}, ${ctx.day} ${LONG_MONTH_ID[ctx.month - 1]} ${ctx.year}`;
  }
  return d.toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
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
  // World Numerology's "today's numbers are X, Y, Z" framing: PD, PM, and
  // the calendar day-of-month digital root. May 4 → 4; May 31 → 4 (3+1).
  const dayOfMonthReduced = (() => {
    let n = ctx.day;
    while (n >= 10) n = Math.floor(n / 10) + (n % 10);
    return n;
  })();
  const todayStart = new Date(Date.UTC(ctx.year, ctx.month - 1, ctx.day));
  const todayEnd = new Date(todayStart);
  todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

  // Lazy fetch — only data for widgets the user has visible. Reading + About
  // Me are the slow ones; if hidden, we skip them entirely (saving a DB call
  // and a cold-start AI call respectively).
  const [readingBody, todayFeedback, todaysChatTurns, aboutMeData] = await Promise.all([
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
            daySuffix={tReading('daySuffix', { n: cycles.personalDay.reduced })}
            triple={{
              day: cycles.personalDay.reduced,
              month: cycles.personalMonth.reduced,
              date: dayOfMonthReduced,
            }}
            showLabel={tReading('showNumbers')}
            hideLabel={tReading('hideNumbers')}
            numbers={
              <div className="space-y-3">
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
            }
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
            data={aboutMeData}
            fallback={t('aboutMeFallback')}
            cardLabels={{
              lifePath: t('lifePath'),
              expression: t('expression'),
              soulUrge: t('soulUrge'),
              personality: t('personality'),
              birthday: t('birthday'),
              karmicLessons: t('karmicLessonsTitle'),
            }}
            numbers={{
              lifePath: core.lifePath,
              expression: core.expression,
              soulUrge: core.soulUrge,
              personality: core.personality,
              birthday: core.birthday,
              karmicLessons: core.karmicLessons,
            }}
            locale={locale}
            explainer={{
              title: t('explainerLearnMore'),
              body: t('aboutMeExplainer'),
            }}
          />
        );
      case 'karmic':
        return (
          <Widget key={id} title={t('karmicLessonsTitle')} hint={t('karmicLessonsHint')} defaultOpen={false}>
            <div className="space-y-3">
              <Explainer title={t('explainerLearnMore')} body={t('karmicLessonsExplainer')} />
              <KarmicLessonsList
                lessons={core.karmicLessons.map((n) => ({
                  number: n,
                  meaning: meaningFor('karmicLesson', { compound: n, reduced: n, isMaster: false }, locale),
                }))}
                emptyLabel={t('karmicLessonsNone')}
                comingSoonLabel={t('meaningComingSoon')}
              />
            </div>
          </Widget>
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
