import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Briefcase, ChevronRight } from 'lucide-react';
import { getSession } from '@/lib/auth/requireSession';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { buildCoreProfile } from '@/lib/numerology';
import {
  TALENT_GROUPS,
  TALENT_VOCATIONS,
  rateTalentGroups,
  rateVocations,
  talentDistribution,
} from '@/lib/numerology/talents';
import idMeanings from '@/content/meanings/id.json';
import enMeanings from '@/content/meanings/en.json';
import { Explainer } from '@/components/layout/Explainer';

export const dynamic = 'force-dynamic';

/** Branded colors per digit for the bar chart and trait card accents.
 * Roughly mirrors the WN palette so the chart reads similarly. */
const DIGIT_COLOR: Record<number, string> = {
  1: '#ef4444', // red
  2: '#f97316', // orange
  3: '#eab308', // yellow
  4: '#84cc16', // lime
  5: '#06b6d4', // cyan
  6: '#3b82f6', // blue
  7: '#a855f7', // purple
  8: '#ec4899', // pink
  9: '#22c55e', // green
};

export default async function TalentsPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id';
  const t = await getTranslations({ locale, namespace: 'talents' });

  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const profile = await getProfileByUserId(session.user.id);
  if (!profile) redirect(`/${locale}/welcome`);

  const core = buildCoreProfile(profile.fullName, profile.dob);
  const dist = talentDistribution(profile.fullName, core);
  const maxPct = Math.max(1, ...dist.slices.map((s) => s.percentage));

  const meanings = (locale === 'id' ? idMeanings : enMeanings) as Record<string, string>;
  function trait(digit: number, side: 'positive' | 'shadow'): string | null {
    return meanings[`talent:${digit}:${side}`] ?? null;
  }

  return (
    <main
      className="container max-w-3xl space-y-8 px-4 pb-6 sm:px-6 sm:pb-10"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1.5rem)' }}
    >
      <header className="space-y-1 pt-2">
        <h1 className="font-serif text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </header>

      {/* Proportional chart */}
      <section className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{t('chartTitle')}</h2>
          <p className="text-muted-foreground text-sm">{t('chartHint')}</p>
        </div>

        <div className="border-border rounded-2xl border bg-white/40 p-5 dark:bg-neutral-900/40">
          {/* Bars — each column stretches to the container's full height
            * (items-stretch default), then the bar fills bottom-up with an
            * absolute-positioned inner div whose height is a percentage of
            * its relative parent. Earlier "items-end + flex-1" approach
            * collapsed the column to auto height so the % had no anchor. */}
          <div className="flex h-48 items-stretch gap-1.5 sm:gap-3">
            {dist.slices.map((s) => {
              const heightPct = (s.percentage / maxPct) * 100;
              return (
                <div key={s.digit} className="flex flex-1 flex-col items-center gap-1.5">
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
                  <span className="text-muted-foreground tabular-nums text-[10px]">
                    {s.percentage}%
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-muted-foreground mt-4 text-center text-xs">
            {t('totalLetters', { n: dist.totalLetters })}
          </p>
        </div>

        <Explainer title={t('explainerLearnMore')} body={t('explainer')} />
      </section>

      {/* Dominant + absent quick reads */}
      <section className="grid gap-3 sm:grid-cols-2">
        <div className="border-border rounded-2xl border bg-white/40 p-5 dark:bg-neutral-900/40">
          <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.18em]">
            {t('dominantLabel')}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {dist.dominant.map((d) => (
              <span
                key={d}
                className="font-serif inline-flex h-9 w-9 items-center justify-center rounded-full text-base font-semibold text-white"
                style={{ backgroundColor: DIGIT_COLOR[d] }}
              >
                {d}
              </span>
            ))}
          </div>
        </div>

        <div className="border-border rounded-2xl border bg-white/40 p-5 dark:bg-neutral-900/40">
          <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.18em]">
            {t('absentLabel')}
          </p>
          {dist.absent.length > 0 ? (
            <>
              <div className="mt-3 flex flex-wrap gap-2">
                {dist.absent.map((d) => (
                  <span
                    key={d}
                    className="border-border font-serif inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-dashed text-base font-semibold"
                    style={{ color: DIGIT_COLOR[d] }}
                  >
                    {d}
                  </span>
                ))}
              </div>
              <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
                {t('absentHint')}
              </p>
            </>
          ) : (
            <p className="text-muted-foreground mt-3 text-xs leading-relaxed">{t('noAbsent')}</p>
          )}
        </div>
      </section>

      {/* Talent groups (WN-style 11-group breakdown — 5 implemented). */}
      <section className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{t('groupsTitle')}</h2>
          <p className="text-muted-foreground text-sm">{t('groupsHint')}</p>
        </div>
        <div className="space-y-3">
          {(() => {
            const ratings = rateTalentGroups(dist.slices);
            const RATING_STYLE: Record<typeof ratings[number]['rating'], { dot: string; text: string; ring: string }> = {
              high: { dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300', ring: 'ring-emerald-500/20' },
              medium: { dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-300', ring: 'ring-amber-500/20' },
              low: { dot: 'bg-neutral-400', text: 'text-muted-foreground', ring: 'ring-neutral-400/15' },
            };
            return TALENT_GROUPS.map((g) => {
              const r = ratings.find((x) => x.id === g.id);
              if (!r) return null;
              const style = RATING_STYLE[r.rating];
              const ratingLabel = t(`rating${r.rating === 'high' ? 'High' : r.rating === 'medium' ? 'Medium' : 'Low'}`);
              return (
                <article
                  key={g.id}
                  className={`border-border ring-1 ${style.ring} rounded-2xl border bg-white/40 p-5 dark:bg-neutral-900/40`}
                >
                  <header className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold">{t(`groups.${g.id}.title`)}</h3>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${style.text}`}>
                      <span className={`h-2 w-2 rounded-full ${style.dot}`} aria-hidden />
                      {ratingLabel}
                      <span className="text-muted-foreground tabular-nums">
                        · {r.score}%
                      </span>
                    </span>
                  </header>
                  <p className="text-muted-foreground mb-3 text-xs leading-relaxed">
                    {t(`groups.${g.id}.subTraits`)}
                  </p>
                  <p className="text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                    {t(`groups.${g.id}.${r.rating}`)}
                  </p>
                </article>
              );
            });
          })()}
        </div>
      </section>

      {/* Career match CTA — links to the resume-upload sub-page. */}
      <section>
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
          <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden />
        </Link>
      </section>

      {/* Vocational fields (WN's "seven fields" career aptitude). */}
      <section className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{t('vocationsTitle')}</h2>
          <p className="text-muted-foreground text-sm">{t('vocationsHint')}</p>
        </div>
        <div className="space-y-3">
          {(() => {
            const ratings = rateVocations(dist.slices);
            const RATING_STYLE: Record<typeof ratings[number]['rating'], { dot: string; text: string; ring: string }> = {
              high: { dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300', ring: 'ring-emerald-500/20' },
              medium: { dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-300', ring: 'ring-amber-500/20' },
              low: { dot: 'bg-neutral-400', text: 'text-muted-foreground', ring: 'ring-neutral-400/15' },
            };
            return TALENT_VOCATIONS.map((v) => {
              const r = ratings.find((x) => x.id === v.id);
              if (!r) return null;
              const style = RATING_STYLE[r.rating];
              const ratingLabel = t(`rating${r.rating === 'high' ? 'High' : r.rating === 'medium' ? 'Medium' : 'Low'}`);
              return (
                <article
                  key={v.id}
                  className={`border-border ring-1 ${style.ring} rounded-2xl border bg-white/40 p-5 dark:bg-neutral-900/40`}
                >
                  <header className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold">{t(`vocations.${v.id}.title`)}</h3>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${style.text}`}>
                      <span className={`h-2 w-2 rounded-full ${style.dot}`} aria-hidden />
                      {ratingLabel}
                      <span className="text-muted-foreground tabular-nums">
                        · {r.score}%
                      </span>
                    </span>
                  </header>
                  <p className="text-muted-foreground mb-3 text-xs leading-relaxed">
                    {t(`vocations.${v.id}.subTraits`)}
                  </p>
                  <p className="text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                    {t(`vocations.${v.id}.${r.rating}`)}
                  </p>
                </article>
              );
            });
          })()}
        </div>
      </section>

      {/* Traits per digit */}
      <section className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{t('traitsTitle')}</h2>
          <p className="text-muted-foreground text-sm">{t('traitsHint')}</p>
        </div>

        <div className="space-y-3">
          {[...dist.slices].sort((a, b) => a.rank - b.rank).map((s) => {
            const positive = trait(s.digit, 'positive');
            const shadow = trait(s.digit, 'shadow');
            const muted = s.letterCount === 0;
            return (
              <details
                key={s.digit}
                className="border-border group overflow-hidden rounded-2xl border bg-white/40 dark:bg-neutral-900/40"
              >
                <summary className="press-soft flex cursor-pointer list-none items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
                  <span
                    className="text-muted-foreground font-mono w-6 shrink-0 text-center text-xs font-semibold tabular-nums"
                    aria-label={t('rankLabel', { n: s.rank })}
                  >
                    #{s.rank}
                  </span>
                  <span
                    className={`font-serif inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-semibold ${
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
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold tabular-nums">
                      {s.percentage}%
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {positive ?? t('comingSoon')}
                    </p>
                  </div>
                  <svg
                    className="text-muted-foreground h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </summary>
                <div className="border-border/60 space-y-3 border-t px-5 py-4 text-sm">
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
      </section>
    </main>
  );
}
