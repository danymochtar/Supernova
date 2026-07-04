import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Moon, Settings2 } from 'lucide-react';
import type { Locale } from '@/lib/i18n/config';
import type { ProfileView } from '@/lib/db/repositories/profile';
import {
  RULER,
  ZODIAC_SIGNS,
  computeChartBalance,
  computeExtendedChart,
  rulerMeaning,
  transitMoonSign,
  type Element,
  type Modality,
  type Planet,
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

  // Ruler placement (server-side interpolation). We render "{planet} di
  // {sign}" when we know both, otherwise fall back to the ruler-planet
  // name alone.
  const risingSign = chart.rising ?? profile.risingSign;
  const rulerPlanet: Planet | null = risingSign ? RULER[risingSign] : null;
  const placementByPlanet: Record<Planet, ZodiacSign | null> = {
    sun: chart.sun,
    moon: chart.moon ?? profile.moonSign,
    venus: chart.venus,
    mars: chart.mars,
    mercury: null,
    jupiter: null,
    saturn: null,
  };
  const rulerSign = rulerPlanet ? placementByPlanet[rulerPlanet] : null;
  const rulerCopy = rulerPlanet ? rulerMeaning(rulerPlanet, locale) : null;
  const chartRulerPlacement =
    rulerCopy && rulerSign
      ? tZodiac('chartRulerPlacement', {
          planet: rulerCopy.name,
          sign: signNames[rulerSign],
        })
      : rulerCopy?.name ?? '';

  return (
    <div className="space-y-4">
      <ZodiacSection
        dob={profile.dob}
        moonSign={chart.moon ?? profile.moonSign}
        risingSign={risingSign}
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
          // ICU placeholders — MUST be interpolated at t() call time.
          // next-intl parses `{count}`, `{element}` etc. during t() and
          // returns the raw key path when values are missing; passing
          // template + .replace()ing on the client doesn't work here.
          balanceTotal: tZodiac('balanceTotal', { count: balance.total }),
          balanceDominantElement: balance.dominantElement
            ? tZodiac('balanceDominantElement', {
                element: elementNames[balance.dominantElement],
              })
            : '',
          balanceDominantModality: balance.dominantModality
            ? tZodiac('balanceDominantModality', {
                modality: modalityNames[balance.dominantModality],
              })
            : '',
          balanceMissingElements:
            balance.missingElements.length > 0
              ? tZodiac('balanceMissingElements', {
                  list: balance.missingElements
                    .map((e) => elementNames[e])
                    .join(', '),
                })
              : '',
          chartRulerTitle: tZodiac('chartRulerTitle'),
          chartRulerHint: tZodiac('chartRulerHint'),
          chartRulerPlacement,
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
