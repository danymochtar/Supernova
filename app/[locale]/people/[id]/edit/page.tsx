import { redirect, notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { AddPersonForm } from '@/components/people/AddPersonForm';
import { TopBar } from '@/components/layout/TopBar';
import { getSession } from '@/lib/auth/requireSession';
import { getPerson } from '@/lib/db/repositories/person';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { updatePersonAction } from '../../actions';

export default async function EditPersonPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id';
  const t = await getTranslations({ locale, namespace: 'peopleForm' });

  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);
  const profile = await getProfileByUserId(session.user.id);
  if (!profile) redirect(`/${locale}/welcome`);

  const person = await getPerson(session.user.id, params.id);
  if (!person) notFound();

  return (
    <main className="container max-w-xl px-4 sm:px-6">
      <TopBar title={t('editTitle')} backHref={`/${locale}/people/${person.id}`} />
      <div className="space-y-6 pb-6 sm:pb-10">
        <p className="text-muted-foreground text-sm">{t('editSubtitle')}</p>
        <AddPersonForm
          locale={locale}
          action={updatePersonAction}
          edit={{
            id: person.id,
            firstName: person.firstName,
            middleName: person.middleName,
            lastName: person.lastName,
            nickname: person.nickname,
            dob: person.dob,
            relationship: person.relationship,
            notes: person.notes,
            birthTime: person.birthTime,
            birthCity: person.birthCity,
            birthLat: person.birthLat,
            birthLon: person.birthLon,
            birthTimezone: person.birthTimezone,
          }}
        />
      </div>
    </main>
  );
}
