import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Moon, Settings2 } from 'lucide-react';
import type { Locale } from '@/lib/i18n/config';
import type { ProfileView } from '@/lib/db/repositories/profile';
import {
  ZODIAC_SIGNS,
  computeChartBalance,
  computeExtendedChart,
  transitMoonSign,
  type Element,
  type Modality,
  type ZodiacSign,
} from '@/lib/zodiac';
import { ZodiacSection } from '@/components/people/ZodiacSection';

/**
 * "Zodiak" sub-view on the Kehidupan (Life) page — the user's own Sun /
 * Moon / Rising / Venus / Mars rendered in the same editorial card used
 * on the Person detail page. Sun is derived from DOB alone; the rest
 * need birth time + coords.
 *
 * When the user hasn't set birth time yet, the time-dependent rows
 * render dimmed with a hint that points back to the profile edit page.
 * Sun always renders.
 */
export async function ZodiacView({
  profile,
  locale,
}: {
  profile: ProfileView;
  locale: Locale;
}) {
  const t = await getTranslations({ locale, namespace: 'kehidupan' });
  const tZodiac = await getTranslations({ locale, namespace: 'zodiac' });

  const displayName = profile.nickname?.trim() || profile.firstName;

  // Compute the full chart on every render — pure ephemeris call, ~1ms,
  // and the sub-second cost is negligible compared to the DB round-trip
  // for the profile above. Venus + Mars are not persisted; recomputing
  // is cheaper than a migration.
  const chart = computeExtendedChart({
    year: profile.dob.year,
    month: profile.dob.month,
    day: profile.dob.day,
    birthTime: profile.birthTime,
    timezone: profile.birthTimezone ?? profile.timezone,
    lat: profile.birthLat,
    lon: profile.birthLon,
  });

  const balance = computeChartBalance([
    chart.sun,
    chart.moon,
    chart.rising,
    chart.venus,
    chart.mars,
  ]);

  // Transit moon — use the viewer's own "now" so the daily card shifts
  // at midnight local. Date instantiation here is fine (server-only).
  const transitMoon = transitMoonSign(new Date());

  const signNames = Object.fromEntries(
    ZODIAC_SIGNS.map((s) => [s, tZodiac(`sign.${s}`)]),
  ) as Record<ZodiacSign, string>;
  const elementNames: Record<Element, string> = {
    fire: tZodiac('element.fire'),
    earth: tZodiac('element.earth'),
    air: tZodiac('element.air'),
    water: tZodiac('element.water'),
  };
  const modalityNames: Record<Modality, string> = {
    cardinal: tZodiac('modality.cardinal'),
    fixed: tZodiac('modality.fixed'),
    mutable: tZodiac('modality.mutable'),
  };

  return (
    <div className="space-y-4">
      <ZodiacSection
        dob={profile.dob}
        moonSign={chart.moon ?? profile.moonSign}
        risingSign={chart.rising ?? profile.risingSign}
        venusSign={chart.venus}
        marsSign={chart.mars}
        balance={balance}
        transitMoon={transitMoon}
        locale={locale}
        labels={{
          sectionTitle: t('zodiakSectionTitle', { name: displayName }),
          sun: tZodiac('sunLabel'),
          moon: tZodiac('moonLabel'),
          rising: tZodiac('risingLabel'),
          venus: tZodiac('venusLabel'),
          mars: tZodiac('marsLabel'),
          sunRole: tZodiac('sunRole'),
          moonRole: tZodiac('moonRole'),
          risingRole: tZodiac('risingRole'),
          venusRole: tZodiac('venusRole'),
          marsRole: tZodiac('marsRole'),
          inLove: tZodiac('inLoveLabel'),
          classification: tZodiac('classificationLabel'),
          missingHint: tZodiac('missingHint'),
          missingPlanetHint: tZodiac('missingPlanetHint'),
          shadowToggleOpen: tZodiac('shadowToggleOpen'),
          shadowToggleClose: tZodiac('shadowToggleClose'),
          balanceSectionTitle: tZodiac('balanceSectionTitle'),
          balanceTotal: tZodiac('balanceTotal'),
          balanceDominantElement: tZodiac('balanceDominantElement'),
          balanceDominantModality: tZodiac('balanceDominantModality'),
          balanceMissingElements: tZodiac('balanceMissingElements'),
          chartRulerTitle: tZodiac('chartRulerTitle'),
          chartRulerHint: tZodiac('chartRulerHint'),
          chartRulerPlacement: tZodiac('chartRulerPlacement'),
          transitMoonTitle: tZodiac('transitMoonTitle'),
          transitMoonSubtitle: tZodiac('transitMoonSubtitle'),
          signNames,
          elementNames,
          modalityNames,
        }}
      />

      {!profile.birthTime ? (
        <section className="border-border rounded-2xl border border-dashed bg-surface-1/50 px-4 py-4">
          <div className="flex items-start gap-3">
            <Moon className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-sm font-medium">{t('zodiakCompleteTitle')}</p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {t('zodiakCompleteHint')}
              </p>
              <Link
                href={`/${locale}/profile/edit`}
                className="press-soft bg-primary text-primary-foreground inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-semibold"
              >
                <Settings2 className="h-3 w-3" aria-hidden />
                {t('editBirth')}
              </Link>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
