import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Plus, HeartHandshake, ChevronRight } from 'lucide-react';
import { getSession } from '@/lib/auth/requireSession';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { listPeople } from '@/lib/db/repositories/person';
import { isLocale, type Locale } from '@/lib/i18n/config';

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
            <Link
              key={p.id}
              href={`/${locale}/people/${p.id}`}
              className="border-border press-soft hover:bg-muted/30 block rounded-xl border p-4 transition-colors"
            >
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <p className="font-medium">{p.fullName}</p>
                  <p className="text-muted-foreground text-xs">
                    {t(`relationship.${p.relationship}`)} ·{' '}
                    <span className="tabular-nums">
                      {p.dob.year}-{String(p.dob.month).padStart(2, '0')}-
                      {String(p.dob.day).padStart(2, '0')}
                    </span>
                  </p>
                </div>
                <ChevronRight className="text-muted-foreground h-4 w-4" aria-hidden />
              </div>
            </Link>
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
