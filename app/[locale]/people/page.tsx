import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Plus, HeartHandshake, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import type { Relationship } from '@prisma/client';
import { getSession } from '@/lib/auth/requireSession';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { listPeople, type PersonView } from '@/lib/db/repositories/person';
import { ageAt, contextFromInstant } from '@/lib/numerology';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { deletePersonAction } from './actions';

const PEOPLE_LIMIT = 999;

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
    <main className="container max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
      <header className="space-y-3 pt-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="font-serif text-2xl font-semibold tracking-tight">{t('title')}</h1>
            <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
          </div>
          {!atLimit ? (
            <Link
              href={`/${locale}/people/new`}
              className="bg-primary text-primary-foreground press inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
            >
              <Plus className="h-4 w-4" aria-hidden />
              {t('addCta')}
            </Link>
          ) : null}
        </div>
        {people.length > 0 ? (
          <div className="flex justify-end">
            <Link
              href={editMode ? `/${locale}/people` : `/${locale}/people?edit=1`}
              className={`text-xs font-medium underline-offset-4 hover:underline ${
                editMode ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {editMode ? t('editModeDone') : t('editMode')}
            </Link>
          </div>
        ) : null}
      </header>

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
              <div className="border-border divide-border/60 overflow-hidden rounded-2xl border bg-white/30 dark:bg-neutral-900/30 divide-y">
                {group.rows.map((p) => {
                  const age = ageAt(p.dob, ctx);
                  const initials = `${p.firstName.charAt(0)}${p.lastName?.charAt(0) ?? ''}`.toUpperCase()
                    || p.firstName.slice(0, 2).toUpperCase();
                  const subline = p.nickname
                    ? `${t('ageShort', { age })} · ${p.nickname}`
                    : t('ageShort', { age });
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
                          <p className="truncate font-medium">{p.fullName}</p>
                          <p className="text-muted-foreground truncate text-xs">{subline}</p>
                        </div>
                        {!editMode ? (
                          <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden />
                        ) : null}
                      </Link>
                      {editMode ? (
                        <>
                          <Link
                            href={`/${locale}/people/${p.id}/edit`}
                            aria-label={t('editPerson', { name: p.fullName })}
                            title={t('editPerson', { name: p.fullName })}
                            className="text-muted-foreground hover:bg-muted/40 hover:text-foreground border-border flex w-11 items-center justify-center border-l transition-colors"
                          >
                            <Pencil className="h-4 w-4" aria-hidden />
                          </Link>
                          <form action={deletePersonAction} className="flex items-stretch">
                            <input type="hidden" name="id" value={p.id} />
                            <input type="hidden" name="locale" value={locale} />
                            <button
                              type="submit"
                              aria-label={t('deletePerson', { name: p.fullName })}
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
