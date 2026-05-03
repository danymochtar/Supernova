import Link from 'next/link';
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

  // Personal Year forecast — current year + next 8 (full 9-year cycle).
  const yearForecast = Array.from({ length: 9 }, (_, i) => {
    const year = ctx.year + i;
    return {
      year,
      isCurrent: i === 0,
      result: personalYear(profile.dob, year),
    };
  });

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

  return (
    <main className="container max-w-4xl space-y-12 py-10">
      <header className="space-y-2">
        <Link
          href={`/${locale}/dashboard`}
          className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
        >
          ← {t('backToDashboard')}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle', { age })}</p>
      </header>

      {/* Personal Year forecast */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{t('forecastTitle')}</h2>
          <p className="text-muted-foreground text-sm">{t('forecastSubtitle')}</p>
        </div>
        <div className="space-y-3">
          {yearForecast.map((y) => {
            const meaning = meaningFor('personalYear', y.result, locale);
            return (
              <article
                key={y.year}
                className={`border-border rounded-xl border p-4 transition ${
                  y.isCurrent ? 'bg-primary/5 ring-primary/30 ring-1' : 'bg-white/40 dark:bg-neutral-900/40'
                }`}
              >
                <header className="flex flex-wrap items-baseline justify-between gap-3">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-lg font-semibold tabular-nums">{y.year}</span>
                    {y.isCurrent ? (
                      <span className="text-primary text-[10px] font-medium uppercase tracking-wider">
                        {t('thisYear')}
                      </span>
                    ) : null}
                  </div>
                  <CompoundReduced result={y.result} locale={locale} size="sm" />
                </header>
                {meaning ? (
                  <p className="mt-2 text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                    {meaning}
                  </p>
                ) : (
                  <p className="text-muted-foreground mt-2 text-sm italic">{t('comingSoon')}</p>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* Life stages — Pinnacles + Challenges */}
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
