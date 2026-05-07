import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { LoginForm } from '@/components/auth/LoginForm';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { notFound } from 'next/navigation';

export default async function LoginPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const t = await getTranslations({ locale, namespace: 'login' });

  return (
    <main
      className="relative flex min-h-screen flex-col items-center px-6 pb-12"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
    >
      {/* Discreet back arrow to the landing page so users who tapped
        * "Mulai sekarang" can bail out without browser-back. */}
      <Link
        href={`/${locale}`}
        aria-label={t('back')}
        className="hover:bg-muted/40 text-muted-foreground hover:text-foreground absolute left-4 inline-flex h-9 w-9 items-center justify-center rounded-full"
        style={{ top: 'calc(env(safe-area-inset-top) + 1rem)' }}
      >
        <ChevronLeft className="h-5 w-5" aria-hidden />
      </Link>

      <div className="flex min-h-[80vh] w-full max-w-sm flex-1 flex-col justify-center">
        <LoginForm locale={locale} />
      </div>
    </main>
  );
}
