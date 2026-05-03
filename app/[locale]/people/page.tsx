import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getSession } from '@/lib/auth/requireSession';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { listPeople } from '@/lib/db/repositories/person';
import { isLocale, type Locale } from '@/lib/i18n/config';

const PEOPLE_LIMIT = 1;

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
    <main className="container max-w-3xl space-y-8 py-10">
      <header className="flex items-end justify-between gap-4">
        <div>
          <Link
            href={`/${locale}/dashboard`}
            className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
          >
            ← {t('backToDashboard')}
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t('subtitle')}</p>
        </div>
        {!atLimit ? (
          <Link
            href={`/${locale}/people/new`}
            className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium"
          >
            {t('addCta')}
          </Link>
        ) : null}
      </header>

      {people.length === 0 ? (
        <section className="border-border rounded-2xl border-2 border-dashed p-10 text-center">
          <h2 className="font-medium">{t('emptyTitle')}</h2>
          <p className="text-muted-foreground mt-2 text-sm">{t('emptyBody')}</p>
        </section>
      ) : (
        <section className="space-y-3">
          {people.map((p) => (
            <Link
              key={p.id}
              href={`/${locale}/people/${p.id}`}
              className="border-border hover:bg-muted/30 block rounded-xl border p-4 transition"
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
                <span className="text-muted-foreground text-sm">→</span>
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
