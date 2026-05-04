import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ChevronRight } from 'lucide-react';
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
import { getOrGenerateRelationshipProfile } from '@/lib/ai/relationship';
import { meaningFor } from '@/lib/numerology/meanings';
import { CompoundReduced } from '@/components/numerology/CompoundReduced';
import { NumberCard } from '@/components/numerology/NumberCard';
import { TopBar } from '@/components/layout/TopBar';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export default async function PersonDetailPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id';
  const t = await getTranslations({ locale, namespace: 'personDetail' });
  const tDash = await getTranslations({ locale, namespace: 'dashboard' });
  const tCompat = await getTranslations({ locale, namespace: 'compatibility' });
  const tRel = await getTranslations({ locale, namespace: 'relationshipProfile' });

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
  const topPatterns = patterns
    .slice()
    .sort((a, b) => {
      const order: Record<string, number> = { harmony: 0, tension: 1, neutral: 2 };
      return (order[a.tone] ?? 9) - (order[b.tone] ?? 9);
    })
    .slice(0, 2);

  const minor = minorNumbers(person.nickname);
  const initials = `${person.firstName.charAt(0)}${person.lastName?.charAt(0) ?? ''}`.toUpperCase();

  // Relationship profile is AI-generated long-form prose. Cache-first.
  const relProfileText = await getOrGenerateRelationshipProfile(
    session.user.id,
    person.id,
    userProfile.preferredModel,
    {
      locale,
      relationship: person.relationship,
      meName: userProfile.fullName,
      themName: person.fullName,
      me,
      them,
    },
  );
  const relParagraphs = (relProfileText ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const relSummary = relParagraphs[0] ?? '';
  const relRest = relParagraphs.slice(1);

  // Carousel cards for ringkasan profil — five core components, each with
  // its own click-to-expand meaning (NumberCard handles that internally).
  const profileCards = [
    { key: 'lifePath' as const, label: tDash('lifePath'), result: them.lifePath },
    { key: 'expression' as const, label: tDash('expression'), result: them.expression },
    { key: 'soulUrge' as const, label: tDash('soulUrge'), result: them.soulUrge },
    { key: 'personality' as const, label: tDash('personality'), result: them.personality },
    { key: 'birthday' as const, label: tDash('birthday'), result: them.birthday },
  ];

  return (
    <main className="container max-w-2xl px-4 sm:px-6">
      <TopBar title={person.fullName} backHref={`/${locale}/people`} />
      <div className="space-y-6 pb-6 sm:pb-10">
        {/* Identity card — no buttons; Edit + Delete live on the People list */}
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
        </section>

        {person.notes ? (
          <section className="border-border rounded-xl border bg-amber-50/60 p-4 text-sm dark:border-amber-900/40 dark:bg-amber-950/20">
            <p className="text-muted-foreground mb-1 text-[11px] font-semibold uppercase tracking-wider">
              {t('notes')}
            </p>
            <p className="whitespace-pre-wrap">{person.notes}</p>
          </section>
        ) : null}

        {/* Ringkasan profil — full carousel of all 5 core components, tap a
         * card to reveal that number's meaning. Mirrors the dashboard
         * About Me carousel pattern for consistency. */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{t('profileSummary')}</h2>
          <div className="-mx-4 sm:-mx-6">
            <div className="scroll-px-4 sm:scroll-px-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {profileCards.map((card) => (
                <div key={card.key} className="w-[78%] shrink-0 snap-start sm:w-[44%] md:w-[32%]">
                  <NumberCard
                    label={card.label}
                    result={card.result}
                    locale={locale}
                    type={card.key}
                    meaning={meaningFor(card.key, card.result, locale)}
                    comingSoonLabel={tDash('meaningComingSoon')}
                  />
                </div>
              ))}
            </div>
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

        {/* Relationship profile — summary always visible, full text behind
         * a native <details> disclosure. AI-generated, cached per (person,
         * relation, locale). */}
        {relProfileText ? (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">{tRel('title', { name: person.fullName })}</h2>
            <details className="border-border group rounded-2xl border bg-white/40 p-5 dark:bg-neutral-900/40">
              <summary className="press-soft flex cursor-pointer list-none items-start justify-between gap-3 [&::-webkit-details-marker]:hidden">
                <p className="text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-200">
                  {relSummary}
                </p>
                <ChevronRight
                  className="text-muted-foreground mt-1 h-4 w-4 shrink-0 transition-transform group-open:rotate-90"
                  aria-hidden
                />
              </summary>
              {relRest.length > 0 ? (
                <div className="border-border/60 mt-4 space-y-3 border-t pt-4 text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-200">
                  {relRest.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              ) : null}
            </details>
          </section>
        ) : null}

        {/* Dinamika hubungan — single tappable card that drills into the
         * full compatibility page. */}
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
