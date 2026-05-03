import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { AddPersonForm } from '@/components/people/AddPersonForm';
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
    <main className="container max-w-xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
      <header className="space-y-2">
        <Link
          href={`/${locale}/people/${person.id}`}
          className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
        >
          ← {t('back')}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{t('editTitle')}</h1>
        <p className="text-muted-foreground text-sm">{t('editSubtitle')}</p>
      </header>

      <AddPersonForm
        locale={locale}
        action={updatePersonAction}
        edit={{
          id: person.id,
          firstName: person.firstName,
          middleName: person.middleName,
          lastName: person.lastName,
          dob: person.dob,
          relationship: person.relationship,
          notes: person.notes,
        }}
      />
    </main>
  );
}
