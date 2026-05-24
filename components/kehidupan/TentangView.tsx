import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n/config';
import type { ProfileView } from '@/lib/db/repositories/profile';
import { bridges, buildCoreProfile, minorNumbers } from '@/lib/numerology';
import { meaningFor } from '@/lib/numerology/meanings';
import { displayName } from '@/lib/profile/displayName';
import { AboutMeAsync, AboutMeSkeleton } from '@/components/numerology/AboutMeAsync';
import { KarmicLessonsList } from '@/components/numerology/KarmicLessonsList';
import { Widget } from '@/components/layout/Widget';
import { Explainer } from '@/components/layout/Explainer';

/**
 * "Tentang Kamu" sub-view of the Kehidupan page — the full self-portrait:
 * AI synthesis + core-number carousel + Minor + Bridge (the AboutMe block
 * that used to live on the dashboard) plus the standalone Karmic Lessons
 * list. Moved off Beranda so the dashboard stays light.
 *
 * Async server component: computes core/minor/bridge deterministically,
 * then renders AboutMeAsync inside its own Suspense boundary (cache-first;
 * cold cache streams behind the skeleton).
 */
export async function TentangView({
  profile,
  locale,
}: {
  profile: ProfileView;
  locale: Locale;
}) {
  const t = await getTranslations({ locale, namespace: 'dashboard' });

  const core = buildCoreProfile(profile.fullName, profile.dob);
  const minor = minorNumbers(profile.nickname);
  const bridge = bridges(core);

  const aboutMeInput = {
    locale,
    fullName: displayName(profile),
    core: {
      lifePath: core.lifePath,
      expression: core.expression,
      soulUrge: core.soulUrge,
      personality: core.personality,
      birthday: core.birthday,
    },
    minor,
    karmicLessons: core.karmicLessons,
    preferredModel: profile.preferredModel,
  };

  return (
    <div className="space-y-6">
      <Suspense
        fallback={<AboutMeSkeleton title="" subtitle={t('aboutMeSubtitle')} />}
      >
        <AboutMeAsync
          userId={profile.userId}
          input={aboutMeInput}
          title=""
          subtitle={t('aboutMeSubtitle')}
          fallback={t('aboutMeFallback')}
          cardLabels={{
            lifePath: t('lifePath'),
            expression: t('expression'),
            soulUrge: t('soulUrge'),
            personality: t('personality'),
            birthday: t('birthday'),
            karmicLessons: t('karmicLessonsTitle'),
          }}
          numbers={{
            lifePath: core.lifePath,
            expression: core.expression,
            soulUrge: core.soulUrge,
            personality: core.personality,
            birthday: core.birthday,
            karmicLessons: core.karmicLessons,
          }}
          locale={locale}
          explainer={{ title: t('explainerLearnMore'), body: t('aboutMeExplainer') }}
          minor={minor}
          minorLabels={{
            expression: t('minorExpression'),
            soulUrge: t('minorSoulUrge'),
            personality: t('minorPersonality'),
          }}
          minorExplainer={{ title: t('explainerLearnMore'), body: t('minorExplainer') }}
          bridge={bridge}
          bridgeLabels={{
            lifePathExpression: t('bridgeLifePathExpression'),
            lifePathExpressionHint: t('bridgeLifePathExpressionHint'),
            soulUrgePersonality: t('bridgeSoulUrgePersonality'),
            soulUrgePersonalityHint: t('bridgeSoulUrgePersonalityHint'),
          }}
          bridgeExplainer={{ title: t('explainerLearnMore'), body: t('bridgeExplainer') }}
          comingSoonLabel={t('meaningComingSoon')}
        />
      </Suspense>

      <Widget title={t('karmicLessonsTitle')} hint={t('karmicLessonsHint')} defaultOpen={false}>
        <div className="space-y-3">
          <Explainer title={t('explainerLearnMore')} body={t('karmicLessonsExplainer')} />
          <KarmicLessonsList
            lessons={core.karmicLessons.map((n) => ({
              number: n,
              meaning: meaningFor('karmicLesson', { compound: n, reduced: n, isMaster: false }, locale),
            }))}
            emptyLabel={t('karmicLessonsNone')}
            comingSoonLabel={t('meaningComingSoon')}
          />
        </div>
      </Widget>
    </div>
  );
}
