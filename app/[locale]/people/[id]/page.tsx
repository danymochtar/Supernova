import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ChevronRight, Pencil, HeartHandshake } from 'lucide-react';
import { getSession } from '@/lib/auth/requireSession';
import { getPerson } from '@/lib/db/repositories/person';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { isLocale, type Locale } from '@/lib/i18n/config';
import {
  ageAt,
  bridges,
  buildCoreProfile,
  contextFromInstant,
  minorNumbers,
} from '@/lib/numerology';
import { compareToParent } from '@/lib/numerology/familyTree';
import { compatibilityScore } from '@/lib/compatibility/score';
import { getOrGenerateRelationshipProfile } from '@/lib/ai/relationship';
import { meaningFor } from '@/lib/numerology/meanings';
import idFamily from '@/content/family/id.json';
import enFamily from '@/content/family/en.json';
import { NumberCard } from '@/components/numerology/NumberCard';
import { TopBar } from '@/components/layout/TopBar';
import { Explainer } from '@/components/layout/Explainer';
import { renderInlineMd } from '@/components/qa/inlineMd';
import { PersonVibeButton } from '@/components/people/PersonVibeButton';
import { DeletePersonButton } from '@/components/people/DeletePersonButton';
import { getPersonVibeForDay } from '@/lib/db/repositories/personDailyVibe';
import { deletePersonAction, generatePersonVibeAction } from '../actions';

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

  const minor = minorNumbers(person.nickname);
  const bridge = bridges(them);
  const initials = `${person.firstName.charAt(0)}${person.lastName?.charAt(0) ?? ''}`.toUpperCase();

  // Family Tree overlay — only meaningful when this Person is a parent. We
  // surface (a) reduced numbers present in both charts and (b) parent core
  // numbers that intersect the user's karmic lessons.
  const familyMatches = person.relationship === 'PARENT' ? compareToParent(me, them) : null;
  const familyCopy = (locale === 'id' ? idFamily : enFamily) as Record<string, string>;

  // Vibe-of-the-day for this Person — read-only check for a cached row so the
  // tap button surfaces instantly if today's briefing already ran. Generation
  // itself only happens on user tap, never on render.
  const cachedVibe = await getPersonVibeForDay(session.user.id, person.id, ctx.year, ctx.month, ctx.day);
  const cachedVibeBody = cachedVibe && cachedVibe.locale === locale ? cachedVibe.body : null;

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
        {/* Identity hero — gradient brand card matching the talents/journey
         * hero language. Bigger avatar, name in serif, relationship as
         * eyebrow + age/DOB on the meta line. */}
        <section className="border-primary/40 from-primary/10 ring-primary/20 overflow-hidden rounded-3xl border-2 bg-gradient-to-br to-accent/15 p-6 ring-1 dark:to-accent/15">
          <div className="flex items-center gap-4">
            <div
              className="from-primary/40 to-accent/40 ring-primary/20 flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-serif text-xl font-semibold tracking-tight ring-1"
              aria-hidden
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-primary text-[11px] font-semibold uppercase tracking-[0.18em]">
                {t(`relationship.${person.relationship}`)}
              </p>
              <p className="font-serif truncate text-xl font-semibold leading-tight tracking-tight sm:text-2xl">
                {person.fullName}
              </p>
              <p className="text-muted-foreground text-xs">
                {t('age', { age })}
                {' · '}
                <span className="tabular-nums">
                  {person.dob.year}-{String(person.dob.month).padStart(2, '0')}-
                  {String(person.dob.day).padStart(2, '0')}
                </span>
              </p>
            </div>
          </div>
        </section>

        {/* Compat at-a-glance — soft brand gradient + heart icon. Score
         * + band + chevron only; patterns live on the /compatibility
         * detail page. */}
        <Link
          href={`/${locale}/people/${person.id}/compatibility`}
          className="border-border press-soft hover:bg-muted/40 group flex items-center gap-4 rounded-2xl border bg-gradient-to-br from-primary/5 to-accent/5 p-5 transition dark:from-primary/15 dark:to-accent/15"
        >
          <div className="bg-primary/15 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
            <HeartHandshake className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.18em]">
              {tCompat('scoreTitle')}
            </p>
            <p className="mt-1 flex items-baseline gap-2">
              <span className="font-serif text-3xl font-semibold tabular-nums">
                {score.overall}
              </span>
              <span className="text-muted-foreground text-xs">/ 100</span>
              <span className="text-primary ml-auto text-xs font-semibold uppercase tracking-wider">
                {tCompat(`band.${score.band}`)}
              </span>
            </p>
          </div>
          <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0 transition group-hover:translate-x-0.5" aria-hidden />
        </Link>

        {person.notes ? (
          <section className="border-border rounded-xl border bg-amber-50/60 p-4 text-sm dark:border-amber-900/40 dark:bg-amber-950/20">
            <p className="text-muted-foreground mb-1 text-[11px] font-semibold uppercase tracking-wider">
              {t('notes')}
            </p>
            <p className="whitespace-pre-wrap">{person.notes}</p>
          </section>
        ) : null}

        {/* AI body split into two flat cards: portrait ("Ringkasan profil")
         * + relational dynamics ("Profil hubungan…"). Two boxes read
         * cleaner than one collapsed block — user always sees both. */}
        {relSummary ? (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">{t('profileSummary')}</h2>
            <div className="border-border rounded-2xl border bg-surface-1 p-5">
              <p className="text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-200">
                {renderInlineMd(relSummary)}
              </p>
            </div>
          </section>
        ) : null}

        {relRest.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">{tRel('title', { name: person.fullName })}</h2>
            <div className="border-border space-y-3 rounded-2xl border bg-surface-1 p-5 text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-200">
              {relRest.map((p, i) => (
                <p key={i}>{renderInlineMd(p)}</p>
              ))}
            </div>
          </section>
        ) : null}

        {familyMatches ? (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">{t('familyTreeTitle')}</h2>
            <Explainer
              title={tDash('explainerLearnMore')}
              body={familyCopy.hint ?? ''}
            />
            {familyMatches.shared.length === 0 && familyMatches.inheritedLessons.length === 0 ? (
              <p className="text-muted-foreground text-sm italic">
                {t('familyTreeEmpty', { name: person.firstName })}
              </p>
            ) : (
              <div className="space-y-4">
                {familyMatches.shared.length > 0 ? (
                  <div className="border-border space-y-2 rounded-2xl border bg-emerald-50/40 p-4 dark:bg-emerald-950/15">
                    <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.18em]">
                      {t('familyTreeSharedLabel')}
                    </p>
                    <ul className="space-y-2">
                      {familyMatches.shared.map((n) => (
                        <li key={n} className="flex items-start gap-3">
                          <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums">
                            {n}
                          </span>
                          <p className="text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                            {familyCopy[`shared:${n}`] ?? ''}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {familyMatches.inheritedLessons.length > 0 ? (
                  <div className="border-border space-y-2 rounded-2xl border bg-amber-50/40 p-4 dark:bg-amber-950/15">
                    <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.18em]">
                      {t('familyTreeInheritedLabel', { name: person.firstName })}
                    </p>
                    <ul className="space-y-2">
                      {familyMatches.inheritedLessons.map((n) => (
                        <li key={n} className="flex items-start gap-3">
                          <span className="bg-amber-500/15 text-amber-800 dark:text-amber-300 font-mono inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums">
                            {n}
                          </span>
                          <p className="text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                            {familyCopy[`inheritedLesson:${n}`] ?? ''}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}
          </section>
        ) : null}

        {/* Detail angka — collapsed by default. The full numerical ladder
         * (5 core + 3 minor + 2 bridge) lives behind one tap so the page
         * reads as prose first, math second. */}
        <details className="border-border group rounded-2xl border bg-surface-1">
          <summary className="press-soft flex cursor-pointer list-none items-start justify-between gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold">{t('detailNumbersTitle')}</p>
              <p className="text-muted-foreground text-xs">{t('detailNumbersHint')}</p>
            </div>
            <ChevronRight
              className="text-muted-foreground mt-1 h-4 w-4 shrink-0 transition-transform group-open:rotate-90"
              aria-hidden
            />
          </summary>
          <div className="border-border/60 space-y-4 border-t px-5 py-5">
            {/* Core carousel — 5 cards, tap to expand meaning */}
            <div className="-mx-5">
              <div className="scroll-px-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
              <div className="space-y-3">
                <Explainer
                  title={tDash('explainerLearnMore')}
                  body={tDash('minorExplainer')}
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <NumberCard
                    label={t('minorExpression')}
                    result={minor.minorExpression}
                    locale={locale}
                    type="expression"
                    meaning={meaningFor('expression', minor.minorExpression, locale)}
                    comingSoonLabel={tDash('meaningComingSoon')}
                  />
                  <NumberCard
                    label={t('minorSoulUrge')}
                    result={minor.minorSoulUrge}
                    locale={locale}
                    type="soulUrge"
                    meaning={meaningFor('soulUrge', minor.minorSoulUrge, locale)}
                    comingSoonLabel={tDash('meaningComingSoon')}
                  />
                  <NumberCard
                    label={t('minorPersonality')}
                    result={minor.minorPersonality}
                    locale={locale}
                    type="personality"
                    meaning={meaningFor('personality', minor.minorPersonality, locale)}
                    comingSoonLabel={tDash('meaningComingSoon')}
                  />
                </div>
              </div>
            ) : null}

            <div className="space-y-3">
              <Explainer
                title={tDash('explainerLearnMore')}
                body={tDash('bridgeExplainer')}
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <NumberCard
                  label={t('bridgeLifePathExpression')}
                  hint={t('bridgeLifePathExpressionHint')}
                  result={bridge.lifePathExpression}
                  locale={locale}
                  type="bridge"
                  meaning={meaningFor('bridge', bridge.lifePathExpression, locale)}
                  comingSoonLabel={tDash('meaningComingSoon')}
                />
                <NumberCard
                  label={t('bridgeSoulUrgePersonality')}
                  hint={t('bridgeSoulUrgePersonalityHint')}
                  result={bridge.soulUrgePersonality}
                  locale={locale}
                  type="bridge"
                  meaning={meaningFor('bridge', bridge.soulUrgePersonality, locale)}
                  comingSoonLabel={tDash('meaningComingSoon')}
                />
              </div>
            </div>
          </div>
        </details>

        {/* Edit + Delete — bottom of the page so they're explicit but out
          * of the way. Editing wipes cached AI bodies for this Person via
          * updatePersonAction so the next render regenerates fresh. */}
        <section className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
          <Link
            href={`/${locale}/people/${person.id}/edit`}
            className="press border-border bg-surface-1 hover:bg-muted/40 inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium"
          >
            <Pencil className="h-4 w-4" aria-hidden />
            {t('editProfile')}
          </Link>
          <DeletePersonButton
            personId={person.id}
            locale={locale}
            confirmLabel={t('deletePersonConfirm', { name: person.firstName })}
            buttonLabel={t('deletePerson')}
            action={deletePersonAction}
          />
        </section>
      </div>

      <PersonVibeButton
        personId={person.id}
        cachedBody={cachedVibeBody}
        action={generatePersonVibeAction}
        labels={{
          button: t('vibeButton'),
          sheetTitle: t('vibeSheetTitle', { name: person.firstName }),
          sheetHint: t('vibeSheetHint', { name: person.firstName }),
          generate: t('vibeGenerate'),
          loading: t('vibeLoading'),
          error: t('vibeError'),
          close: t('vibeClose'),
        }}
      />
    </main>
  );
}

