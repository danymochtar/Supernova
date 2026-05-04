import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ChevronRight, Heart, Pencil, Sparkles } from 'lucide-react';
import { getSession } from '@/lib/auth/requireSession';
import { getPerson } from '@/lib/db/repositories/person';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { isLocale, type Locale } from '@/lib/i18n/config';
import {
  ageAt,
  buildCoreProfile,
  contextFromInstant,
  minorNumbers,
} from '@/lib/numerology';
import { compatibilityScore } from '@/lib/compatibility/score';
import { detectPatterns } from '@/lib/compatibility/patterns';
import { CompoundReduced } from '@/components/numerology/CompoundReduced';
import { TopBar } from '@/components/layout/TopBar';

export default async function PersonDetailPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id';
  const t = await getTranslations({ locale, namespace: 'personDetail' });
  const tDash = await getTranslations({ locale, namespace: 'dashboard' });
  const tCompat = await getTranslations({ locale, namespace: 'compatibility' });

  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const userProfile = await getProfileByUserId(session.user.id);
  if (!userProfile) redirect(`/${locale}/welcome`);

  const person = await getPerson(session.user.id, params.id);
  if (!person) notFound();

  const me = buildCoreProfile(userProfile.fullName, userProfile.dob);
  const them = buildCoreProfile(person.fullName, person.dob);
  const ctx = contextFromInstant(new Date(), userProfile.timezone);
  const age = ageAt(person.dob, ctx);

  const score = compatibilityScore(me, them, person.relationship);
  const patterns = detectPatterns(me, them, locale, person.relationship);
  // Top 2 patterns: prefer harmony first, then tension, then neutral.
  const topPatterns = patterns
    .slice()
    .sort((a, b) => {
      const order: Record<string, number> = { harmony: 0, tension: 1, neutral: 2 };
      return (order[a.tone] ?? 9) - (order[b.tone] ?? 9);
    })
    .slice(0, 2);

  const minor = minorNumbers(person.nickname);
  const initials = `${person.firstName.charAt(0)}${person.lastName?.charAt(0) ?? ''}`.toUpperCase();

  return (
    <main className="container max-w-2xl px-4 sm:px-6">
      <TopBar title={person.fullName} backHref={`/${locale}/people`} />
      <div className="space-y-6 pb-6 sm:pb-10">
        {/* Identity card */}
        <section className="border-border flex flex-col items-center gap-3 rounded-2xl border bg-white/40 p-6 text-center dark:bg-neutral-900/40">
          <div
            className="from-primary/30 to-accent/30 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br font-serif text-3xl font-semibold tracking-tight"
            aria-hidden
          >
            {initials}
          </div>
          <div className="space-y-0.5">
            <p className="text-lg font-semibold">{person.fullName}</p>
            <p className="text-muted-foreground text-sm">
              {t(`relationship.${person.relationship}`)} · {t('age', { age })}
              {' · '}
              <span className="tabular-nums">
                {person.dob.year}-{String(person.dob.month).padStart(2, '0')}-
                {String(person.dob.day).padStart(2, '0')}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <Link
              href={`/${locale}/people/${person.id}/profile`}
              className="bg-primary text-primary-foreground press inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {t('relationshipProfileCta')}
            </Link>
            <Link
              href={`/${locale}/people/${person.id}/compatibility`}
              className="border-border press inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium"
            >
              <Heart className="h-3.5 w-3.5" aria-hidden />
              {t('compatibilityCta')}
            </Link>
            <Link
              href={`/${locale}/people/${person.id}/edit`}
              className="text-muted-foreground hover:bg-muted/50 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs"
            >
              <Pencil className="h-3 w-3" aria-hidden />
              {t('edit')}
            </Link>
          </div>
        </section>

        {person.notes ? (
          <section className="border-border rounded-xl border bg-amber-50/60 p-4 text-sm dark:border-amber-900/40 dark:bg-amber-950/20">
            <p className="text-muted-foreground mb-1 text-[11px] font-semibold uppercase tracking-wider">
              {t('notes')}
            </p>
            <p className="whitespace-pre-wrap">{person.notes}</p>
          </section>
        ) : null}

        {/* Profile summary — just the key numbers, no deep dive */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{t('profileSummary')}</h2>
          <div className="border-border grid grid-cols-3 gap-2 rounded-xl border bg-white/40 p-4 dark:bg-neutral-900/40">
            <SummaryNumber label={tDash('lifePath')} result={them.lifePath} locale={locale} />
            <SummaryNumber label={tDash('expression')} result={them.expression} locale={locale} />
            <SummaryNumber label={tDash('soulUrge')} result={them.soulUrge} locale={locale} />
          </div>
          {minor ? (
            <div className="border-border rounded-xl border bg-white/40 p-4 dark:bg-neutral-900/40">
              <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.18em]">
                {t('minorHeading')} ·{' '}
                <span className="text-foreground font-serif italic normal-case tracking-normal">
                  {minor.source}
                </span>
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <SummaryNumber label={t('minorExpression')} result={minor.minorExpression} locale={locale} />
                <SummaryNumber label={t('minorSoulUrge')} result={minor.minorSoulUrge} locale={locale} />
                <SummaryNumber label={t('minorPersonality')} result={minor.minorPersonality} locale={locale} />
              </div>
            </div>
          ) : null}
        </section>

        {/* Relationship dynamic — score teaser + top patterns + CTA into the deep page */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{t('dynamicTitle')}</h2>
          <Link
            href={`/${locale}/people/${person.id}/compatibility`}
            className="border-border press-soft hover:bg-muted/30 group block rounded-2xl border bg-white/40 p-5 dark:bg-neutral-900/40"
          >
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  {tCompat('scoreTitle')}
                </p>
                <p className="mt-1">
                  <span className="font-mono text-3xl font-semibold tabular-nums">
                    {score.overall}
                  </span>
                  <span className="text-muted-foreground text-sm"> / 100</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium uppercase tracking-wider">
                  {tCompat(`band.${score.band}`)}
                </p>
                <ChevronRight className="text-muted-foreground ml-auto mt-1 h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
              </div>
            </div>

            {topPatterns.length > 0 ? (
              <div className="border-border/60 mt-4 space-y-2 border-t pt-4">
                {topPatterns.map((p) => (
                  <div key={p.key} className="space-y-0.5">
                    <p className="flex items-baseline gap-2 text-sm font-medium">
                      <span
                        className={`inline-block h-1.5 w-1.5 rounded-full ${
                          p.tone === 'harmony'
                            ? 'bg-emerald-500'
                            : p.tone === 'tension'
                              ? 'bg-amber-500'
                              : 'bg-muted-foreground/50'
                        }`}
                        aria-hidden
                      />
                      {p.title}
                    </p>
                    <p className="text-muted-foreground line-clamp-2 pl-3.5 text-xs leading-relaxed">
                      {p.body}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </Link>
        </section>
      </div>
    </main>
  );
}

function SummaryNumber({
  label,
  result,
  locale,
}: {
  label: string;
  result: { compound: number; reduced: number; isMaster: boolean; karmicDebt?: 13 | 14 | 16 | 19 };
  locale: Locale;
}) {
  return (
    <div className="space-y-1 text-center">
      <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wide">{label}</p>
      <CompoundReduced result={result} locale={locale} size="sm" />
    </div>
  );
}
