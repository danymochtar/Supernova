import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getSession } from '@/lib/auth/requireSession';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { isLocale, type Locale } from '@/lib/i18n/config';
import {
  contextFromInstant,
  personalCycles,
  reduceToDigit,
} from '@/lib/numerology';
import { NumberCard } from '@/components/numerology/NumberCard';
import { AppHeader } from '@/components/layout/AppHeader';
import { CurhatShortcut } from '@/components/curhat/CurhatShortcut';
import { DailyReadingView } from '@/components/reading/DailyReadingView';
import { DateBrowser } from '@/components/reading/DateBrowser';
import { FeedbackPrompt } from '@/components/feedback/FeedbackPrompt';
import { getFeedbackForLocalDay } from '@/lib/db/repositories/feedback';
import { getTurnsBetween } from '@/lib/db/repositories/qa';
import { meaningFor } from '@/lib/numerology/meanings';
import { getOrGenerateDailyReading } from '@/lib/ai/dailyReading';
import { submitFeedback } from './feedbackActions';
import { getJournalDigest, listOpenActionItems } from '@/lib/db/repositories/journal';
import { FollowUpWidget, type OpenActionItemLite } from '@/components/journal/FollowUpWidget';
import {
  JournalDigestWidget,
  type JournalDigestLite,
} from '@/components/journal/JournalDigestWidget';
import { toggleActionItemAction } from '@/app/[locale]/journal/actions';

type WidgetId = 'reading' | 'followUp' | 'digest' | 'feedback';

// Fixed dashboard widget order. The heavy "About You" + Karmic blocks
// moved to the Kehidupan tab — Beranda stays light: daily reading, then
// pending follow-ups, then the weekly digest, then the end-of-day
// feedback prompt.
const WIDGET_ORDER: WidgetId[] = ['reading', 'followUp', 'digest', 'feedback'];

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

// World Numerology's "today's numbers are X, Y, Z, W" framing — PD as star.
// The Personal Day is (Personal Month reduced) + (day-of-month), so WN
// surfaces the two reduced addends that build it. For Dany on 25 May 2026:
// PM 1 + date 25→7 = 8 → "8, 26, 1, 7".
//   slot 1 = single-digit Personal Day (master days like 11 still show "2"),
//   slot 2 = compound Personal Day,
//   slot 3 = Personal Month (first addend, as stored),
//   slot 4 = day-of-month reduced to a single digit (second addend).
// slots 3 + 4 reduce back to slot 1.
function wnDayNumbers(
  pd: { compound: number; reduced: number },
  personalMonthReduced: number,
  dayOfMonth: number,
): number[] {
  if (pd.compound < 10) return [pd.compound];
  return [reduceToDigit(pd.reduced), pd.compound, personalMonthReduced, reduceToDigit(dayOfMonth)];
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
  const tChat = await getTranslations({ locale, namespace: 'chat' });

  const session = await getSession();
  if (!session) {
    redirect(`/${locale}/login`);
  }

  const profile = await getProfileByUserId(session.user.id);
  if (!profile) redirect(`/${locale}/welcome`);

  const today = contextFromInstant(new Date(), profile.timezone);
  const todayIso = isoOf(today);
  const maxIso = shiftIso(todayIso, PREVIEW_WINDOW_DAYS);
  const selectedIso = clampDateParam(searchParams.date, todayIso, maxIso);
  const isPreview = selectedIso !== todayIso;
  const ctx = isPreview ? ctxFromIso(selectedIso) : today;
  const cycles = personalCycles(profile.dob, ctx);
  const todayStart = new Date(Date.UTC(today.year, today.month - 1, today.day));
  const todayEnd = new Date(todayStart);
  todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

  // Daily reading + day-bound DB queries — these block the page render
  // because the reading is the lede. AboutMe is split into its own
  // Suspense boundary below so the reading paints first.
  const [readingBody, todayFeedback, todaysChatTurns, openActionItems] = await Promise.all([
    getOrGenerateDailyReading(session.user.id, profile, isPreview ? { targetCtx: ctx } : undefined),
    !isPreview
      ? getFeedbackForLocalDay(session.user.id, today.year, today.month, today.day)
      : Promise.resolve(null),
    !isPreview
      ? getTurnsBetween(session.user.id, todayStart, todayEnd)
      : Promise.resolve([] as Awaited<ReturnType<typeof getTurnsBetween>>),
    // Follow-up widget data: open action items from the last 14 days,
    // capped at 5. Suppressed on date-preview pages — the loop-back only
    // makes sense in real time, not when browsing future-day readings.
    !isPreview ? listOpenActionItems(session.user.id, 14, 5) : Promise.resolve([]),
  ]);

  // Weekly digest — separate await because it's not on the page's critical
  // path (suppressed when <3 entries) and lets the cold-cache widget fall
  // through quickly when there's nothing to show.
  const DIGEST_DAYS = 7;
  const digestRaw = !isPreview
    ? await getJournalDigest(session.user.id, DIGEST_DAYS)
    : null;
  const digest: JournalDigestLite | null =
    digestRaw && digestRaw.totalEntries >= 3
      ? {
          totalEntries: digestRaw.totalEntries,
          topThemes: digestRaw.topThemes,
          topEmotions: digestRaw.topEmotions,
          actionsDone: digestRaw.actionsDone,
          actionsOpen: digestRaw.actionsOpen,
          completionByEmotion: digestRaw.completionByEmotion,
        }
      : null;

  // Project to the widget's shape — pre-compute days-ago so the client
  // doesn't have to redo the date math per render.
  const followUpItems: OpenActionItemLite[] = openActionItems.map((it) => {
    const ms = Date.now() - it.entryAddedAt.getTime();
    const daysAgo = Math.max(0, Math.floor(ms / 86_400_000));
    return {
      id: it.id,
      title: it.title,
      entryId: it.entryId,
      entryAddedAt: it.entryAddedAt.toISOString(),
      entryEmotion: it.entryEmotion,
      entryTheme: it.entryTheme,
      daysAgo,
    };
  });

  const showFeedbackPrompt = !isPreview && todaysChatTurns.length === 0;

  function renderWidget(id: WidgetId): React.ReactNode {
    switch (id) {
      case 'reading':
        return (
            <DailyReadingView
              key={id}
              body={readingBody}
            dateLabel={formatDateLong(ctx, locale)}
            dayTitle={meaningFor('personalDayTitle', cycles.personalDay, locale) ?? ''}
            todaysNumbers={wnDayNumbers(cycles.personalDay, cycles.personalMonth.reduced, ctx.day)}
            showAffirmation={!isPreview}
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
      case 'followUp':
        return (
          <FollowUpWidget
            key={id}
            locale={locale}
            items={followUpItems}
            toggleAction={toggleActionItemAction}
          />
        );
      case 'digest':
        return digest ? (
          <JournalDigestWidget key={id} digest={digest} days={DIGEST_DAYS} />
        ) : null;
      case 'feedback':
        return showFeedbackPrompt ? (
          <FeedbackPrompt
            key={id}
            locale={locale}
            action={submitFeedback}
            initial={todayFeedback ? { note: todayFeedback.note } : null}
          />
        ) : null;
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
          <DateBrowser
            selectedIso={selectedIso}
            todayIso={todayIso}
            maxIso={maxIso}
            pickLabel={tReading('pickDate')}
            backLabel={tReading('backToToday')}
          />
        }
      />

      {!isPreview ? (
        <div className="flex">
          <CurhatShortcut locale={locale} topic="pribadi" label={tChat('shortcutHome')} />
        </div>
      ) : null}

      {WIDGET_ORDER.map((id) => renderWidget(id))}
    </main>
  );
}
