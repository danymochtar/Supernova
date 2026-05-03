import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { TopBar } from '@/components/layout/TopBar';
import { DashboardLayoutEditor } from '@/components/auth/DashboardLayoutEditor';
import { getSession } from '@/lib/auth/requireSession';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { parseLayout, WIDGET_IDS, type WidgetId } from '@/lib/dashboard/layout';

export default async function DashboardLayoutPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id';
  const t = await getTranslations({ locale, namespace: 'layoutEditor' });
  const tWidgets = await getTranslations({ locale, namespace: 'widgets' });

  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const profile = await getProfileByUserId(session.user.id);
  if (!profile) redirect(`/${locale}/welcome`);

  const layout = parseLayout(profile.dashboardLayout);

  const labels = WIDGET_IDS.reduce<Record<WidgetId, string>>((acc, id) => {
    acc[id] = tWidgets(id);
    return acc;
  }, {} as Record<WidgetId, string>);

  return (
    <main className="container max-w-xl px-4 sm:px-6">
      <TopBar title={t('title')} backHref={`/${locale}/me`} />
      <div className="space-y-6 pb-6 sm:pb-10">
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
        <DashboardLayoutEditor initial={layout} labels={labels} />
      </div>
    </main>
  );
}
