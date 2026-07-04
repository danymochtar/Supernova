import Link from 'next/link';
import { Suspense } from 'react';
import { redirect, notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ChevronRight, ChevronDown, Pencil, HeartHandshake } from 'lucide-react';
import { getSession } from '@/lib/auth/requireSession';
import { getPerson } from '@/lib/db/repositories/person';
import { backfillBirthCharts } from '@/lib/people/backfillBirthChart';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { ZodiacSection } from '@/components/people/ZodiacSection';
import { ElementModalityChips } from '@/components/people/ElementModalityChips';
import {
  ELEMENT,
  GLYPH,
  MODALITY,
  ZODIAC_SIGNS,
  sunSignFromDob,
  tokensForSign,
  type ZodiacSign,
} from '@/lib/zodiac/signs';
import { elementMeaning, lifePathSignFunfact, modalityMeaning } from '@/lib/zodiac/content';
import {
  ageAt,
  bridges,
  buildCoreProfile,
  contextFromInstant,
  minorNumbers,
} from '@/lib/numerology';
import { compareToParent } from '@/lib/numerology/familyTree';
import { compatibilityScore } from '@/lib/compatibility/score';
import { analyzePair, personNumbers } from '@/lib/connection';
import { KoneksiSection } from '@/components/people/KoneksiSection';
import {
  RelationshipProfileSection,
  RelationshipProfileFallback,
} from '@/components/people/RelationshipProfileSection';
import { displayName } from '@/lib/profile/displayName';
import { meaningFor } from '@/lib/numerology/meanings';
import idFamily from '@/content/family/id.json';
import enFamily from '@/content/family/en.json';
import { NumberCard } from '@/components/numerology/NumberCard';
import { TopBar } from '@/components/layout/TopBar';
import { Explainer } from '@/components/layout/Explainer';
import { PersonVibeButton } from '@/components/people/PersonVibeButton';
import { CurhatShortcut } from '@/components/curhat/CurhatShortcut';
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
  const tRelLabel = await getTranslations({ locale, namespace: 'people.relationship' });
  const tDash = await getTranslations({ locale, namespace: 'dashboard' });
  const tCompat = await getTranslations({ locale, namespace: 'compatibility' });
  const tRel = await getTranslations({ locale, namespace: 'relationshipProfile' });
  const tZodiac = await getTranslations({ locale, namespace: 'zodiac' });

  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const userProfile = await getProfileByUserId(session.user.id);
  if (!userProfile) redirect(`/${locale}/welcome`);

  const rawPerson = await getPerson(session.user.id, params.id);
  if (!rawPerson) notFound();
  // Same one-shot backfill as the list — covers users who deep-link
  // into a legacy Person before hitting the list page. backfillBirthCharts
  // preserves array length + order, so index 0 is always defined; the
  // `?? rawPerson` narrows the type without changing behaviour.
  const backfilled = await backfillBirthCharts(
    session.user.id,
    [rawPerson],
    locale,
    userProfile.timezone,
  );
  const person = backfilled[0] ?? rawPerson;

  const me = buildCoreProfile(userProfile.fullName, userProfile.dob);
  const them = buildCoreProfile(person.fullName, person.dob);

  // Soul-connection reading (Karmic / Soulmate / Twin Flame / Netral).
  // Pure math — computed inline every render, no cache needed at this
  // volume (single call, ~microseconds).
  const connectionReading = analyzePair(
    personNumbers(userProfile.dob, userProfile.fullName),
    personNumbers(person.dob, person.fullName),
  );
  const ctx = contextFromInstant(new Date(), userProfile.timezone);
  const age = ageAt(person.dob, ctx);

  const score = compatibilityScore(me, them, person.relationship, {
    meDob: userProfile.dob,
    meMoon: userProfile.moonSign,
    meRising: userProfile.risingSign,
    themDob: person.dob,
    themMoon: person.moonSign,
    themRising: person.risingSign,
  });

  // Display name = nickname when present, otherwise firstName. Drives all
  // UI prose + AI prompts so the model addresses people by their call
  // name instead of the full legal name from numerology calculations.
  const theirName = displayName(person);
  const myName = displayName(userProfile);

  const minor = minorNumbers(person.nickname);
  const bridge = bridges(them);

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

  const relLabels = {
    profileSummary: t('profileSummary'),
    profileTitle: tRel('title', { name: theirName }),
  };

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
      <TopBar title={theirName} backHref={`/${locale}/people`} />
      <div className="space-y-6 pb-6 sm:pb-10">
        {/* Identity hero — element-tinted gradient + big Sun glyph as the
         * avatar. The element (fire/earth/air/water) is intrinsic to the
         * person's Sun, so the hero ornament naturally varies across the
         * People list without needing a per-person color choice. */}
        {(() => {
          const sunSign = sunSignFromDob(person.dob);
          const tokens = tokensForSign(sunSign);
          const element = ELEMENT[sunSign];
          const modality = MODALITY[sunSign];
          const funfact = lifePathSignFunfact(them.lifePath.reduced, sunSign, locale);
          return (
            <>
              <section
                className={`overflow-hidden rounded-3xl border-2 bg-gradient-to-br p-6 ring-1 ${tokens.gradient} ${tokens.ring} ${tokens.border}`}
              >
                <div className="relative flex items-center gap-4">
                  {/* Big glyph in the avatar slot. Decorative second glyph
                   * sits behind it at low opacity for an ornament feel. */}
                  <div className="relative h-20 w-20 shrink-0">
                    <span
                      aria-hidden
                      className={`absolute -right-2 -top-2 font-serif text-6xl opacity-15 ${tokens.glyph}`}
                    >
                      {GLYPH[sunSign]}
                    </span>
                    <div
                      className={`relative flex h-20 w-20 items-center justify-center rounded-full bg-white/40 ring-1 backdrop-blur-sm dark:bg-black/20 ${tokens.ring}`}
                      aria-label={tZodiac(`sign.${sunSign}`)}
                    >
                      <span className={`font-serif text-4xl ${tokens.glyph}`}>
                        {GLYPH[sunSign]}
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-80">
                      {tRelLabel(person.relationship)}
                    </p>
                    <p className="font-serif truncate text-xl font-semibold leading-tight tracking-tight sm:text-2xl">
                      {theirName}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      <span className="capitalize">{tZodiac(`sign.${sunSign}`)}</span>
                      {' · '}
                      {t('age', { age })}
                      {' · '}
                      <span className="tabular-nums">
                        {person.dob.year}-{String(person.dob.month).padStart(2, '0')}-
                        {String(person.dob.day).padStart(2, '0')}
                      </span>
                    </p>
                    <ElementModalityChips
                      element={elementMeaning(element, locale)}
                      modality={modalityMeaning(modality, locale)}
                      chipClass={tokens.chip}
                    />
                  </div>
                </div>
              </section>

              {/* FUNFACT — Life Path × Sun combo. One punchy line that
               * captures the cross of the deepest core number with the
               * person's archetypal sign. Static lookup, no AI. */}
              {funfact ? (
                <section
                  className={`relative overflow-hidden rounded-2xl border bg-surface-1 p-4 ${tokens.border}`}
                >
                  <span
                    aria-hidden
                    className={`absolute -right-4 -bottom-6 font-serif text-8xl opacity-[0.06] ${tokens.glyph}`}
                  >
                    {GLYPH[sunSign]}
                  </span>
                  <div className="relative space-y-1">
                    <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.18em]">
                      {tZodiac('funfactLabel', {
                        lifePath: them.lifePath.reduced,
                        sign: tZodiac(`sign.${sunSign}`),
                      })}
                    </p>
                    <p className="text-sm leading-relaxed text-foreground/90">{funfact}</p>
                  </div>
                </section>
              ) : null}
            </>
          );
        })()}

        {/* KONEKSI — soul-connection type badge (Twin Flame / Soulmate /
         *  Karmic / Neutral). Sits at headline position: the connection
         *  archetype is the human answer to "who is this person to me?"
         *  — compat score below quantifies the daily friction, but
         *  koneksi is the framing lens. */}
        <KoneksiSection
          reading={connectionReading}
          meName={myName}
          themName={theirName}
        />

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

        {/* ZODIAC — optional supplementary lens; pure display, does not
         * feed the compatibility score. Sun is always shown (derived from
         * DOB); Moon / Rising render only when the user has entered them. */}
        <ZodiacSection
          dob={person.dob}
          moonSign={person.moonSign}
          risingSign={person.risingSign}
          locale={locale}
          labels={{
            sectionTitle: tZodiac('sectionTitleOnPerson', { name: theirName }),
            sun: tZodiac('sunLabel'),
            moon: tZodiac('moonLabel'),
            rising: tZodiac('risingLabel'),
            sunRole: tZodiac('sunRole'),
            moonRole: tZodiac('moonRole'),
            risingRole: tZodiac('risingRole'),
            inLove: tZodiac('inLoveLabel'),
            classification: tZodiac('classificationLabel'),
            missingHint: tZodiac('missingHint'),
            signNames: Object.fromEntries(
              ZODIAC_SIGNS.map((s) => [s, tZodiac(`sign.${s}`)]),
            ) as Record<ZodiacSign, string>,
          }}
        />

        {/* AI body split into two flat cards: portrait ("Ringkasan profil")
         * + relational dynamics ("Profil hubungan…"). Suspense-wrapped so
         * the static hero + compat score above paint instantly while
         * Anthropic streams. Cache hits resolve synchronously and skip
         * the skeleton entirely. */}
        <Suspense fallback={<RelationshipProfileFallback labels={relLabels} />}>
          <RelationshipProfileSection
            userId={session.user.id}
            personId={person.id}
            preferredModel={userProfile.preferredModel}
            locale={locale}
            relationship={person.relationship}
            meName={myName}
            themName={theirName}
            me={me}
            them={them}
            labels={relLabels}
          />
        </Suspense>

        {/* Family Tree — collapsed by default (same pattern as Detail
         *  Angka below). Only surfaces when the parent-child comparison
         *  has data to show; otherwise the whole accordion is hidden. */}
        {familyMatches ? (
          <details className="border-border group rounded-2xl border bg-surface-1">
            <summary className="press-soft flex cursor-pointer list-none items-start justify-between gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-sm font-semibold">{t('familyTreeTitle')}</p>
                <p className="text-muted-foreground text-xs">
                  {familyMatches.shared.length + familyMatches.inheritedLessons.length > 0
                    ? t('familyTreeSummary', {
                        shared: familyMatches.shared.length,
                        inherited: familyMatches.inheritedLessons.length,
                      })
                    : t('familyTreeEmpty', { name: theirName })}
                </p>
              </div>
              <ChevronDown
                className="text-muted-foreground mt-1 h-4 w-4 shrink-0 transition-transform ios-ease group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <div className="border-border/60 space-y-4 border-t px-5 py-5">
              <Explainer
                title={tDash('explainerLearnMore')}
                body={familyCopy.hint ?? ''}
              />
              {familyMatches.shared.length === 0 && familyMatches.inheritedLessons.length === 0 ? (
                <p className="text-muted-foreground text-sm italic">
                  {t('familyTreeEmpty', { name: theirName })}
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
                        {t('familyTreeInheritedLabel', { name: theirName })}
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
            </div>
          </details>
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
            <ChevronDown
              className="text-muted-foreground mt-1 h-4 w-4 shrink-0 transition-transform ios-ease group-open:rotate-180"
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
            confirmLabel={t('deletePersonConfirm', { name: theirName })}
            buttonLabel={t('deletePerson')}
            errorLabel={t('deletePersonError')}
            action={deletePersonAction}
          />
        </section>
      </div>

      <PersonVibeButton
        personId={person.id}
        cachedBody={cachedVibeBody}
        action={generatePersonVibeAction}
        fabClassName="bottom-24 left-4"
        labels={{
          button: t('vibeButton'),
          sheetTitle: t('vibeSheetTitle', { name: theirName }),
          sheetHint: t('vibeSheetHint', { name: theirName }),
          generate: t('vibeGenerate'),
          loading: t('vibeLoading'),
          error: t('vibeError'),
          close: t('vibeClose'),
        }}
      />

      {/* Opposite-corner FABs: curhat bottom-right, Vibes bottom-left, so
        * they never overlap. Curhat = interactive conversation tagged to
        * this person; Vibes = read-only daily insight. */}
      <CurhatShortcut
        locale={locale}
        topic="relationship"
        personId={person.id}
        label={t('curhatAbout', { name: theirName })}
      />
    </main>
  );
}

