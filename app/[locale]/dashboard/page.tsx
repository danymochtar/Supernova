import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/requireSession';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { isLocale, type Locale } from '@/lib/i18n/config';

/**
 * Stub dashboard. M3 will render the static numerology profile + today's
 * personal cycles + active pinnacle/cycle/challenge.
 */
export default async function DashboardPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id';

  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const profile = await getProfileByUserId(session.user.id);
  if (!profile) redirect(`/${locale}/welcome`);

  return (
    <main className="container max-w-3xl py-12">
      <header className="space-y-2">
        <p className="text-muted-foreground text-sm">{profile.fullName}</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {locale === 'id' ? 'Dashboard akan segera datang' : 'Dashboard coming soon'}
        </h1>
        <p className="text-muted-foreground text-sm">
          {locale === 'id'
            ? `Lahir ${profile.dob.year}-${String(profile.dob.month).padStart(2, '0')}-${String(profile.dob.day).padStart(2, '0')} · ${profile.timezone}`
            : `Born ${profile.dob.year}-${String(profile.dob.month).padStart(2, '0')}-${String(profile.dob.day).padStart(2, '0')} · ${profile.timezone}`}
        </p>
      </header>
    </main>
  );
}
