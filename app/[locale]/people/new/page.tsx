import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { AddPersonForm } from '@/components/people/AddPersonForm';
import { TopBar } from '@/components/layout/TopBar';
import { getSession } from '@/lib/auth/requireSession';
import { countPeople } from '@/lib/db/repositories/person';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { createPersonAction } from '../actions';

const PEOPLE_LIMIT = 999;

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
    <main className="container max-w-xl px-4 sm:px-6">
      <TopBar title={t('title')} backHref={`/${locale}/people`} />
      <div className="space-y-6 pb-6 sm:pb-10">
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
        <AddPersonForm
          locale={locale}
          action={createPersonAction}
          defaultBirthTimezone={profile.timezone}
        />
      </div>
    </main>
  );
}
