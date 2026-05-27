import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { Cake } from 'lucide-react';
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
  const tk = await getTranslations({ locale, namespace: 'kehidupan' });

  const bornDate = new Date(Date.UTC(profile.dob.year, profile.dob.month - 1, profile.dob.day));
  const bornLabel = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(bornDate);
  const initial = profile.fullName.trim().charAt(0).toUpperCase();

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
      <section className="border-border rounded-2xl border bg-surface-1 p-5">
        <div className="flex items-center gap-4">
          <div className="from-primary/20 to-accent/20 text-primary flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xl font-semibold">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold">{profile.fullName}</h2>
            {profile.nickname ? (
              <p className="text-muted-foreground truncate text-sm">{profile.nickname}</p>
            ) : null}
          </div>
        </div>
        <div className="border-border/60 text-muted-foreground mt-4 flex items-center gap-2 border-t pt-3 text-sm">
          <Cake className="h-4 w-4 shrink-0" aria-hidden />
          <span>{tk('bioBorn')}</span>
          <span className="font-medium text-neutral-800 dark:text-neutral-200">{bornLabel}</span>
        </div>
      </section>

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
          minorTitle={t('minorTitle')}
          minorHint={t('minorHint')}
          bridge={bridge}
          bridgeLabels={{
            lifePathExpression: t('bridgeLifePathExpression'),
            lifePathExpressionHint: t('bridgeLifePathExpressionHint'),
            soulUrgePersonality: t('bridgeSoulUrgePersonality'),
            soulUrgePersonalityHint: t('bridgeSoulUrgePersonalityHint'),
          }}
          bridgeExplainer={{ title: t('explainerLearnMore'), body: t('bridgeExplainer') }}
          bridgeTitle={t('bridgeTitle')}
          bridgeHint={t('bridgeHint')}
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
