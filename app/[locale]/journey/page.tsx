import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getSession } from '@/lib/auth/requireSession';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { isLocale, type Locale } from '@/lib/i18n/config';
import {
  ageAt,
  buildCoreProfile,
  challengeAt,
  contextFromInstant,
  cycleAt,
  essenceAt,
  essenceTimeline,
  personalYear,
  pinnacleAt,
  activeSlots,
} from '@/lib/numerology';
import { meaningFor } from '@/lib/numerology/meanings';
import type { NumerologyResult } from '@/lib/numerology';
import { CompoundReduced } from '@/components/numerology/CompoundReduced';
import { Explainer } from '@/components/layout/Explainer';

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

  // Essence Cycle (Decoz). Compute today's frame + the next ~12 years of
  // shifts so the user sees how their letters cascade.
  const essenceNames = {
    firstName: profile.firstName,
    middleName: profile.middleName,
    lastName: profile.lastName,
  };
  const essenceNow = essenceAt(essenceNames, age);
  const essenceFuture = essenceTimeline(essenceNames, age, age + 15).slice(1, 6);

  const activePinnacleSlot = slots.pinnacle;
  const activeChallengeSlot = slots.challenge;
  const activeCycleSlot = slots.cycle;
  const activePinnacle = pinnacleAt(core.pinnacles, activePinnacleSlot);
  const activeChallenge = challengeAt(core.challenges, activeChallengeSlot);
  const activeCycleResult = cycleAt(core.periodCycles, activeCycleSlot);
  const pinnacleMeaning = meaningFor('pinnacle', activePinnacle, locale);
  const cycleMeaningNow = meaningFor('cycle', activeCycleResult, locale);
  const essenceMeaning = meaningFor('essence', essenceNow.essence, locale);

  function firstSentence(s: string | null): string {
    if (!s) return '';
    // Prefer the part after the first em-dash (theme blurb in our content),
    // otherwise just the first sentence.
    const dashIdx = s.indexOf('—');
    const body = dashIdx >= 0 ? s.slice(dashIdx + 1).trim() : s;
    const period = body.indexOf('. ');
    return period > 0 ? body.slice(0, period + 1) : body;
  }

  return (
    <main className="container max-w-3xl space-y-10 px-4 py-6 sm:px-6 sm:py-10">
      <header className="pt-2">
        <h1 className="font-serif text-2xl font-semibold tracking-tight">{t('title')}</h1>
      </header>

      {/* SUMMARY HERO — year-at-a-glance across all 4 layers */}
      <section className="border-primary/40 from-primary/10 ring-primary/20 overflow-hidden rounded-2xl border-2 bg-gradient-to-br to-accent/15 ring-1 dark:to-accent/15">
        <div className="bg-gradient-to-r from-primary/15 to-accent/15 px-6 py-3">
          <p className="text-primary flex items-baseline justify-between gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
            <span>{t('summaryTitle', { year: ctx.year })}</span>
            <span className="text-muted-foreground tabular-nums normal-case tracking-normal">{t('age')} {age}</span>
          </p>
        </div>

        <div className="divide-border/60 divide-y px-6 py-5">
          <SummaryRow
            label={t('forecastTitle')}
            sub={t('cyclePosition', { current: cyclePosition, total: 9 })}
            result={thisYear.result}
            meaning={firstSentence(thisYearMeaning)}
            locale={locale}
            karmicLabel={t('karmicTag', { n: thisYear.result.karmicDebt ?? 0 })}
            showKarmic={Boolean(thisYear.result.karmicDebt)}
          />

          <SummaryRow
            label={`${tDash('pinnacle')} ${activePinnacleSlot} · ${tDash('challenge')} ${activeChallengeSlot}`}
            sub={pinnacleRows[activePinnacleSlot - 1]?.range
              ? `${t('age')} ${pinnacleRows[activePinnacleSlot - 1]!.range}`
              : ''}
            result={activePinnacle}
            secondary={activeChallenge}
            meaning={firstSentence(pinnacleMeaning)}
            locale={locale}
          />

          <SummaryRow
            label={`${tDash('cycle')} ${activeCycleSlot}`}
            sub={cycleRows[activeCycleSlot - 1]?.range
              ? `${t('age')} ${cycleRows[activeCycleSlot - 1]!.range}`
              : ''}
            result={activeCycleResult}
            meaning={firstSentence(cycleMeaningNow)}
            locale={locale}
          />

          <SummaryRow
            label={t('essenceTitle')}
            sub={essenceNow.letters}
            result={essenceNow.essence}
            meaning={firstSentence(essenceMeaning)}
            locale={locale}
            karmicLabel={t('karmicTag', { n: essenceNow.essence.karmicDebt ?? 0 })}
            showKarmic={Boolean(essenceNow.essence.karmicDebt)}
          />
        </div>
      </section>

      {/* PERSONAL YEAR — cycle dots + upcoming */}
      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">{t('forecastTitle')}</h2>
          <p className="text-muted-foreground text-sm">{t('forecastSubtitle')}</p>
          <Explainer title={t("explainerLearnMore")} body={t("personalYearExplainer")} />
        </div>

        {/* 1→9 cycle progression dots */}
        <div className="border-border space-y-1.5 rounded-xl border bg-white/40 p-4 dark:bg-neutral-900/40">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 9 }, (_, i) => {
              const pos = i + 1;
              const isHere = pos === cyclePosition;
              const isPast = pos < cyclePosition;
              return (
                <div
                  key={pos}
                  className={`h-2 flex-1 rounded-full ${
                    isHere ? 'bg-primary' : isPast ? 'bg-primary/40' : 'bg-muted'
                  }`}
                />
              );
            })}
          </div>
          <div className="text-muted-foreground flex items-center justify-between font-mono text-[10px] tabular-nums">
            <span>1</span>
            <span>9</span>
          </div>
        </div>

        {/* Upcoming years — horizontal carousel (swipe sideways) */}
        <div>
          <p className="text-muted-foreground mb-3 px-1 text-xs font-medium uppercase tracking-wider">
            {t('upcomingTitle')}
          </p>
          <div className="-mx-4 sm:-mx-6">
            <div className="scroll-px-4 sm:scroll-px-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {upcoming.map((y) => {
                const meaning = meaningFor('personalYear', y.result, locale);
                return (
                  <article
                    key={y.year}
                    className="border-border w-[80%] shrink-0 snap-start rounded-xl border bg-white/40 p-4 dark:bg-neutral-900/40 sm:w-[52%] md:w-[40%]"
                  >
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
                    {meaning ? (
                      <p className="mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                        {meaning}
                      </p>
                    ) : (
                      <p className="text-muted-foreground mt-2 text-sm italic">{t('comingSoon')}</p>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Life chapters — Pinnacles + Challenges, horizontal carousel */}
      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">{t('stagesTitle')}</h2>
          <p className="text-muted-foreground text-sm">{t('stagesSubtitle')}</p>
          <Explainer title={t("explainerLearnMore")} body={t("pinnacleExplainer")} />
        </div>
        <div className="-mx-4 sm:-mx-6">
          <div className="scroll-px-4 sm:scroll-px-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {pinnacleRows.map((row) => {
              const meaning = meaningFor('pinnacle', row.pinnacle, locale);
              return (
                <article
                  key={row.slot}
                  className={`w-[80%] shrink-0 snap-start rounded-xl border p-4 sm:w-[44%] md:w-[32%] ${
                    row.isActive
                      ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/30'
                      : 'border-border bg-white/40 dark:bg-neutral-900/40'
                  }`}
                >
                  <header className="space-y-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                        {tDash('pinnacle')} {row.slot}
                      </p>
                      {row.isActive ? (
                        <span className="text-primary text-[10px] font-semibold uppercase tracking-wider">
                          {tDash('now')}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-muted-foreground text-sm tabular-nums">
                      {t('age')} {row.range}
                    </p>
                  </header>
                  <div className="border-border/60 mt-3 flex items-center justify-between gap-3 border-t pt-3">
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-[10px] uppercase tracking-wider">
                        {tDash('pinnacle')}
                      </p>
                      <CompoundReduced result={row.pinnacle} locale={locale} size="sm" />
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-muted-foreground text-[10px] uppercase tracking-wider">
                        {tDash('challenge')}
                      </p>
                      <CompoundReduced result={row.challenge} locale={locale} size="sm" />
                    </div>
                  </div>
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
        </div>
      </section>

      {/* Period Cycles */}
      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">{t('cyclesTitle')}</h2>
          <p className="text-muted-foreground text-sm">{t('cyclesSubtitle')}</p>
          <Explainer title={t("explainerLearnMore")} body={t("cycleExplainer")} />
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

      {/* Essence Cycle — Transit letters + current Essence number */}
      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">{t('essenceTitle')}</h2>
          <p className="text-muted-foreground text-sm">{t('essenceSubtitle')}</p>
          <Explainer title={t("explainerLearnMore")} body={t("essenceExplainer")} />
        </div>

        {/* Active transit letters — compact chips, the actual essence number
         * is already shown in the summary hero up top. */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {essenceNow.physical ? (
            <TransitChip
              label={t('physicalTransit')}
              hint={t('fromFirstName', { name: profile.firstName })}
              letter={essenceNow.physical.letter}
              value={essenceNow.physical.value}
              rangeStart={essenceNow.physical.rangeStart}
              rangeEnd={essenceNow.physical.rangeEnd}
              ageLabel={t('age')}
            />
          ) : null}
          {essenceNow.mental ? (
            <TransitChip
              label={t('mentalTransit')}
              hint={t('fromMiddleName', { name: profile.middleName ?? '' })}
              letter={essenceNow.mental.letter}
              value={essenceNow.mental.value}
              rangeStart={essenceNow.mental.rangeStart}
              rangeEnd={essenceNow.mental.rangeEnd}
              ageLabel={t('age')}
            />
          ) : null}
          {essenceNow.spiritual ? (
            <TransitChip
              label={t('spiritualTransit')}
              hint={t('fromLastName', { name: profile.lastName ?? '' })}
              letter={essenceNow.spiritual.letter}
              value={essenceNow.spiritual.value}
              rangeStart={essenceNow.spiritual.rangeStart}
              rangeEnd={essenceNow.spiritual.rangeEnd}
              ageLabel={t('age')}
            />
          ) : null}
        </div>

        {!profile.middleName ? (
          <p className="text-muted-foreground text-xs italic">
            {t('noMiddleNameNote')}
          </p>
        ) : null}

        {/* Upcoming shifts — horizontal carousel */}
        {essenceFuture.length > 0 ? (
          <div>
            <p className="text-muted-foreground mb-3 px-1 text-xs font-medium uppercase tracking-wider">
              {t('upcomingShifts')}
            </p>
            <div className="-mx-4 sm:-mx-6">
              <div className="scroll-px-4 sm:scroll-px-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {essenceFuture.map((frame) => {
                  const meaning = meaningFor('essence', frame.essence, locale);
                  return (
                    <article
                      key={frame.age}
                      className="border-border w-[80%] shrink-0 snap-start rounded-xl border bg-white/40 p-4 dark:bg-neutral-900/40 sm:w-[52%] md:w-[40%]"
                    >
                      <header className="flex items-baseline justify-between gap-3">
                        <div className="flex items-baseline gap-2">
                          <span className="font-mono text-base font-semibold tabular-nums">
                            {t('age')} {frame.age}
                          </span>
                          <span className="text-muted-foreground font-serif text-sm">
                            {frame.letters}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {frame.essence.karmicDebt ? (
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                              {t('karmicTag', { n: frame.essence.karmicDebt })}
                            </span>
                          ) : null}
                          <CompoundReduced result={frame.essence} locale={locale} size="sm" />
                        </div>
                      </header>
                      {meaning ? (
                        <p className="mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                          {meaning}
                        </p>
                      ) : (
                        <p className="text-muted-foreground mt-2 text-sm italic">{t('comingSoon')}</p>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

/**
 * One row in the year-at-a-glance summary hero. Layout: label + sub on the
 * left, number (and optional secondary) on the right, single-line meaning
 * snippet underneath. Designed to be stacked into a divide-y column.
 */
function SummaryRow({
  label,
  sub,
  result,
  secondary,
  meaning,
  locale,
  showKarmic,
  karmicLabel,
}: {
  label: string;
  sub?: string;
  result: NumerologyResult;
  secondary?: NumerologyResult;
  meaning?: string;
  locale: Locale;
  showKarmic?: boolean;
  karmicLabel?: string;
}) {
  return (
    <div className="space-y-1.5 py-3 first:pt-0 last:pb-0">
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <p className="text-foreground text-sm font-medium">{label}</p>
          {sub ? <p className="text-muted-foreground text-xs tabular-nums">{sub}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {showKarmic && karmicLabel ? (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              {karmicLabel}
            </span>
          ) : null}
          {secondary ? (
            <CompoundReduced result={secondary} locale={locale} size="sm" />
          ) : null}
          <CompoundReduced result={result} locale={locale} size="sm" />
        </div>
      </div>
      {meaning ? (
        <p className="text-muted-foreground text-xs leading-relaxed">{meaning}</p>
      ) : null}
    </div>
  );
}

function TransitChip({
  label,
  hint,
  letter,
  value,
  rangeStart,
  rangeEnd,
  ageLabel,
}: {
  label: string;
  hint: string;
  letter: string;
  value: number;
  rangeStart: number;
  rangeEnd: number;
  ageLabel: string;
}) {
  return (
    <div className="border-border rounded-xl border bg-white/60 p-4 dark:bg-neutral-900/60">
      <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.18em]">
        {label}
      </p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-serif text-3xl font-semibold tracking-tight">{letter}</span>
        <span className="text-muted-foreground font-mono text-sm tabular-nums">= {value}</span>
      </div>
      <p className="text-muted-foreground mt-1 text-xs tabular-nums">
        {ageLabel} {rangeStart}–{rangeEnd}
      </p>
      <p className="text-muted-foreground mt-1 truncate text-[10px]">{hint}</p>
    </div>
  );
}
