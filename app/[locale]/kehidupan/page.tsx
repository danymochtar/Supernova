import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getSession } from '@/lib/auth/requireSession';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { KehidupanTabs, type KehidupanTab } from '@/components/kehidupan/KehidupanTabs';
import { TentangView } from '@/components/kehidupan/TentangView';
import { PerjalananView } from '@/components/kehidupan/PerjalananView';
import { AspectView } from '@/components/kehidupan/AspectView';
import { ZodiacView } from '@/components/kehidupan/ZodiacView';
import { HumanDesignView } from '@/components/humanDesign/HumanDesignView';
import { CurhatShortcut } from '@/components/curhat/CurhatShortcut';
import { categoryForKehidupanTab } from '@/lib/curhat/categories';

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
  const tChat = await getTranslations({ locale, namespace: 'chat' });
  const tCat = await getTranslations({ locale, namespace: 'categories' });

  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const profile = await getProfileByUserId(session.user.id);
  if (!profile) redirect(`/${locale}/welcome`);

  // Default sub-view is the self-portrait. Only the active tab's data +
  // AI generation runs, since each tab is its own server render keyed by
  // the ?tab= query param.
  const raw = searchParams.tab;
  const tab: KehidupanTab =
    raw === 'perjalanan' ||
    raw === 'percintaan' ||
    raw === 'keuangan' ||
    raw === 'zodiak' ||
    raw === 'desainManusia'
      ? raw
      : 'tentang';

  return (
    <main
      className="container max-w-3xl space-y-5 px-4 pb-6 sm:px-6 sm:pb-10"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
    >
      {/* Single page title ("Kehidupan") + the tabs under it. The active
        * sub-view no longer repeats its name as a big heading (the tab
        * pill already labels it), so there's one clean title instead of
        * a Kehidupan / tab / heading stutter. */}
      <header className="space-y-3 pt-1">
        <h1 className="font-serif text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <KehidupanTabs
          active={tab}
          basePath={`/${locale}/kehidupan`}
          labels={{
            tentang: t('tabTentang'),
            perjalanan: t('tabPerjalanan'),
            percintaan: t('tabPercintaan'),
            keuangan: t('tabKeuangan'),
            zodiak: t('tabZodiak'),
            desainManusia: t('tabDesainManusia'),
          }}
        />
      </header>

      {tab === 'perjalanan' ? (
        <PerjalananView profile={profile} locale={locale} />
      ) : tab === 'percintaan' ? (
        <AspectView profile={profile} locale={locale} aspectId="love" />
      ) : tab === 'keuangan' ? (
        <AspectView profile={profile} locale={locale} aspectId="finance" />
      ) : tab === 'zodiak' ? (
        <ZodiacView profile={profile} locale={locale} />
      ) : tab === 'desainManusia' ? (
        <HumanDesignView profile={profile} userId={session.user.id} locale={locale} />
      ) : (
        <TentangView profile={profile} locale={locale} />
      )}

      <CurhatShortcut
        locale={locale}
        topic={categoryForKehidupanTab(tab)}
        label={tChat('shortcut', { topic: tCat(categoryForKehidupanTab(tab)) })}
      />
    </main>
  );
}
