import { redirect } from 'next/navigation';
import { OnboardingForm } from '@/components/auth/OnboardingForm';
import { getSession } from '@/lib/auth/requireSession';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { TIMEZONES } from '@/lib/timezones';
import { saveOnboardingProfile } from './actions';

export default async function WelcomePage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id';

  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const existing = await getProfileByUserId(session.user.id);
  if (existing) redirect(`/${locale}/dashboard`);

  return (
    <main className="container max-w-xl px-4 py-8 sm:px-6 sm:py-12">
      <OnboardingForm
        defaultTimezone="Asia/Jakarta"
        defaultLocale={locale}
        timezones={TIMEZONES}
        action={saveOnboardingProfile}
      />
    </main>
  );
}
