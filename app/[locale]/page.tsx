import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('home');

  return (
    <main className="container flex min-h-screen flex-col items-center justify-center gap-6 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">{t('title')}</h1>
      <p className="text-muted-foreground max-w-md">{t('subtitle')}</p>
      <button className="bg-primary text-primary-foreground rounded-lg px-6 py-3 font-medium">
        {t('cta')}
      </button>
    </main>
  );
}
