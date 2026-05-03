import { redirect, notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getSession } from '@/lib/auth/requireSession';
import { getPerson } from '@/lib/db/repositories/person';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { buildCoreProfile, type NumerologyResult } from '@/lib/numerology';
import { compatibilityNarrative } from '@/lib/compatibility/lookup';
import { compatibilityScore } from '@/lib/compatibility/score';
import { detectPatterns } from '@/lib/compatibility/patterns';
import { CompoundReduced } from '@/components/numerology/CompoundReduced';
import { TopBar } from '@/components/layout/TopBar';

interface Pairing {
  labelKey: 'lifePath' | 'expression' | 'soulUrge' | 'birthday';
  a: NumerologyResult;
  b: NumerologyResult;
  score: number;
}

const TONE_STYLES: Record<'harmony' | 'tension' | 'neutral', string> = {
  harmony: 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/20',
  tension: 'border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20',
  neutral: 'border-border bg-white/40 dark:bg-neutral-900/40',
};

export default async function CompatibilityPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id';
  const t = await getTranslations({ locale, namespace: 'compatibility' });
  const tDash = await getTranslations({ locale, namespace: 'dashboard' });

  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const userProfile = await getProfileByUserId(session.user.id);
  if (!userProfile) redirect(`/${locale}/welcome`);

  const person = await getPerson(session.user.id, params.id);
  if (!person) notFound();

  const me = buildCoreProfile(userProfile.fullName, userProfile.dob);
  const them = buildCoreProfile(person.fullName, person.dob);

  const score = compatibilityScore(me, them);
  const patterns = detectPatterns(me, them, locale);

  const pairings: Pairing[] = [
    { labelKey: 'lifePath', a: me.lifePath, b: them.lifePath, score: score.pairs.lifePath },
    { labelKey: 'expression', a: me.expression, b: them.expression, score: score.pairs.expression },
    { labelKey: 'soulUrge', a: me.soulUrge, b: them.soulUrge, score: score.pairs.soulUrge },
    { labelKey: 'birthday', a: me.birthday, b: them.birthday, score: score.pairs.birthday },
  ];

  return (
    <main className="container max-w-3xl px-4 sm:px-6">
      <TopBar title={t('title', { name: person.fullName })} backHref={`/${locale}/people/${person.id}`} />
      <div className="space-y-8 pb-6 sm:pb-10">
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>

      {/* Score */}
      <section className="border-border space-y-4 rounded-2xl border bg-gradient-to-br from-purple-50 to-amber-50 p-6 dark:from-purple-950/30 dark:to-amber-950/30">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
              {t('scoreTitle')}
            </p>
            <p className="mt-1">
              <span className="font-mono text-5xl font-semibold tabular-nums">{score.overall}</span>
              <span className="text-muted-foreground text-base"> / 100</span>
            </p>
          </div>
          <span className="text-sm font-medium uppercase tracking-wider">
            {t(`band.${score.band}`)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
          {pairings.map((p) => (
            <div key={p.labelKey} className="space-y-1">
              <p className="text-muted-foreground text-xs">{tDash(p.labelKey)}</p>
              <p className="font-mono text-lg font-semibold tabular-nums">{p.score}</p>
              <p className="text-muted-foreground text-xs">
                <CompoundReduced result={p.a} locale={locale} size="sm" /> ×{' '}
                <CompoundReduced result={p.b} locale={locale} size="sm" />
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Detected patterns */}
      {patterns.length > 0 ? (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">{t('patternsTitle')}</h2>
            <p className="text-muted-foreground text-sm">{t('patternsSubtitle', { count: patterns.length })}</p>
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

      {/* Per-pair narratives */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">{t('pairsTitle')}</h2>
          <p className="text-muted-foreground text-sm">{t('pairsSubtitle')}</p>
        </div>
        <div className="space-y-3">
          {pairings.map((p) => {
            const narrative = compatibilityNarrative(p.a, p.b, locale);
            return (
              <article key={p.labelKey} className="border-border space-y-2 rounded-xl border p-5">
                <header className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-base font-semibold">{tDash(p.labelKey)}</h3>
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <CompoundReduced result={p.a} locale={locale} size="sm" />
                    <span className="text-xs">×</span>
                    <CompoundReduced result={p.b} locale={locale} size="sm" />
                    <span className="ml-2 font-mono text-xs tabular-nums">{p.score}/100</span>
                  </div>
                </header>
                {narrative ? (
                  <p className="text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                    {narrative}
                  </p>
                ) : (
                  <p className="text-muted-foreground text-sm italic">{t('noNarrative')}</p>
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
