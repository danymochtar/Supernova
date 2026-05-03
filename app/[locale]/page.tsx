import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { notFound } from 'next/navigation';

export default function HomePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const t = useTranslations('home');

  return (
    <main className="container flex min-h-screen flex-col items-center justify-center gap-6 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">{t('title')}</h1>
      <p className="text-muted-foreground max-w-md">{t('subtitle')}</p>
      <Link
        href={`/${locale}/login`}
        className="bg-primary text-primary-foreground rounded-lg px-6 py-3 font-medium"
      >
        {t('cta')}
      </Link>
    </main>
  );
}
