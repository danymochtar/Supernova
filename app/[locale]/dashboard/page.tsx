import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Settings2 } from 'lucide-react';
import { getSession } from '@/lib/auth/requireSession';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { isLocale, type Locale } from '@/lib/i18n/config';
import {
  bridges,
  buildCoreProfile,
  contextFromInstant,
  minorNumbers,
  personalCycles,
} from '@/lib/numerology';
import { NumberCard } from '@/components/numerology/NumberCard';
import { AboutMe } from '@/components/numerology/AboutMe';
import { KarmicLessonsList } from '@/components/numerology/KarmicLessonsList';
import { AppHeader } from '@/components/layout/AppHeader';
import { Widget } from '@/components/layout/Widget';
import { Explainer } from '@/components/layout/Explainer';
import { DailyReadingView } from '@/components/reading/DailyReadingView';
import { DateBrowser } from '@/components/reading/DateBrowser';
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

// World Numerology's "today's numbers are X, Y, Z, W" framing — PD as star: reduced, compound, then the compound's digits.
// PD compound ≤ 9 → just [reduced]; ≥ 10 → [reduced, compound, tens, ones].
function wnDayNumbers(pd: { compound: number; reduced: number }): number[] {
  if (pd.compound < 10) return [pd.reduced];
  const tens = Math.floor(pd.compound / 10);
  const ones = pd.compound % 10;
  return [pd.reduced, pd.compound, tens, ones];
}

const PREVIEW_WINDOW_DAYS = 90;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function isoOf(ctx: { year: number; month: number; day: number }): string {
  return `${ctx.year}-${pad2(ctx.month)}-${pad2(ctx.day)}`;
}

function ctxFromIso(iso: string): { year: number; month: number; day: number } {
  const [y, m, d] = iso.split('-').map(Number);
  return { year: y!, month: m!, day: d! };
}

function shiftIso(iso: string, days: number): string {
  const c = ctxFromIso(iso);
  const dt = new Date(Date.UTC(c.year, c.month - 1, c.day));
  dt.setUTCDate(dt.getUTCDate() + days);
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
}

function clampDateParam(input: string | undefined, todayIso: string, maxIso: string): string {
  if (!input || !/^\d{4}-\d{2}-\d{2}$/.test(input)) return todayIso;
  if (input < todayIso) return todayIso;
  if (input > maxIso) return maxIso;
  return input;
}


export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { date?: string };
}) {
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
  const today = contextFromInstant(new Date(), profile.timezone);
  const todayIso = isoOf(today);
  const maxIso = shiftIso(todayIso, PREVIEW_WINDOW_DAYS);
  const selectedIso = clampDateParam(searchParams.date, todayIso, maxIso);
  const isPreview = selectedIso !== todayIso;
  const ctx = isPreview ? ctxFromIso(selectedIso) : today;
  const cycles = personalCycles(profile.dob, ctx);
  const minor = minorNumbers(profile.nickname);
  const bridge = bridges(core);
  const todayStart = new Date(Date.UTC(today.year, today.month - 1, today.day));
  const todayEnd = new Date(todayStart);
  todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

  // Each (user, date) gets its own AI reading so the title + body reflect the
  // exact compound combination — different compounds with the same reduced PD
  // (e.g. PD 12/3 vs 30/3) must read distinctly. Cached after first generation.
  const [readingBody, todayFeedback, todaysChatTurns, aboutMeData] = await Promise.all([
    visible.has('reading')
      ? getOrGenerateDailyReading(session.user.id, profile, isPreview ? { targetCtx: ctx } : undefined)
      : Promise.resolve(null),
    visible.has('feedback') && !isPreview
      ? getFeedbackForLocalDay(session.user.id, today.year, today.month, today.day)
      : Promise.resolve(null),
    visible.has('feedback') && !isPreview
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

  const showFeedbackPrompt = !isPreview && visible.has('feedback') && todaysChatTurns.length === 0;

  function renderWidget(id: WidgetId): React.ReactNode {
    switch (id) {
      case 'reading':
        return (
            <DailyReadingView
              key={id}
              body={readingBody}
            dateLabel={formatDateLong(ctx, locale)}
            dayTitle={meaningFor('personalDayTitle', cycles.personalDay, locale) ?? ''}
            todaysNumbers={wnDayNumbers(cycles.personalDay)}
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
            minor={minor}
            minorLabels={{
              expression: t('minorExpression'),
              soulUrge: t('minorSoulUrge'),
              personality: t('minorPersonality'),
            }}
            minorExplainer={{
              title: t('explainerLearnMore'),
              body: t('minorExplainer'),
            }}
            bridge={bridge}
            bridgeLabels={{
              lifePathExpression: t('bridgeLifePathExpression'),
              lifePathExpressionHint: t('bridgeLifePathExpressionHint'),
              soulUrgePersonality: t('bridgeSoulUrgePersonality'),
              soulUrgePersonalityHint: t('bridgeSoulUrgePersonalityHint'),
            }}
            bridgeExplainer={{
              title: t('explainerLearnMore'),
              body: t('bridgeExplainer'),
            }}
            comingSoonLabel={t('meaningComingSoon')}
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
    <main
      className="container flex max-w-3xl flex-col gap-6 px-4 pb-6 sm:px-6 sm:pb-10"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1.5rem)' }}
    >
      <AppHeader
        locale={locale}
        settingsLabel={t('settingsLink')}
        leading={
          visible.has('reading') ? (
            <DateBrowser
              selectedIso={selectedIso}
              todayIso={todayIso}
              maxIso={maxIso}
              pickLabel={tReading('pickDate')}
              backLabel={tReading('backToToday')}
            />
          ) : null
        }
      />

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
