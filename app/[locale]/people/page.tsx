import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Plus, HeartHandshake, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import type { Relationship } from '@prisma/client';
import { getSession } from '@/lib/auth/requireSession';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { listPeople, type PersonView } from '@/lib/db/repositories/person';
import { ageAt, buildCoreProfile, contextFromInstant } from '@/lib/numerology';
import { compatibilityScore } from '@/lib/compatibility/score';
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
  searchParams: { edit?: string };
}) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id';
  const t = await getTranslations({ locale, namespace: 'people' });

  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const profile = await getProfileByUserId(session.user.id);
  if (!profile) redirect(`/${locale}/welcome`);

  const people = await listPeople(session.user.id);
  const atLimit = people.length >= PEOPLE_LIMIT;
  const editMode = searchParams.edit === '1';
  const ctx = contextFromInstant(new Date(), profile.timezone);
  // Build the user's core once and reuse for every row's compatibility score
  // so the People list can show a quick "how do we fit" chip per person.
  const me = buildCoreProfile(profile.fullName, profile.dob);

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
      <header className="space-y-1 pt-2">
        <h1 className="font-serif text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </header>

      {people.length > 0 ? (
        <section className="border-primary/40 from-primary/10 ring-primary/20 flex items-center gap-4 overflow-hidden rounded-3xl border-2 bg-gradient-to-br to-accent/15 p-5 ring-1 dark:to-accent/15">
          <div className="bg-primary/15 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
            <HeartHandshake className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-primary text-[11px] font-semibold uppercase tracking-[0.18em]">
              {t('heroEyebrow', { count: people.length })}
            </p>
            <p className="font-serif text-base font-semibold leading-tight tracking-tight sm:text-lg">
              {t('heroTitle', { count: people.length })}
            </p>
          </div>
        </section>
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
          <Link
            href={editMode ? `/${locale}/people` : `/${locale}/people?edit=1`}
            className={`text-xs font-medium underline-offset-4 hover:underline ${
              editMode ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            {editMode ? t('editModeDone') : t('editMode')}
          </Link>
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
              <div className="border-border divide-border/60 overflow-hidden rounded-2xl border bg-surface-2 divide-y">
                {group.rows.map((p) => {
                  const age = ageAt(p.dob, ctx);
                  const initials = `${p.firstName.charAt(0)}${p.lastName?.charAt(0) ?? ''}`.toUpperCase()
                    || p.firstName.slice(0, 2).toUpperCase();
                  const primary = displayName(p);
                  // Surface the full legal name as subline only when it
                  // differs from the display name — keeps identification
                  // in reach without making the row read formal.
                  const hasFullName = p.fullName.trim() !== primary;
                  const them = buildCoreProfile(p.fullName, p.dob);
                  const compat = compatibilityScore(me, them, p.relationship);
                  return (
                    <div key={p.id} className="flex items-stretch hover:bg-muted/30 transition-colors">
                      <Link
                        href={`/${locale}/people/${p.id}`}
                        className="press-soft flex flex-1 items-center gap-3 px-4 py-3"
                      >
                        <div
                          className="from-primary/30 to-accent/30 text-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-serif text-sm font-semibold"
                          aria-hidden
                        >
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{primary}</p>
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
