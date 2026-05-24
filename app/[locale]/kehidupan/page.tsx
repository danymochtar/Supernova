import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getSession } from '@/lib/auth/requireSession';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { KehidupanTabs, type KehidupanTab } from '@/components/kehidupan/KehidupanTabs';
import { TentangView } from '@/components/kehidupan/TentangView';
import { PerjalananView } from '@/components/kehidupan/PerjalananView';
import { AspectView } from '@/components/kehidupan/AspectView';

export const dynamic = 'force-dynamic';

export default async function KehidupanPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { tab?: string };
}) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id';
  const t = await getTranslations({ locale, namespace: 'kehidupan' });

  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const profile = await getProfileByUserId(session.user.id);
  if (!profile) redirect(`/${locale}/welcome`);

  // Default sub-view is the self-portrait. Only the active tab's data +
  // AI generation runs, since each tab is its own server render keyed by
  // the ?tab= query param.
  const raw = searchParams.tab;
  const tab: KehidupanTab =
    raw === 'perjalanan' || raw === 'percintaan' || raw === 'keuangan' ? raw : 'tentang';

  return (
    <main
      className="container max-w-3xl space-y-6 px-4 pb-6 sm:px-6 sm:pb-10"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1.5rem)' }}
    >
      <header className="space-y-3 pt-2">
        <h1 className="font-serif text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <KehidupanTabs
          active={tab}
          basePath={`/${locale}/kehidupan`}
          labels={{
            tentang: t('tabTentang'),
            perjalanan: t('tabPerjalanan'),
            percintaan: t('tabPercintaan'),
            keuangan: t('tabKeuangan'),
          }}
        />
      </header>

      {tab === 'perjalanan' ? (
        <PerjalananView profile={profile} locale={locale} />
      ) : tab === 'percintaan' ? (
        <AspectView profile={profile} locale={locale} aspectId="love" />
      ) : tab === 'keuangan' ? (
        <AspectView profile={profile} locale={locale} aspectId="finance" />
      ) : (
        <TentangView profile={profile} locale={locale} />
      )}
    </main>
  );
}
