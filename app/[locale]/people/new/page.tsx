import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { AddPersonForm } from '@/components/people/AddPersonForm';
import { getSession } from '@/lib/auth/requireSession';
import { countPeople } from '@/lib/db/repositories/person';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { createPersonAction } from '../actions';

const PEOPLE_LIMIT = 1;

export default async function NewPersonPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id';
  const t = await getTranslations({ locale, namespace: 'peopleForm' });

  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);
  const profile = await getProfileByUserId(session.user.id);
  if (!profile) redirect(`/${locale}/welcome`);
  const count = await countPeople(session.user.id);
  if (count >= PEOPLE_LIMIT) redirect(`/${locale}/people`);

  return (
    <main className="container max-w-xl space-y-8 py-10">
      <header className="space-y-2">
        <Link
          href={`/${locale}/people`}
          className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
        >
          ← {t('back')}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </header>

      <AddPersonForm locale={locale} action={createPersonAction} />
    </main>
  );
}
