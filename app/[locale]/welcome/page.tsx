import { redirect } from 'next/navigation';
import { OnboardingForm } from '@/components/auth/OnboardingForm';
import { getSession } from '@/lib/auth/requireSession';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { TIMEZONES } from '@/lib/timezones';
import { saveOnboardingProfile } from './actions';

export default async function WelcomePage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id';

  let session;
  try {
    session = await getSession();
  } catch (err) {
    console.error('[welcome] getSession threw', err);
    throw err;
  }
  if (!session) redirect(`/${locale}/login`);

  let existing;
  try {
    existing = await getProfileByUserId(session.user.id);
  } catch (err) {
    console.error('[welcome] getProfileByUserId threw', { userId: session.user.id, err });
    throw err;
  }
  if (existing) redirect(`/${locale}/dashboard`);

  return (
    <main className="container max-w-xl py-12">
      <OnboardingForm
        locale={locale}
        defaultTimezone="Asia/Jakarta"
        timezones={TIMEZONES}
        action={saveOnboardingProfile}
      />
    </main>
  );
}
