import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { EditProfileForm } from '@/components/auth/EditProfileForm';
import { TopBar } from '@/components/layout/TopBar';
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
    <main className="container max-w-xl px-4 sm:px-6">
      <TopBar title={t('title')} backHref={`/${locale}/me`} />
      <div className="space-y-6 pb-6 sm:pb-10">
        <EditProfileForm
          initial={{
            firstName: profile.firstName,
            middleName: profile.middleName,
            lastName: profile.lastName,
            nickname: profile.nickname,
            dob: profile.dob,
            timezone: profile.timezone,
            moonSign: profile.moonSign,
            risingSign: profile.risingSign,
          }}
          timezones={TIMEZONES}
          action={updateProfileAction}
        />
      </div>
    </main>
  );
}
