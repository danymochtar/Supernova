import { redirect, notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getSession } from '@/lib/auth/requireSession';
import { getPerson } from '@/lib/db/repositories/person';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { buildCoreProfile } from '@/lib/numerology';
import { compatibilityScore, type LaneScore } from '@/lib/compatibility/score';
import { renderInlineMd } from '@/components/qa/inlineMd';
import { detectPatterns } from '@/lib/compatibility/patterns';
import type { CoreKey } from '@/lib/compatibility/lens';
import { getOrGeneratePairNarratives } from '@/lib/ai/relationship';
import { CompoundReduced } from '@/components/numerology/CompoundReduced';
import { TopBar } from '@/components/layout/TopBar';

// AI narratives generation can take 15-25s on cold cache.
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const TONE_STYLES: Record<'harmony' | 'tension' | 'neutral', string> = {
  harmony: 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/20',
  tension: 'border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20',
  neutral: 'border-border bg-surface-1',
};

const LANE_BAR_COLORS: Record<'harmony' | 'tension' | 'neutral', string> = {
  harmony: 'bg-emerald-500',
  tension: 'bg-amber-500',
  neutral: 'bg-primary/70',
};

function laneTone(score: number): 'harmony' | 'tension' | 'neutral' {
  if (score >= 70) return 'harmony';
  if (score <= 50) return 'tension';
  return 'neutral';
}

function laneLabel(
  meKey: CoreKey,
  themKey: CoreKey,
  cross: boolean,
  tDash: (key: string) => string,
  tComp: (key: string, params?: Record<string, string>) => string,
): string {
  if (!cross) return tDash(meKey);
  return tComp('crossLabel', { me: tDash(meKey), them: tDash(themKey) });
}

export default async function CompatibilityPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id';
  const t = await getTranslations({ locale, namespace: 'compatibility' });
  const tDash = await getTranslations({ locale, namespace: 'dashboard' });
  const tRel = await getTranslations({ locale, namespace: 'people.relationship' });

  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const userProfile = await getProfileByUserId(session.user.id);
  if (!userProfile) redirect(`/${locale}/welcome`);

  const person = await getPerson(session.user.id, params.id);
  if (!person) notFound();

  const me = buildCoreProfile(userProfile.fullName, userProfile.dob);
  const them = buildCoreProfile(person.fullName, person.dob);

  const score = compatibilityScore(me, them, person.relationship);
  const patterns = detectPatterns(me, them, locale, person.relationship);

  const narratives = await getOrGeneratePairNarratives(
    session.user.id,
    person.id,
    userProfile.preferredModel,
    {
      locale,
      relationship: person.relationship,
      meName: userProfile.fullName,
      themName: person.fullName,
      lanes: score.lanes,
      patternTitles: patterns.map((p) => p.title),
    },
  );

  return (
    <main className="container max-w-3xl px-4 sm:px-6">
      <TopBar
        title={t('title', { name: person.fullName })}
        backHref={`/${locale}/people/${person.id}`}
      />
      <div className="space-y-8 pb-6 sm:pb-10">
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>

        {/* Lens explainer — what we count and why for this relationship */}
        <section className="border-border rounded-2xl border bg-surface-1 p-5">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
            {t('lensTitle')}
          </p>
          <p className="mt-1 text-sm font-semibold">
            {tRel(person.relationship)}
          </p>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {t(`lens.${person.relationship}`)}
          </p>
        </section>

        {/* Score */}
        <section className="border-border space-y-4 rounded-2xl border bg-gradient-to-br from-primary/5 to-accent/5 p-6 dark:from-primary/15 dark:to-accent/15">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                {t('scoreTitle')}
              </p>
              <p className="mt-1">
                <span className="font-mono text-5xl font-semibold tabular-nums">
                  {score.overall}
                </span>
                <span className="text-muted-foreground text-base"> / 100</span>
              </p>
            </div>
            <span className="text-sm font-medium uppercase tracking-wider">
              {t(`band.${score.band}`)}
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {score.lanes.map((lane: LaneScore) => {
              const tone = laneTone(lane.score);
              const weightPct = Math.round(lane.weight * 100);
              return (
                <div key={lane.key} className="space-y-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium">
                      {laneLabel(lane.meKey, lane.themKey, lane.cross, tDash, t)}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      <span className="font-mono tabular-nums">{lane.score}</span>
                      <span className="ml-2">· {weightPct}%</span>
                    </p>
                  </div>
                  <div className="bg-border/50 relative h-1.5 overflow-hidden rounded-full">
                    <div
                      className={`absolute left-0 top-0 h-full rounded-full ${LANE_BAR_COLORS[tone]}`}
                      style={{ width: `${lane.score}%` }}
                    />
                  </div>
                  <p className="text-muted-foreground text-xs">
                    <CompoundReduced result={lane.meResult} locale={locale} size="sm" />{' '}
                    × <CompoundReduced result={lane.themResult} locale={locale} size="sm" />
                  </p>
                </div>
              );
            })}
          </div>

          {score.modifiers.length > 0 ? (
            <div className="border-border/60 mt-2 space-y-1 border-t pt-3 text-xs">
              <p className="text-muted-foreground font-medium uppercase tracking-wider">
                {t('modifiersTitle')}
              </p>
              {score.modifiers.map((m) => (
                <p key={m.reason} className="text-muted-foreground flex justify-between">
                  <span>{t(`modifier.${m.reason}`)}</span>
                  <span className="font-mono tabular-nums">
                    {m.delta > 0 ? `+${m.delta}` : m.delta}
                  </span>
                </p>
              ))}
            </div>
          ) : null}
        </section>

        {/* Detected patterns */}
        {patterns.length > 0 ? (
          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">{t('patternsTitle')}</h2>
              <p className="text-muted-foreground text-sm">
                {t('patternsSubtitle', { count: patterns.length })}
              </p>
            </div>
            <div className="space-y-3">
              {patterns.map((p) => (
                <article
                  key={p.key}
                  className={`space-y-1.5 rounded-xl border p-4 ${TONE_STYLES[p.tone]}`}
                >
                  <header className="flex items-baseline justify-between gap-2">
                    <h3 className="text-sm font-semibold">{p.title}</h3>
                    <span className="text-muted-foreground text-[10px] uppercase tracking-wider">
                      {t(`tone.${p.tone}`)}
                    </span>
                  </header>
                  <p className="text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                    {p.body}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {/* Per-pair narratives — AI-generated, covers same + cross lanes */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">{t('pairsTitle')}</h2>
            <p className="text-muted-foreground text-sm">{t('pairsSubtitle')}</p>
          </div>
          <div className="space-y-3">
            {score.lanes.map((lane) => {
              const narrative = narratives[lane.key];
              return (
                <article
                  key={lane.key}
                  className="border-border space-y-2 rounded-xl border p-5"
                >
                  <header className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-base font-semibold">
                      {laneLabel(lane.meKey, lane.themKey, lane.cross, tDash, t)}
                    </h3>
                    <div className="text-muted-foreground flex items-center gap-2 text-sm">
                      <CompoundReduced result={lane.meResult} locale={locale} size="sm" />
                      <span className="text-xs">×</span>
                      <CompoundReduced result={lane.themResult} locale={locale} size="sm" />
                      <span className="ml-2 font-mono text-xs tabular-nums">{lane.score}/100</span>
                    </div>
                  </header>
                  {narrative ? (
                    <p className="text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                      {renderInlineMd(narrative)}
                    </p>
                  ) : (
                    <p className="text-muted-foreground text-sm italic">{t('narrativePending')}</p>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <p className="text-muted-foreground text-xs">{t('disclaimer')}</p>
      </div>
    </main>
  );
}
