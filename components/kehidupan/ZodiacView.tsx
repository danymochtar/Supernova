import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Moon, Settings2 } from 'lucide-react';
import type { Locale } from '@/lib/i18n/config';
import type { ProfileView } from '@/lib/db/repositories/profile';
import { ZODIAC_SIGNS, type ZodiacSign } from '@/lib/zodiac/signs';
import { ZodiacSection } from '@/components/people/ZodiacSection';

/**
 * "Zodiak" sub-view on the Kehidupan (Life) page — the user's own Sun /
 * Moon / Rising rendered in the same Tinder Astrology-style editorial
 * card used on the Person detail page. Sun is derived from DOB
 * server-side inside `<ZodiacSection>`; Moon and Rising are pulled from
 * the Profile cache (populated when the user set birth time + city on
 * the profile edit page).
 *
 * When the user hasn't set birth time yet, Moon + Rising rows render
 * dimmed with the role heading + a "add in profile" hint. Sun always
 * renders (DOB is required to complete onboarding).
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

  return (
    <div className="space-y-4">
      <ZodiacSection
        dob={profile.dob}
        moonSign={profile.moonSign}
        risingSign={profile.risingSign}
        locale={locale}
        labels={{
          sectionTitle: t('zodiakSectionTitle', { name: displayName }),
          sun: tZodiac('sunLabel'),
          moon: tZodiac('moonLabel'),
          rising: tZodiac('risingLabel'),
          sunRole: tZodiac('sunRole'),
          moonRole: tZodiac('moonRole'),
          risingRole: tZodiac('risingRole'),
          inLove: tZodiac('inLoveLabel'),
          classification: tZodiac('classificationLabel'),
          missingHint: tZodiac('missingHint'),
          signNames: Object.fromEntries(
            ZODIAC_SIGNS.map((s) => [s, tZodiac(`sign.${s}`)]),
          ) as Record<ZodiacSign, string>,
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
