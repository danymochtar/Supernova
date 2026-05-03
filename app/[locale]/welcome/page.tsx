import { redirect } from 'next/navigation';
import { OnboardingForm } from '@/components/auth/OnboardingForm';
import { getSession } from '@/lib/auth/requireSession';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { TIMEZONES } from '@/lib/timezones';
import { saveOnboardingProfile } from './actions';

function DebugError({ stage, err }: { stage: string; err: unknown }) {
  const msg = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : null;
  return (
    <main className="container max-w-2xl py-12">
      <h1 className="text-xl font-semibold text-red-700">Welcome page error ({stage})</h1>
      <pre className="mt-4 whitespace-pre-wrap rounded bg-red-50 p-4 text-xs text-red-900">
        {msg}
      </pre>
      {stack ? (
        <pre className="mt-2 whitespace-pre-wrap rounded bg-neutral-100 p-4 text-[11px] text-neutral-700">
          {stack}
        </pre>
      ) : null}
      <p className="mt-4 text-sm text-neutral-600">
        Env check — DATA_ENCRYPTION_KEY: {process.env.DATA_ENCRYPTION_KEY ? 'set' : 'MISSING'} ·
        BETTER_AUTH_SECRET: {process.env.BETTER_AUTH_SECRET ? 'set' : 'MISSING'} ·
        BETTER_AUTH_URL: {process.env.BETTER_AUTH_URL ?? '(unset)'} ·
        VERCEL_URL: {process.env.VERCEL_URL ?? '(unset)'}
      </p>
    </main>
  );
}

export default async function WelcomePage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id';

  let session;
  try {
    session = await getSession();
  } catch (err) {
    console.error('[welcome] getSession threw', err);
    return <DebugError stage="getSession" err={err} />;
  }
  if (!session) redirect(`/${locale}/login`);

  let existing;
  try {
    existing = await getProfileByUserId(session.user.id);
  } catch (err) {
    console.error('[welcome] getProfileByUserId threw', { userId: session.user.id, err });
    return <DebugError stage="getProfileByUserId" err={err} />;
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
