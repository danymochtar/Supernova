import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { BottomNav } from '@/components/layout/BottomNav';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { getSession } from '@/lib/auth/requireSession';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import '../globals.css';

export const metadata: Metadata = {
  applicationName: 'Supernova',
  title: {
    default: 'Supernova — Numerology Companion',
    template: '%s · Supernova',
  },
  description:
    'Personalized daily numerology readings and a reflective AI companion grounded in your numbers.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'Supernova',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#0a1335' },
  ],
  width: 'device-width',
  initialScale: 1,
  // Native-app feel: no pinch zoom, no auto-zoom-on-input. iOS still
  // respects accessibility text size — this only locks page scale, not
  // system font scaling.
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!isLocale(locale)) notFound();
  const messages = await getMessages();
  const t = await getTranslations({ locale, namespace: 'nav' });

  const navLabels = {
    home: t('home'),
    journey: t('journey'),
    chat: t('chat'),
    people: t('people'),
    journal: t('journal'),
  };

  // Pull the user's saved theme preference so first paint matches it. Falls
  // back to "auto" (follow system) when no profile is loaded — public pages.
  const session = await getSession();
  const profile = session ? await getProfileByUserId(session.user.id) : null;
  const initialTheme = profile?.theme ?? 'auto';

  const htmlClass = profile?.showKarmicDebt === false ? 'hide-karmic' : '';

  return (
    <html lang={locale} className={htmlClass} suppressHydrationWarning>
      <body className="bg-background text-foreground min-h-screen antialiased">
        <ThemeProvider defaultTheme={initialTheme}>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <div className="pb-[calc(theme(spacing.20)+env(safe-area-inset-bottom))]">
              {children}
            </div>
            <BottomNav locale={locale as Locale} labels={navLabels} />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
