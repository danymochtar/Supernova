import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Plus, HeartHandshake, ChevronRight, Flame, LayoutGrid, LayoutList, Link2, Pencil, Sparkles, Trash2 } from 'lucide-react';
import type { Relationship } from '@prisma/client';
import { getSession } from '@/lib/auth/requireSession';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { listPeople, type PersonView } from '@/lib/db/repositories/person';
import { ageAt, buildCoreProfile, contextFromInstant } from '@/lib/numerology';
import { compatibilityScore } from '@/lib/compatibility/score';
import { analyzePair, personNumbers } from '@/lib/connection';
import { backfillBirthCharts } from '@/lib/people/backfillBirthChart';
import { computeCircleStats } from '@/lib/people/circleStats';
import { PeopleInfographic } from '@/components/people/PeopleInfographic';
import { GLYPH, sunSignFromDob, tokensForSign } from '@/lib/zodiac/signs';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { displayName } from '@/lib/profile/displayName';
import { deletePersonFormAction } from './actions';

const PEOPLE_LIMIT = 999;

/**
 * Soft color tint per band — keeps the score chip scannable at a glance
 * (warm = high, neutral = mid, cool/muted = low) without screaming.
 */
function bandTone(band: 'rare' | 'strong' | 'good' | 'fair' | 'low'): string {
  switch (band) {
    case 'rare':
    case 'strong':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200';
    case 'good':
      return 'bg-primary/15 text-primary';
    case 'fair':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200';
    case 'low':
      return 'bg-muted text-muted-foreground';
  }
}

export default async function PeoplePage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { edit?: string; view?: string };
}) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id';
  const t = await getTranslations({ locale, namespace: 'people' });

  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const profile = await getProfileByUserId(session.user.id);
  if (!profile) redirect(`/${locale}/welcome`);

  const rawPeople = await listPeople(session.user.id);
  // One-shot backfill for legacy rows saved before smart defaults
  // shipped — applies noon + name/locale-guessed city so moon + rising
  // stop rendering as "Belum diisi" without the user re-editing.
  const people = await backfillBirthCharts(
    session.user.id,
    rawPeople,
    locale,
    profile.timezone,
  );
  const atLimit = people.length >= PEOPLE_LIMIT;
  const editMode = searchParams.edit === '1';
  // Layout mode — persisted via URL param so it survives navigation and
  // stays deep-linkable. Grid = compact tile per person; list = current
  // wide-row layout (default).
  const viewMode: 'grid' | 'list' = searchParams.view === 'grid' ? 'grid' : 'list';
  const ctx = contextFromInstant(new Date(), profile.timezone);
  // Build the user's core once and reuse for every row's compatibility score
  // so the People list can show a quick "how do we fit" chip per person.
  const me = buildCoreProfile(profile.fullName, profile.dob);
  const circleStats = computeCircleStats(
    { fullName: profile.fullName, dob: profile.dob },
    people,
  );

  // Group by relationship type. listPeople already returns rows sorted by
  // RELATIONSHIP_PRIORITY (closest first), so a single sequential pass
  // produces sections in the right order without redoing the sort.
  const groups: { relationship: Relationship; rows: PersonView[] }[] = [];
  for (const p of people) {
    const last = groups[groups.length - 1];
    if (last && last.relationship === p.relationship) {
      last.rows.push(p);
    } else {
      groups.push({ relationship: p.relationship, rows: [p] });
    }
  }

  return (
    <main
      className="container max-w-3xl space-y-6 px-4 pb-6 sm:px-6 sm:pb-10"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1.5rem)' }}
    >
      <header className="pt-2">
        <h1 className="font-serif text-2xl font-semibold tracking-tight">{t('title')}</h1>
      </header>

      {people.length > 0 ? (
        <PeopleInfographic
          stats={circleStats}
          labels={{
            eyebrow: t('heroInfoEyebrow'),
            tagline: t('heroInfoTagline'),
            connection: {
              TWIN_FLAME: t('heroInfoConnectionTwin'),
              SOULMATE: t('heroInfoConnectionSoulmate'),
              KARMIC: t('heroInfoConnectionKarmic'),
              NEUTRAL: t('heroInfoConnectionNeutral'),
            },
            connectionSectionTitle: t('heroInfoConnectionTitle'),
            elementSectionTitle: t('heroInfoElementTitle'),
            element: {
              fire: t('heroInfoElementFire'),
              earth: t('heroInfoElementEarth'),
              air: t('heroInfoElementAir'),
              water: t('heroInfoElementWater'),
            },
            topLifePathLabel: t('heroInfoTopLpLabel'),
            // Interpolate at call time — next-intl parses ICU
            // placeholders during t() and returns the raw key path if
            // values are missing, so we can't defer substitution to
            // the component's .replace() calls.
            topLifePathHint: circleStats.topLifePath
              ? t('heroInfoTopLpHint', {
                  count: circleStats.topLifePath.count,
                  lp: circleStats.topLifePath.value,
                })
              : '',
          }}
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {!atLimit ? (
          <Link
            href={`/${locale}/people/new`}
            className="bg-primary text-primary-foreground press inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t('addCta')}
          </Link>
        ) : (
          <span aria-hidden />
        )}
        {people.length > 0 ? (
          <div className="flex items-center gap-3">
            {/* Layout toggle — grid vs list. URL param persists the
             *  choice so it survives deep links + tab switches. */}
            <div
              role="tablist"
              aria-label={t('viewToggleLabel')}
              className="border-border bg-surface-1 inline-flex overflow-hidden rounded-full border p-0.5"
            >
              <Link
                role="tab"
                aria-selected={viewMode === 'list'}
                href={
                  editMode
                    ? `/${locale}/people?edit=1`
                    : `/${locale}/people`
                }
                className={`press-soft inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LayoutList className="h-3 w-3" aria-hidden />
                {t('viewList')}
              </Link>
              <Link
                role="tab"
                aria-selected={viewMode === 'grid'}
                href={
                  editMode
                    ? `/${locale}/people?edit=1&view=grid`
                    : `/${locale}/people?view=grid`
                }
                className={`press-soft inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LayoutGrid className="h-3 w-3" aria-hidden />
                {t('viewGrid')}
              </Link>
            </div>
            <Link
              href={
                editMode
                  ? `/${locale}/people${viewMode === 'grid' ? '?view=grid' : ''}`
                  : `/${locale}/people?edit=1${viewMode === 'grid' ? '&view=grid' : ''}`
              }
              className={`text-xs font-medium underline-offset-4 hover:underline ${
                editMode ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {editMode ? t('editModeDone') : t('editMode')}
            </Link>
          </div>
        ) : null}
      </div>

      {people.length === 0 ? (
        <section className="border-border flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center">
          <div className="bg-primary/10 text-primary flex h-14 w-14 items-center justify-center rounded-full">
            <HeartHandshake className="h-6 w-6" aria-hidden />
          </div>
          <h2 className="font-medium">{t('emptyTitle')}</h2>
          <p className="text-muted-foreground max-w-xs text-sm">{t('emptyBody')}</p>
        </section>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.relationship} className="space-y-2">
              <p className="text-muted-foreground px-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
                {t(`relationship.${group.relationship}`)}
              </p>
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-2 gap-2.5 sm:grid-cols-3'
                    : 'border-border divide-border/60 overflow-hidden rounded-2xl border bg-surface-2 divide-y'
                }
              >
                {group.rows.map((p) => {
                  const age = ageAt(p.dob, ctx);
                  const sun = sunSignFromDob(p.dob);
                  const tok = tokensForSign(sun);
                  const primary = displayName(p);
                  const hasFullName = p.fullName.trim() !== primary;
                  const them = buildCoreProfile(p.fullName, p.dob);
                  const compat = compatibilityScore(me, them, p.relationship, {
                    meDob: profile.dob,
                    meMoon: profile.moonSign,
                    meRising: profile.risingSign,
                    themDob: p.dob,
                    themMoon: p.moonSign,
                    themRising: p.risingSign,
                  });
                  // Soul-connection classification — Twin Flame, Soulmate,
                  // and Karmic each get their own small chip on the row;
                  // Neutral stays quiet.
                  const connection = analyzePair(
                    personNumbers(profile.dob, profile.fullName),
                    personNumbers(p.dob, p.fullName),
                  );
                  const connectionChip =
                    connection.primary === 'TWIN_FLAME' ? (
                      <span
                        className="from-rose-500 to-orange-500 inline-flex shrink-0 items-center gap-1 rounded-full bg-gradient-to-r px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm"
                        title="Twin Flame"
                      >
                        <Flame className="h-2.5 w-2.5" aria-hidden />
                        Twin
                      </span>
                    ) : connection.primary === 'SOULMATE' ? (
                      <span
                        className="from-violet-500 to-indigo-500 inline-flex shrink-0 items-center gap-1 rounded-full bg-gradient-to-r px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm"
                        title="Soulmate"
                      >
                        <Sparkles className="h-2.5 w-2.5" aria-hidden />
                        Soul
                      </span>
                    ) : connection.primary === 'KARMIC' ? (
                      <span
                        className="from-amber-500 to-amber-600 inline-flex shrink-0 items-center gap-1 rounded-full bg-gradient-to-r px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm"
                        title="Karmic"
                      >
                        <Link2 className="h-2.5 w-2.5" aria-hidden />
                        Karmic
                      </span>
                    ) : null;

                  if (viewMode === 'grid') {
                    // Grid tile: vertical stack — larger glyph avatar,
                    // name + optional connection chip, compat chip at
                    // the bottom. Edit affordances collapse into a
                    // small overlay when editMode is on.
                    return (
                      <div key={p.id} className="border-border relative overflow-hidden rounded-2xl border bg-surface-1">
                        <Link
                          href={`/${locale}/people/${p.id}`}
                          className={`press-soft flex flex-col items-center gap-2 bg-gradient-to-br p-3 text-center ${tok.gradient}`}
                        >
                          <div
                            className={`flex h-14 w-14 items-center justify-center rounded-full bg-white/40 ring-1 backdrop-blur-sm dark:bg-black/20 ${tok.ring}`}
                            aria-hidden
                          >
                            <span className={`font-serif text-3xl ${tok.glyph}`}>{GLYPH[sun]}</span>
                          </div>
                          <div className="w-full space-y-0.5">
                            <div className="flex items-center justify-center gap-1">
                              <p className="truncate text-[13px] font-semibold leading-tight">
                                {primary}
                              </p>
                              {connectionChip}
                            </div>
                            <p className="text-muted-foreground truncate text-[10px]">
                              {t('ageShort', { age })}
                            </p>
                          </div>
                          <span
                            aria-label={`${compat.overall}/100`}
                            className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold tabular-nums ${bandTone(compat.band)}`}
                          >
                            {compat.overall}
                          </span>
                        </Link>
                        {editMode ? (
                          <div className="border-border/60 flex items-center justify-around border-t">
                            <Link
                              href={`/${locale}/people/${p.id}/edit`}
                              aria-label={t('editPerson', { name: primary })}
                              className="text-muted-foreground hover:bg-muted/40 hover:text-foreground flex flex-1 items-center justify-center py-1.5 transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" aria-hidden />
                            </Link>
                            <form action={deletePersonFormAction} className="border-border/60 flex flex-1 items-stretch border-l">
                              <input type="hidden" name="id" value={p.id} />
                              <input type="hidden" name="locale" value={locale} />
                              <button
                                type="submit"
                                aria-label={t('deletePerson', { name: primary })}
                                className="text-muted-foreground hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40 dark:hover:text-red-400 flex flex-1 items-center justify-center py-1.5 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                              </button>
                            </form>
                          </div>
                        ) : null}
                      </div>
                    );
                  }

                  return (
                    <div key={p.id} className="flex items-stretch hover:bg-muted/30 transition-colors">
                      <Link
                        href={`/${locale}/people/${p.id}`}
                        className="press-soft flex flex-1 items-center gap-3 px-4 py-3"
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ring-1 ${tok.gradient} ${tok.ring}`}
                          aria-hidden
                        >
                          <span className={`font-serif text-xl ${tok.glyph}`}>{GLYPH[sun]}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-1.5 truncate font-medium">
                            <span className="truncate">{primary}</span>
                            {connectionChip}
                          </p>
                          <p className="text-muted-foreground truncate text-xs">
                            {t('ageShort', { age })}
                            {hasFullName ? ` · ${p.fullName}` : ''}
                          </p>
                        </div>
                        <span
                          aria-label={`${compat.overall}/100`}
                          className={`shrink-0 rounded-full px-2.5 py-0.5 font-mono text-xs font-semibold tabular-nums ${bandTone(compat.band)}`}
                        >
                          {compat.overall}
                        </span>
                        {!editMode ? (
                          <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden />
                        ) : null}
                      </Link>
                      {editMode ? (
                        <>
                          <Link
                            href={`/${locale}/people/${p.id}/edit`}
                            aria-label={t('editPerson', { name: primary })}
                            title={t('editPerson', { name: primary })}
                            className="text-muted-foreground hover:bg-muted/40 hover:text-foreground border-border flex w-11 items-center justify-center border-l transition-colors"
                          >
                            <Pencil className="h-4 w-4" aria-hidden />
                          </Link>
                          <form action={deletePersonFormAction} className="flex items-stretch">
                            <input type="hidden" name="id" value={p.id} />
                            <input type="hidden" name="locale" value={locale} />
                            <button
                              type="submit"
                              aria-label={t('deletePerson', { name: primary })}
                              className="text-muted-foreground hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40 dark:hover:text-red-400 border-border flex w-11 items-center justify-center border-l transition-colors"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden />
                            </button>
                          </form>
                        </>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {atLimit ? (
        <p className="text-muted-foreground rounded-lg bg-amber-50 p-3 text-xs dark:bg-amber-950/30">
          {t('limitNote', { limit: PEOPLE_LIMIT })}
        </p>
      ) : null}
    </main>
  );
}
