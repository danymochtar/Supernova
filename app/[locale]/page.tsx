import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { notFound } from 'next/navigation';

export default function HomePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const t = useTranslations('home');

  return (
    <main className="container flex min-h-[calc(100dvh-5rem)] flex-col items-center justify-center gap-8 px-6 text-center">
      <Image
        src="/icons/icon.svg"
        alt="Supernova"
        width={88}
        height={88}
        className="rounded-2xl shadow-lg shadow-primary/20"
        priority
      />
      <div className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{t('title')}</h1>
        <p className="text-muted-foreground mx-auto max-w-md text-base">{t('subtitle')}</p>
      </div>
      <Link
        href={`/${locale}/login`}
        className="bg-primary text-primary-foreground press inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-base font-medium shadow-lg shadow-primary/20"
      >
        {t('cta')}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </main>
  );
}
