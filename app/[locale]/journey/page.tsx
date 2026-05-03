import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ChevronDown } from 'lucide-react';
import { getSession } from '@/lib/auth/requireSession';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { isLocale, type Locale } from '@/lib/i18n/config';
import {
  ageAt,
  buildCoreProfile,
  challengeAt,
  contextFromInstant,
  cycleAt,
  personalYear,
  pinnacleAt,
  activeSlots,
} from '@/lib/numerology';
import { meaningFor } from '@/lib/numerology/meanings';
import { CompoundReduced } from '@/components/numerology/CompoundReduced';

export default async function JourneyPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id';
  const t = await getTranslations({ locale, namespace: 'journey' });
  const tDash = await getTranslations({ locale, namespace: 'dashboard' });

  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const profile = await getProfileByUserId(session.user.id);
  if (!profile) redirect(`/${locale}/welcome`);

  const core = buildCoreProfile(profile.fullName, profile.dob);
  const ctx = contextFromInstant(new Date(), profile.timezone);
  const age = ageAt(profile.dob, ctx);
  const slots = activeSlots(profile.dob, age);

  // Personal Year forecast — current + next 8 (one full 9-year cycle).
  const thisYearPy = personalYear(profile.dob, ctx.year);
  // Cycle position: PY value IS the position in the natural 1→9 cycle.
  const cyclePosition = thisYearPy.reduced;

  // Build the "rest of this cycle" — years from now until PY hits 9, then a
  // fresh cycle preview after.
  const yearForecast = Array.from({ length: 9 }, (_, i) => {
    const year = ctx.year + i;
    const result = personalYear(profile.dob, year);
    return { year, result, isCurrent: i === 0, position: result.reduced };
  });
  const thisYear = yearForecast[0]!;
  const upcoming = yearForecast.slice(1);

  const [b1, b2, b3] = core.pinnacles.ageBoundaries;
  const [c1, c2] = core.periodCycles.ageBoundaries;

  const pinnacleRows = ([1, 2, 3, 4] as const).map((slot) => ({
    slot,
    range: slot === 1 ? `0–${b1 - 1}` : slot === 2 ? `${b1}–${b2 - 1}` : slot === 3 ? `${b2}–${b3 - 1}` : `${b3}+`,
    pinnacle: pinnacleAt(core.pinnacles, slot),
    challenge: challengeAt(core.challenges, slot),
    isActive: slot === slots.pinnacle,
  }));

  const cycleRows = ([1, 2, 3] as const).map((slot) => ({
    slot,
    range: slot === 1 ? `0–${c1 - 1}` : slot === 2 ? `${c1}–${c2 - 1}` : `${c2}+`,
    cycle: cycleAt(core.periodCycles, slot),
    isActive: slot === slots.cycle,
  }));

  const thisYearMeaning = meaningFor('personalYear', thisYear.result, locale);

  return (
    <main className="container max-w-3xl space-y-10 px-4 py-6 sm:px-6 sm:py-10">
      <header className="space-y-1 pt-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle', { age })}</p>
      </header>

      {/* THIS YEAR — hero card with cycle position dots */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{t('forecastTitle')}</h2>
          <p className="text-muted-foreground text-sm">{t('forecastSubtitle')}</p>
        </div>

        <article className="border-primary/40 from-primary/10 ring-primary/20 relative overflow-hidden rounded-2xl border-2 bg-gradient-to-br to-amber-100/40 p-6 ring-1 dark:to-amber-950/30">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-primary text-xs font-semibold uppercase tracking-wider">
              {t('thisYear')} · {thisYear.year}
            </p>
            <p className="text-muted-foreground text-xs font-medium tabular-nums">
              {t('cyclePosition', { current: cyclePosition, total: 9 })}
            </p>
          </div>
          <div className="mt-3">
            <CompoundReduced result={thisYear.result} locale={locale} size="lg" />
          </div>

          {/* 1→9 cycle progression dots */}
          <div className="mt-4 flex items-center gap-1.5">
            {Array.from({ length: 9 }, (_, i) => {
              const pos = i + 1;
              const isHere = pos === cyclePosition;
              const isPast = pos < cyclePosition;
              return (
                <div key={pos} className="flex flex-1 items-center gap-1.5">
                  <div
                    className={`h-2 flex-1 rounded-full ${
                      isHere ? 'bg-primary' : isPast ? 'bg-primary/40' : 'bg-muted'
                    }`}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-muted-foreground tabular-nums">
            <span>1</span>
            <span>9</span>
          </div>

          {thisYearMeaning ? (
            <p className="mt-4 text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
              {thisYearMeaning}
            </p>
          ) : null}
        </article>

        {/* Upcoming years timeline — compact cards with arrows between */}
        <div>
          <p className="text-muted-foreground mb-3 text-xs font-medium uppercase tracking-wider">
            {t('upcomingTitle')}
          </p>
          <ol className="space-y-1">
            {upcoming.map((y) => {
              const meaning = meaningFor('personalYear', y.result, locale);
              const blurb = meaning ? meaning.split('. ')[0] + '.' : null;
              return (
                <li key={y.year}>
                  <div className="flex justify-center py-1">
                    <ChevronDown className="text-muted-foreground/50 h-4 w-4" aria-hidden />
                  </div>
                  <article className="border-border rounded-xl border bg-white/40 p-4 dark:bg-neutral-900/40">
                    <header className="flex items-baseline justify-between gap-3">
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-base font-semibold tabular-nums">
                          {y.year}
                        </span>
                        <span className="text-muted-foreground text-[10px] tabular-nums">
                          {t('cyclePositionShort', { pos: y.position })}
                        </span>
                      </div>
                      <CompoundReduced result={y.result} locale={locale} size="sm" />
                    </header>
                    {blurb ? (
                      <p className="mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                        {blurb}
                      </p>
                    ) : null}
                  </article>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Life chapters — Pinnacles + Challenges */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{t('stagesTitle')}</h2>
          <p className="text-muted-foreground text-sm">{t('stagesSubtitle')}</p>
        </div>
        <div className="space-y-3">
          {pinnacleRows.map((row) => {
            const meaning = meaningFor('pinnacle', row.pinnacle, locale);
            return (
              <article
                key={row.slot}
                className={`border-border rounded-xl border p-4 ${
                  row.isActive ? 'bg-primary/5 ring-primary/30 ring-1' : 'bg-white/40 dark:bg-neutral-900/40'
                }`}
              >
                <header className="flex flex-wrap items-baseline justify-between gap-3">
                  <div>
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                      {tDash('pinnacle')} {row.slot}
                    </p>
                    <p className="text-muted-foreground tabular-nums text-sm">
                      {t('age')} {row.range}
                      {row.isActive ? (
                        <span className="text-primary ml-2 text-[10px] uppercase tracking-wider">
                          {tDash('now')}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground text-xs">{tDash('pinnacle')}</span>
                      <CompoundReduced result={row.pinnacle} locale={locale} size="sm" />
                    </div>
                    <div className="mt-1 flex items-center gap-3">
                      <span className="text-muted-foreground text-xs">{tDash('challenge')}</span>
                      <CompoundReduced result={row.challenge} locale={locale} size="sm" />
                    </div>
                  </div>
                </header>
                {meaning ? (
                  <p className="mt-3 text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                    {meaning}
                  </p>
                ) : (
                  <p className="text-muted-foreground mt-3 text-sm italic">{t('comingSoon')}</p>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* Period Cycles */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{t('cyclesTitle')}</h2>
          <p className="text-muted-foreground text-sm">{t('cyclesSubtitle')}</p>
        </div>
        <div className="border-border overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-2 text-left font-medium">{tDash('cycle')}</th>
                <th className="px-4 py-2 text-left font-medium">{tDash('ageRange')}</th>
                <th className="px-4 py-2 text-left font-medium">{tDash('number')}</th>
              </tr>
            </thead>
            <tbody>
              {cycleRows.map((row) => (
                <tr key={row.slot} className={`border-t ${row.isActive ? 'bg-primary/5' : ''}`}>
                  <td className="px-4 py-3 font-medium">
                    {row.slot}
                    {row.isActive ? (
                      <span className="text-primary ml-2 text-[10px] uppercase tracking-wider">
                        {tDash('now')}
                      </span>
                    ) : null}
                  </td>
                  <td className="text-muted-foreground px-4 py-3 tabular-nums">{row.range}</td>
                  <td className="px-4 py-3">
                    <CompoundReduced result={row.cycle} locale={locale} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
