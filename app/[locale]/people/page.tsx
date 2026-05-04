import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Plus, HeartHandshake, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { getSession } from '@/lib/auth/requireSession';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { listPeople } from '@/lib/db/repositories/person';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { deletePersonAction } from './actions';

const PEOPLE_LIMIT = 999;

export default async function PeoplePage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id';
  const t = await getTranslations({ locale, namespace: 'people' });

  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const profile = await getProfileByUserId(session.user.id);
  if (!profile) redirect(`/${locale}/welcome`);

  const people = await listPeople(session.user.id);
  const atLimit = people.length >= PEOPLE_LIMIT;

  return (
    <main className="container max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
      <header className="space-y-1 pt-2">
        <h1 className="font-serif text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
        {!atLimit ? (
          <Link
            href={`/${locale}/people/new`}
            className="bg-primary text-primary-foreground mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t('addCta')}
          </Link>
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
        <section className="space-y-3">
          {people.map((p) => (
            <div
              key={p.id}
              className="border-border flex items-stretch overflow-hidden rounded-xl border transition-colors hover:bg-muted/30"
            >
              <Link
                href={`/${locale}/people/${p.id}`}
                className="press-soft flex flex-1 items-baseline justify-between gap-3 py-4 pl-4 pr-2"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.fullName}</p>
                  <p className="text-muted-foreground text-xs">
                    {t(`relationship.${p.relationship}`)} ·{' '}
                    <span className="tabular-nums">
                      {p.dob.year}-{String(p.dob.month).padStart(2, '0')}-
                      {String(p.dob.day).padStart(2, '0')}
                    </span>
                  </p>
                </div>
                <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden />
              </Link>
              <Link
                href={`/${locale}/people/${p.id}/edit`}
                aria-label={t('editPerson', { name: p.fullName })}
                title={t('editPerson', { name: p.fullName })}
                className="text-muted-foreground hover:bg-muted/40 hover:text-foreground flex w-11 items-center justify-center border-l border-border transition-colors"
              >
                <Pencil className="h-4 w-4" aria-hidden />
              </Link>
              <form action={deletePersonAction} className="flex items-stretch">
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="locale" value={locale} />
                <button
                  type="submit"
                  aria-label={t('deletePerson', { name: p.fullName })}
                  className="text-muted-foreground hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40 dark:hover:text-red-400 flex w-11 items-center justify-center border-l border-border transition-colors"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </form>
            </div>
          ))}
        </section>
      )}

      {atLimit ? (
        <p className="text-muted-foreground rounded-lg bg-amber-50 p-3 text-xs dark:bg-amber-950/30">
          {t('limitNote', { limit: PEOPLE_LIMIT })}
        </p>
      ) : null}
    </main>
  );
}
