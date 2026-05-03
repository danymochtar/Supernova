import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { AskForm } from '@/components/qa/AskForm';
import { getSession } from '@/lib/auth/requireSession';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { isLocale, type Locale } from '@/lib/i18n/config';

export default async function AskPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id';
  const t = await getTranslations({ locale, namespace: 'ask' });

  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const profile = await getProfileByUserId(session.user.id);
  if (!profile) redirect(`/${locale}/welcome`);

  return (
    <main className="container max-w-3xl space-y-8 py-10">
      <header className="space-y-2">
        <Link
          href={`/${locale}/dashboard`}
          className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
        >
          ← {t('backToDashboard')}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </header>
      <AskForm />
    </main>
  );
}
