import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n/config';
import type { ProfileView } from '@/lib/db/repositories/profile';
import { bridges, buildCoreProfile, contextFromInstant, personalYear } from '@/lib/numerology';
import { displayName } from '@/lib/profile/displayName';
import { ASPECTS, type AspectId, type AspectInput } from '@/lib/ai/prompts/aspect';
import {
  AspectReadingAsync,
  AspectReadingSkeleton,
} from '@/components/numerology/AspectReading';
import { AspectComputationsRecap } from '@/components/kehidupan/AspectComputationsRecap';

/**
 * Shared sub-view for a life-aspect reading (love / finance). Computes the
 * deterministic numerology inputs, then renders the cache-first
 * AspectReadingAsync behind a Suspense skeleton. Percintaan + Keuangan are
 * one-liners over this.
 */
export async function AspectView({
  profile,
  locale,
  aspectId,
}: {
  profile: ProfileView;
  locale: Locale;
  aspectId: AspectId;
}) {
  const config = ASPECTS[aspectId];
  const t = await getTranslations({ locale, namespace: config.namespace });

  const core = buildCoreProfile(profile.fullName, profile.dob);
  const ctx = contextFromInstant(new Date(), profile.timezone);
  const py = personalYear(profile.dob, ctx.year);

  const input: AspectInput = {
    locale,
    fullName: displayName(profile),
    core: {
      lifePath: core.lifePath,
      expression: core.expression,
      soulUrge: core.soulUrge,
      personality: core.personality,
      birthday: core.birthday,
    },
    personalYear: py,
    karmicLessons: core.karmicLessons,
    bridge: bridges(core),
    preferredModel: profile.preferredModel,
  };

  // Heading text for each section the aspect declares.
  const headings: Record<string, string> = {};
  for (const { headingKey } of config.sections) headings[headingKey] = t(headingKey);

  const recapLabels = {
    sectionTitle: t('recapTitle'),
    sectionHint: t('recapHint'),
    comingSoon: t('recapComingSoon'),
    lifePath: { label: t('recap_lifePath'), hint: t('recap_lifePathHint') },
    expression: { label: t('recap_expression'), hint: t('recap_expressionHint') },
    soulUrge: { label: t('recap_soulUrge'), hint: t('recap_soulUrgeHint') },
    personality: { label: t('recap_personality'), hint: t('recap_personalityHint') },
    personalYear: { label: t('recap_personalYear'), hint: t('recap_personalYearHint') },
    bridge: { label: t('recap_bridge'), hint: t('recap_bridgeHint') },
  };

  return (
    <div className="space-y-6">
      <AspectComputationsRecap
        locale={locale}
        aspectId={aspectId}
        core={input.core}
        personalYear={py}
        bridge={input.bridge}
        labels={recapLabels}
      />
      <Suspense fallback={<AspectReadingSkeleton subtitle={t('subtitle')} />}>
        <AspectReadingAsync
          userId={profile.userId}
          aspectId={aspectId}
          year={ctx.year}
          input={input}
          labels={{ subtitle: t('subtitle'), fallback: t('fallback'), headings }}
        />
      </Suspense>
    </div>
  );
}
