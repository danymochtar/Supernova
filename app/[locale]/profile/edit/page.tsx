import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { EditProfileForm } from '@/components/auth/EditProfileForm';
import { getSession } from '@/lib/auth/requireSession';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { TIMEZONES } from '@/lib/timezones';
import { updateProfileAction } from './actions';

export default async function EditProfilePage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id';
  const t = await getTranslations({ locale, namespace: 'editProfile' });

  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const profile = await getProfileByUserId(session.user.id);
  if (!profile) redirect(`/${locale}/welcome`);

  return (
    <main className="container max-w-xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
      <header className="space-y-2">
        <Link
          href={`/${locale}/dashboard`}
          className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
        >
          ← {t('back')}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </header>

      <EditProfileForm
        locale={locale}
        initial={{
          firstName: profile.firstName,
          middleName: profile.middleName,
          lastName: profile.lastName,
          dob: profile.dob,
          timezone: profile.timezone,
          locale: profile.locale,
        }}
        timezones={TIMEZONES}
        action={updateProfileAction}
      />
    </main>
  );
}
