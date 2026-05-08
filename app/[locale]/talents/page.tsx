import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, Briefcase, ChevronRight, Sparkles, Star } from 'lucide-react';
import { getSession } from '@/lib/auth/requireSession';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { listCareerEntries } from '@/lib/db/repositories/career';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { buildCoreProfile } from '@/lib/numerology';
import {
  rateTalentGroups,
  rateVocations,
  talentDistribution,
  type TalentRating,
} from '@/lib/numerology/talents';
import idMeanings from '@/content/meanings/id.json';
import enMeanings from '@/content/meanings/en.json';

export const dynamic = 'force-dynamic';

/** Branded colors per digit. Mirrors the WN palette so the chart at the
 *  bottom and the hero chips read with the same visual language. */
const DIGIT_COLOR: Record<number, string> = {
  1: '#ef4444',
  2: '#f97316',
  3: '#eab308',
  4: '#84cc16',
  5: '#06b6d4',
  6: '#3b82f6',
  7: '#a855f7',
  8: '#ec4899',
  9: '#22c55e',
};

const RATING_STYLE: Record<TalentRating, { dot: string; text: string; ring: string; bar: string }> = {
  high: {
    dot: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-300',
    ring: 'ring-emerald-500/20',
    bar: 'bg-emerald-500',
  },
  medium: {
    dot: 'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-300',
    ring: 'ring-amber-500/20',
    bar: 'bg-amber-500',
  },
  low: {
    dot: 'bg-neutral-400',
    text: 'text-muted-foreground',
    ring: 'ring-neutral-400/15',
    bar: 'bg-neutral-400',
  },
};

const VOCATION_COLOR: Record<string, string> = {
  business: '#ec4899',
  medicineEducation: '#06b6d4',
  legalPolitics: '#a855f7',
  artsDesign: '#eab308',
  salesPr: '#f97316',
  scienceEngineering: '#3b82f6',
  agriculture: '#84cc16',
};

const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function fmtMonth(d: Date | null, locale: Locale): string {
  if (!d) return '';
  const months = locale === 'id' ? MONTHS_ID : MONTHS_EN;
  return `${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function ratingBucket(score: number): TalentRating {
  if (score >= 70) return 'high';
  if (score >= 45) return 'medium';
  return 'low';
}

export default async function TalentsPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id';
  const t = await getTranslations({ locale, namespace: 'talents' });

  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const profile = await getProfileByUserId(session.user.id);
  if (!profile) redirect(`/${locale}/welcome`);

  const core = buildCoreProfile(profile.fullName, profile.dob);
  const dist = talentDistribution(profile.fullName, core);

  const groupRatings = [...rateTalentGroups(dist.slices)].sort((a, b) => b.score - a.score);
  const vocationRatings = [...rateVocations(dist.slices)].sort((a, b) => b.score - a.score);

  const careerEntries = await listCareerEntries(session.user.id);
  const avgCareerMatch =
    careerEntries.length > 0
      ? Math.round(
          careerEntries.reduce((s, e) => s + e.matchScore, 0) / careerEntries.length,
        )
      : 0;
  const careerPreview = careerEntries.slice(0, 3);

  const meanings = (locale === 'id' ? idMeanings : enMeanings) as Record<string, string>;
  function trait(digit: number, side: 'positive' | 'shadow'): string | null {
    return meanings[`talent:${digit}:${side}`] ?? null;
  }

  // Top-3 group titles for the hero summary.
  const topGroupTitles = groupRatings.slice(0, 3).map((g) => t(`groups.${g.id}.title`));
  const topVocation = vocationRatings[0];
  const maxChartPct = Math.max(1, ...dist.slices.map((s) => s.percentage));

  return (
    <main
      className="container max-w-3xl space-y-6 px-4 pb-6 sm:px-6 sm:pb-10"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1.5rem)' }}
    >
      <header className="space-y-1 pt-2">
        <h1 className="font-serif text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </header>

      {/* HERO SUMMARY — at-a-glance read of who the user is talent-wise.
        * No raw percentages here, just the top three group names + the
        * dominant digits as colored chips + the user's strongest career
        * field. Acts as the value-led entry point so the page doesn't
        * open with a chart the user has to interpret. */}
      <section className="border-primary/40 from-primary/10 ring-primary/20 overflow-hidden rounded-3xl border-2 bg-gradient-to-br to-accent/15 p-6 ring-1 dark:to-accent/15">
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-primary text-[11px] font-semibold uppercase tracking-[0.18em]">
              {t('heroEyebrow')}
            </p>
            <h2 className="font-serif text-xl font-semibold leading-tight tracking-tight sm:text-2xl">
              {topGroupTitles.length > 0
                ? t('heroTitleWithTop', {
                    top: topGroupTitles[0] ?? '',
                  })
                : t('heroTitleFallback')}
            </h2>
          </div>

          {/* Top 3 talent groups as ranked rows. */}
          {groupRatings.length > 0 ? (
            <ol className="space-y-2">
              {groupRatings.slice(0, 3).map((g, i) => {
                const style = RATING_STYLE[g.rating];
                return (
                  <li key={g.id} className="flex items-center gap-3">
                    <span className="text-primary font-mono w-5 shrink-0 text-xs font-semibold tabular-nums">
                      #{i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {t(`groups.${g.id}.title`)}
                    </span>
                    <div
                      className="bg-muted/50 hidden h-1.5 w-32 overflow-hidden rounded-full sm:block"
                      aria-hidden
                    >
                      <div
                        className={`h-full rounded-full ${style.bar}`}
                        style={{ width: `${Math.max(g.strength, 6)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : null}

          {/* Dominant digits as colored circles + top vocation. */}
          <div className="border-border/40 flex flex-wrap items-center gap-3 border-t pt-4">
            <div className="flex items-center gap-1.5">
              {dist.dominant.map((d) => (
                <span
                  key={d}
                  className="font-serif inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white"
                  style={{ backgroundColor: DIGIT_COLOR[d] }}
                >
                  {d}
                </span>
              ))}
            </div>
            {topVocation ? (
              <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <Star className="text-amber-500 h-3.5 w-3.5" aria-hidden />
                <span>
                  {t('heroTopVocation', { name: t(`vocations.${topVocation.id}.title`) })}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* CAREER section — moved up. Shows real preview when the user has
        * uploaded a résumé, falls back to a CTA card otherwise. This is
        * the value-led core of /talents per the user's intent. */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold">{t('careerTitle')}</h2>
          {careerEntries.length > 0 ? (
            <Link
              href={`/${locale}/talents/career`}
              className="text-primary press-soft inline-flex items-center gap-1 text-xs font-medium hover:underline"
            >
              {t('careerSeeAll')}
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          ) : null}
        </div>

        {careerEntries.length === 0 ? (
          <Link
            href={`/${locale}/talents/career`}
            className="border-border press-soft hover:bg-muted/40 group flex items-center gap-4 rounded-2xl border bg-gradient-to-br from-primary/5 to-accent/5 p-5 transition dark:from-primary/15 dark:to-accent/15"
          >
            <div className="bg-primary/15 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
              <Briefcase className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{t('careerCardTitle')}</p>
              <p className="text-muted-foreground text-xs leading-relaxed">{t('careerCardHint')}</p>
            </div>
            <ArrowRight className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden />
          </Link>
        ) : (
          <div className="space-y-3">
            {/* Aggregate */}
            <div className="border-border rounded-2xl border bg-gradient-to-br from-primary/5 to-accent/5 p-5 dark:from-primary/15 dark:to-accent/15">
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.18em]">
                    {t('careerAvgLabel')}
                  </p>
                  <p className="font-serif mt-1 text-3xl font-semibold tabular-nums">
                    {avgCareerMatch}%
                  </p>
                </div>
                <div className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
                  <Sparkles className="text-primary h-4 w-4" aria-hidden />
                  {t('careerCount', { n: careerEntries.length })}
                </div>
              </div>
              <div
                className="bg-muted/50 mt-3 h-2 w-full overflow-hidden rounded-full"
                aria-hidden
              >
                <div
                  className={`h-full rounded-full ${RATING_STYLE[ratingBucket(avgCareerMatch)].bar}`}
                  style={{ width: `${Math.max(avgCareerMatch, 4)}%` }}
                />
              </div>
            </div>

            {/* Top 3 most-recent roles preview. */}
            <ul className="space-y-2">
              {careerPreview.map((e) => {
                const bucket = ratingBucket(e.matchScore);
                const style = RATING_STYLE[bucket];
                const color = VOCATION_COLOR[e.vocationId] ?? '#888';
                const score = Math.round(e.matchScore);
                return (
                  <li
                    key={e.id}
                    className="border-border flex items-center gap-3 rounded-2xl border bg-white/40 p-4 dark:bg-neutral-900/40"
                  >
                    <span
                      className="h-8 w-1 shrink-0 rounded-full"
                      style={{ backgroundColor: color }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="truncate text-sm font-semibold">{e.title}</p>
                      <p className="text-muted-foreground truncate text-xs">
                        {e.company ? `${e.company} · ` : ''}
                        {e.startDate || e.endDate
                          ? `${fmtMonth(e.startDate, locale)} — ${
                              e.endDate ? fmtMonth(e.endDate, locale) : t('careerCurrent')
                            }`
                          : ''}
                      </p>
                      <div
                        className="bg-muted/50 h-1 w-full overflow-hidden rounded-full"
                        aria-hidden
                      >
                        <div
                          className={`h-full rounded-full ${style.bar}`}
                          style={{ width: `${Math.max(score, 4)}%` }}
                        />
                      </div>
                    </div>
                    <span className={`shrink-0 text-xs font-semibold tabular-nums ${style.text}`}>
                      {score}%
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      {/* TALENT GROUPS — 11 areas, sorted dominant first. */}
      <section className="space-y-3 pt-2">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{t('groupsTitle')}</h2>
          <p className="text-muted-foreground text-sm">{t('groupsHint')}</p>
        </div>
        <div className="space-y-3">
          {groupRatings.map((r) => {
            const style = RATING_STYLE[r.rating];
            const ratingLabel = t(
              r.rating === 'high' ? 'ratingHigh' : r.rating === 'medium' ? 'ratingMedium' : 'ratingLow',
            );
            return (
              <article
                key={r.id}
                className={`border-border ring-1 ${style.ring} rounded-2xl border bg-white/40 p-5 dark:bg-neutral-900/40`}
              >
                <header className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold">{t(`groups.${r.id}.title`)}</h3>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${style.text}`}>
                    <span className={`h-2 w-2 rounded-full ${style.dot}`} aria-hidden />
                    {ratingLabel}
                  </span>
                </header>
                <div
                  className="bg-muted/50 mb-3 h-1.5 w-full overflow-hidden rounded-full"
                  aria-hidden
                >
                  <div
                    className={`h-full rounded-full transition-all ${style.bar}`}
                    style={{ width: `${Math.max(r.strength, 4)}%` }}
                  />
                </div>
                <p className="text-muted-foreground mb-3 text-xs leading-relaxed">
                  {t(`groups.${r.id}.subTraits`)}
                </p>
                <p className="text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                  {t(`groups.${r.id}.${r.rating}`)}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* VOCATIONS — 7 fields, sorted dominant first. */}
      <section className="space-y-3 pt-2">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{t('vocationsTitle')}</h2>
          <p className="text-muted-foreground text-sm">{t('vocationsHint')}</p>
        </div>
        <div className="space-y-3">
          {vocationRatings.map((r) => {
            const style = RATING_STYLE[r.rating];
            const ratingLabel = t(
              r.rating === 'high' ? 'ratingHigh' : r.rating === 'medium' ? 'ratingMedium' : 'ratingLow',
            );
            return (
              <article
                key={r.id}
                className={`border-border ring-1 ${style.ring} rounded-2xl border bg-white/40 p-5 dark:bg-neutral-900/40`}
              >
                <header className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold">{t(`vocations.${r.id}.title`)}</h3>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${style.text}`}>
                    <span className={`h-2 w-2 rounded-full ${style.dot}`} aria-hidden />
                    {ratingLabel}
                  </span>
                </header>
                <div
                  className="bg-muted/50 mb-3 h-1.5 w-full overflow-hidden rounded-full"
                  aria-hidden
                >
                  <div
                    className={`h-full rounded-full transition-all ${style.bar}`}
                    style={{ width: `${Math.max(r.strength, 4)}%` }}
                  />
                </div>
                <p className="text-muted-foreground mb-3 text-xs leading-relaxed">
                  {t(`vocations.${r.id}.subTraits`)}
                </p>
                <p className="text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                  {t(`vocations.${r.id}.${r.rating}`)}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* DETAIL — chart + per-digit. Wrapped in a <details> so it's
        * collapsed by default; users who want the foundation can expand. */}
      <details className="border-border group rounded-2xl border bg-white/30 dark:bg-neutral-900/30">
        <summary className="press-soft flex cursor-pointer list-none items-center justify-between gap-2 px-5 py-4 [&::-webkit-details-marker]:hidden">
          <div className="space-y-0.5">
            <h2 className="text-base font-semibold">{t('detailTitle')}</h2>
            <p className="text-muted-foreground text-xs">{t('detailHint')}</p>
          </div>
          <ChevronRight
            className="text-muted-foreground h-4 w-4 shrink-0 transition-transform group-open:rotate-90"
            aria-hidden
          />
        </summary>

        <div className="border-border/60 space-y-6 border-t px-5 py-5">
          {/* Numerology proportional chart */}
          <div className="space-y-2">
            <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.18em]">
              {t('chartTitle')}
            </p>
            <p className="text-muted-foreground text-xs leading-relaxed">{t('chartHint')}</p>
            <div className="border-border rounded-2xl border bg-white/40 p-4 dark:bg-neutral-900/40">
              <div className="flex h-40 items-stretch gap-1.5 sm:gap-3">
                {dist.slices.map((s) => {
                  const heightPct = (s.percentage / maxChartPct) * 100;
                  return (
                    <div key={s.digit} className="flex flex-1 flex-col items-center gap-1">
                      <span
                        className="font-mono text-xs font-semibold tabular-nums"
                        style={{ color: DIGIT_COLOR[s.digit] }}
                      >
                        {s.digit}
                      </span>
                      <div className="relative w-full flex-1">
                        <div
                          className="absolute bottom-0 left-0 w-full rounded-t-md"
                          style={{
                            height: `${Math.max(heightPct, 3)}%`,
                            backgroundColor: DIGIT_COLOR[s.digit],
                            opacity: s.letterCount === 0 ? 0.18 : 1,
                          }}
                          aria-label={`Digit ${s.digit}: ${s.percentage}%`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-muted-foreground mt-3 text-center text-[11px]">
                {t('totalLetters', { n: dist.totalLetters })}
              </p>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">{t('explainer')}</p>
          </div>

          {/* Per-digit traits */}
          <div className="space-y-2">
            <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.18em]">
              {t('traitsTitle')}
            </p>
            <p className="text-muted-foreground text-xs leading-relaxed">{t('traitsHint')}</p>
            <div className="space-y-2">
              {[...dist.slices]
                .sort((a, b) => a.rank - b.rank)
                .map((s) => {
                  const positive = trait(s.digit, 'positive');
                  const shadow = trait(s.digit, 'shadow');
                  const muted = s.letterCount === 0;
                  return (
                    <details
                      key={s.digit}
                      className="border-border group/d overflow-hidden rounded-xl border bg-white/40 dark:bg-neutral-900/40"
                    >
                      <summary className="press-soft flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                        <span
                          className="text-muted-foreground font-mono w-5 shrink-0 text-center text-[11px] font-semibold tabular-nums"
                          aria-label={t('rankLabel', { n: s.rank })}
                        >
                          #{s.rank}
                        </span>
                        <span
                          className={`font-serif inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                            muted ? 'opacity-40' : 'text-white'
                          }`}
                          style={{
                            backgroundColor: muted ? 'transparent' : DIGIT_COLOR[s.digit],
                            border: muted ? `2px dashed ${DIGIT_COLOR[s.digit]}` : 'none',
                            color: muted ? DIGIT_COLOR[s.digit] : '#fff',
                          }}
                        >
                          {s.digit}
                        </span>
                        <p className="text-muted-foreground min-w-0 flex-1 truncate text-xs">
                          {positive ?? t('comingSoon')}
                        </p>
                        <ChevronRight
                          className="text-muted-foreground h-3.5 w-3.5 shrink-0 transition-transform group-open/d:rotate-90"
                          aria-hidden
                        />
                      </summary>
                      <div className="border-border/60 space-y-2 border-t px-4 py-3 text-sm">
                        {positive ? (
                          <div>
                            <p
                              className="text-[11px] font-semibold uppercase tracking-[0.18em]"
                              style={{ color: DIGIT_COLOR[s.digit] }}
                            >
                              {t('positiveLabel')}
                            </p>
                            <p className="mt-1 leading-relaxed text-neutral-800 dark:text-neutral-200">
                              {positive}
                            </p>
                          </div>
                        ) : null}
                        {shadow ? (
                          <div>
                            <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.18em]">
                              {t('shadowLabel')}
                            </p>
                            <p className="mt-1 leading-relaxed text-neutral-700 dark:text-neutral-300">
                              {shadow}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </details>
                  );
                })}
            </div>
          </div>
        </div>
      </details>
    </main>
  );
}
