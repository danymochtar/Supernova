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
import { SignOutButton } from '@/components/auth/SignOutButton';
import { DailyReadingView } from '@/components/reading/DailyReadingView';
import { FeedbackPrompt } from '@/components/feedback/FeedbackPrompt';
import { getReadingForLocalDay } from '@/lib/db/repositories/reading';
import { getFeedbackForLocalDay } from '@/lib/db/repositories/feedback';
import { meaningFor } from '@/lib/numerology/meanings';
import { generateDailyReading } from './actions';
import { submitFeedback } from './feedbackActions';

const DAY_NAMES_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function formatToday(ctx: { year: number; month: number; day: number }, locale: Locale) {
  const d = new Date(Date.UTC(ctx.year, ctx.month - 1, ctx.day));
  if (locale === 'id') {
    return `${DAY_NAMES_ID[d.getUTCDay()]}, ${ctx.day} ${MONTH_NAMES_ID[ctx.month - 1]} ${ctx.year}`;
  }
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
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

  const cachedReading = await getReadingForLocalDay(
    session.user.id,
    ctx.year,
    ctx.month,
    ctx.day,
  );

  const todayFeedback = await getFeedbackForLocalDay(
    session.user.id,
    ctx.year,
    ctx.month,
    ctx.day,
  );

  const SUGGESTED_TAGS_ID = ['kerja', 'keluarga', 'kesehatan', 'energi', 'fokus', 'mood', 'uang', 'hubungan'];
  const SUGGESTED_TAGS_EN = ['work', 'family', 'health', 'energy', 'focus', 'mood', 'money', 'relationships'];
  const suggestedTags = locale === 'id' ? SUGGESTED_TAGS_ID : SUGGESTED_TAGS_EN;

  const meaningProps = {
    expandLabel: t('whatDoesThisMean'),
    collapseLabel: t('hide'),
    comingSoonLabel: t('meaningComingSoon'),
  };

  return (
    <main className="container max-w-4xl space-y-10 py-10">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
            {t('greeting')}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{profile.fullName}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {formatToday(ctx, locale)} · {profile.timezone}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/${locale}/journey`}
            className="border-border rounded-lg border px-4 py-2 text-sm font-medium"
          >
            {t('journeyCta')}
          </Link>
          <Link
            href={`/${locale}/patterns`}
            className="border-border rounded-lg border px-4 py-2 text-sm font-medium"
          >
            {t('patternsCta')}
          </Link>
          <Link
            href={`/${locale}/people`}
            className="border-border rounded-lg border px-4 py-2 text-sm font-medium"
          >
            {t('peopleCta')}
          </Link>
          <Link
            href={`/${locale}/ask`}
            className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium"
          >
            {t('askCta')}
          </Link>
          <SignOutButton label={t('signOut')} locale={locale} />
        </div>
      </header>

      {/* Daily AI reading */}
      <DailyReadingView initialBody={cachedReading?.body ?? null} generate={generateDailyReading} />

      {/* End-of-day feedback */}
      <FeedbackPrompt
        locale={locale}
        action={submitFeedback}
        suggestedTags={suggestedTags}
        initial={
          todayFeedback
            ? { rating: todayFeedback.rating, note: todayFeedback.note, tags: todayFeedback.tags }
            : null
        }
      />

      {/* About Me — narrative summary using curated meanings */}
      <AboutMe
        locale={locale}
        fullName={profile.fullName}
        core={core}
        karmicLessons={core.karmicLessons}
        t={{
          title: t('aboutMeTitle'),
          subtitle: t('aboutMeSubtitle'),
          lifePath: t('lifePath'),
          expression: t('expression'),
          soulUrge: t('soulUrge'),
          personality: t('personality'),
          birthday: t('birthday'),
          karmicLessons: t('karmicLessonsTitle'),
          karmicLessonsBody: (lessons: string) => t('karmicLessonsBody', { lessons }),
          karmicLessonsNone: t('karmicLessonsNone'),
          nothingYet: t('meaningComingSoon'),
        }}
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
            {...meaningProps}
          />
          <NumberCard
            label={t('personalMonth')}
            result={cycles.personalMonth}
            locale={locale}
            type="personalMonth"
            meaning={meaningFor('personalMonth', cycles.personalMonth, locale)}
            {...meaningProps}
          />
          <NumberCard
            label={t('personalYear')}
            result={cycles.personalYear}
            locale={locale}
            type="personalYear"
            meaning={meaningFor('personalYear', cycles.personalYear, locale)}
            {...meaningProps}
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
            {...meaningProps}
          />
          <NumberCard
            label={t('expression')}
            hint={t('expressionHint')}
            result={core.expression}
            locale={locale}
            type="expression"
            meaning={meaningFor('expression', core.expression, locale)}
            {...meaningProps}
          />
          <NumberCard
            label={t('soulUrge')}
            hint={t('soulUrgeHint')}
            result={core.soulUrge}
            locale={locale}
            type="soulUrge"
            meaning={meaningFor('soulUrge', core.soulUrge, locale)}
            {...meaningProps}
          />
          <NumberCard
            label={t('personality')}
            hint={t('personalityHint')}
            result={core.personality}
            locale={locale}
            type="personality"
            meaning={meaningFor('personality', core.personality, locale)}
            {...meaningProps}
          />
          <NumberCard
            label={t('birthday')}
            hint={t('birthdayHint')}
            result={core.birthday}
            locale={locale}
            type="birthday"
            meaning={meaningFor('birthday', core.birthday, locale)}
            {...meaningProps}
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
            {...meaningProps}
          />
          <NumberCard
            label={`${t('challenge')} ${slots.challenge}`}
            hint={t('challengeHint')}
            result={activeChallenge}
            locale={locale}
            type="challenge"
            meaning={meaningFor('challenge', activeChallenge, locale)}
            {...meaningProps}
          />
          <NumberCard
            label={`${t('cycle')} ${slots.cycle}`}
            hint={t('cycleHint')}
            result={activeCycle}
            locale={locale}
            type="cycle"
            meaning={meaningFor('cycle', activeCycle, locale)}
            {...meaningProps}
          />
        </div>
      </section>

      {/* Karmic lessons */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t('karmicLessonsTitle')}</h2>
        {core.karmicLessons.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {core.karmicLessons.map((n) => (
              <span
                key={n}
                className="border-border rounded-full border px-3 py-1 font-mono text-sm tabular-nums"
                title={t('karmicLessonsHint')}
              >
                {n}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">{t('karmicLessonsNone')}</p>
        )}
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
