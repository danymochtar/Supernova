import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Network, Settings2 } from 'lucide-react';
import type { Locale } from '@/lib/i18n/config';
import type { ProfileView } from '@/lib/db/repositories/profile';
import { HumanDesignHero } from './HumanDesignHero';

/**
 * "Desain Manusia" tab on the Kehidupan page — renders the user's full
 * Human Design hero card when a chart has been computed, or an
 * empty-state CTA to add birth time + birth city when the prerequisites
 * are missing.
 *
 * HD compute requires precise lat/lon (the city picker provides them),
 * not just timezone approximation. So the empty state only goes away
 * when BOTH birthTime AND birthLat/birthLon are populated.
 */
export async function HumanDesignView({
  profile,
  locale,
}: {
  profile: ProfileView;
  locale: Locale;
}) {
  const t = await getTranslations({ locale, namespace: 'humanDesign' });
  const tCommon = await getTranslations({ locale, namespace: 'kehidupan' });

  const chart = profile.hdChart;

  if (!chart) {
    return (
      <section className="border-border rounded-3xl border bg-white shadow-sm dark:bg-neutral-900">
        <div className="space-y-3 px-5 py-6 text-center">
          <Network className="text-muted-foreground mx-auto h-7 w-7" aria-hidden />
          <div className="space-y-1">
            <h2 className="font-serif text-xl font-semibold">{t('emptyTitle')}</h2>
            <p className="text-muted-foreground text-sm">
              {profile.birthTime ? t('emptyNeedsCity') : t('emptyNeedsBirthTime')}
            </p>
          </div>
          <Link
            href={`/${locale}/profile/edit`}
            className="press-soft bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"
          >
            <Settings2 className="h-3.5 w-3.5" aria-hidden />
            {t('emptyCta')}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <header className="space-y-1 px-1">
        <h2 className="font-serif text-2xl font-semibold tracking-tight">{t('title')}</h2>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </header>

      <HumanDesignHero chart={chart} locale={locale} />

      <p className="text-muted-foreground px-1 text-[12px]">
        {t('footerNote')}{' '}
        <Link
          href={`/${locale}/profile/edit`}
          className="text-foreground underline-offset-2 hover:underline"
        >
          {tCommon('editBirth')}
        </Link>
      </p>
    </div>
  );
}
