import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Briefcase, Sparkles } from 'lucide-react';
import { getSession } from '@/lib/auth/requireSession';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { formatMonthShort } from '@/lib/i18n/date';
import { TopBar } from '@/components/layout/TopBar';
import { UploadResumeForm } from '@/components/talents/UploadResumeForm';
import { CareerActionsBar } from '@/components/talents/CareerActionsBar';
import { buildCoreProfile } from '@/lib/numerology';
import {
  rateVocations,
  ratingBucket,
  talentDistribution,
  VOCATION_COLOR,
  type TalentRating,
} from '@/lib/numerology/talents';
import { loadCareerEntriesScored } from '@/lib/numerology/career';
import { deleteAllCareerAction, uploadResumeAction } from './actions';

export const dynamic = 'force-dynamic';

const RATING_LABEL_KEY: Record<TalentRating, string> = {
  high: 'ratingHigh',
  medium: 'ratingMedium',
  low: 'ratingLow',
};

const RATING_DOT: Record<TalentRating, string> = {
  high: 'bg-emerald-500',
  medium: 'bg-amber-500',
  low: 'bg-neutral-400',
};

const RATING_TEXT: Record<TalentRating, string> = {
  high: 'text-emerald-700 dark:text-emerald-300',
  medium: 'text-amber-700 dark:text-amber-300',
  low: 'text-muted-foreground',
};

const AGG_KEY: Record<TalentRating, string> = {
  high: 'careerAggHigh',
  medium: 'careerAggMedium',
  low: 'careerAggLow',
};

function parseInsightGroups(insight: string | null | undefined): string[] {
  if (!insight) return [];
  try {
    const parsed = JSON.parse(insight);
    return Array.isArray(parsed?.groups) ? (parsed.groups as string[]) : [];
  } catch {
    return [];
  }
}

export default async function CareerPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id';
  const t = await getTranslations({ locale, namespace: 'talents' });

  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const profile = await getProfileByUserId(session.user.id);
  if (!profile) redirect(`/${locale}/welcome`);

  const core = buildCoreProfile(profile.fullName, profile.dob);
  const dist = talentDistribution(profile.fullName, core);
  const vocationResults = rateVocations(dist.slices);
  const { entries, avgScore: avgMatch } = await loadCareerEntriesScored(
    session.user.id,
    vocationResults,
  );

  return (
    <main className="container max-w-3xl px-4 sm:px-6">
      <TopBar title={t('careerTitle')} backHref={`/${locale}/talents`} />
      <div className="space-y-6 pb-6">
        <header className="space-y-2">
          <p className="text-muted-foreground text-sm">{t('careerSubtitle')}</p>
        </header>

        <UploadResumeForm
          action={uploadResumeAction}
          labels={{
            cta: entries.length > 0 ? t('careerReupload') : t('careerUpload'),
            parsing: t('careerParsing'),
            success: t('careerSuccess'),
            errorNoFile: t('careerErrorNoFile'),
            errorWrongType: t('careerErrorWrongType'),
            errorTooLarge: t('careerErrorTooLarge'),
            errorParseFailed: t('careerErrorParseFailed'),
            errorNoRoles: t('careerErrorNoRoles'),
            errorGeneric: t('careerErrorGeneric'),
          }}
        />

        {entries.length === 0 ? (
          <section className="border-border flex flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-10 text-center">
            <div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-full">
              <Briefcase className="h-5 w-5" aria-hidden />
            </div>
            <p className="text-muted-foreground max-w-sm text-sm">{t('careerEmpty')}</p>
          </section>
        ) : (
          <>
            <section className="border-border rounded-2xl border bg-gradient-to-br from-primary/5 to-accent/5 p-5 dark:from-primary/15 dark:to-accent/15">
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.18em]">
                    {t('careerAvgLabel')}
                  </p>
                  <p className="font-serif mt-1 text-3xl font-semibold tabular-nums">
                    {avgMatch}%
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="text-primary h-4 w-4" aria-hidden />
                  <p className="text-muted-foreground text-xs">
                    {t('careerCount', { n: entries.length })}
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                {t(AGG_KEY[ratingBucket(avgMatch)])}
              </p>
            </section>

            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <h2 className="text-lg font-semibold">{t('careerTimelineTitle')}</h2>
                <CareerActionsBar
                  deleteAction={deleteAllCareerAction}
                  labels={{
                    deleteAll: t('careerDeleteAll'),
                    deleteConfirm: t('careerDeleteConfirm'),
                  }}
                />
              </div>
              {entries.map((e) => {
                const bucket = ratingBucket(e.matchScore);
                const color = VOCATION_COLOR[e.vocationId as keyof typeof VOCATION_COLOR] ?? '#888';
                const insightGroups = parseInsightGroups(e.insight);
                return (
                  <article
                    key={e.id}
                    className="border-border rounded-2xl border bg-white/40 p-5 dark:bg-neutral-900/40"
                  >
                    <header className="flex flex-wrap items-baseline justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold leading-tight">{e.title}</h3>
                        {e.company ? (
                          <p className="text-muted-foreground text-sm">{e.company}</p>
                        ) : null}
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold ${RATING_TEXT[bucket]}`}
                      >
                        <span className={`h-2 w-2 rounded-full ${RATING_DOT[bucket]}`} aria-hidden />
                        {t(RATING_LABEL_KEY[bucket])}
                        <span className="text-muted-foreground tabular-nums">
                          · {Math.round(e.matchScore)}%
                        </span>
                      </span>
                    </header>
                    <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
                        style={{ backgroundColor: color }}
                      >
                        {t(`vocations.${e.vocationId}.title`)}
                      </span>
                      {e.startDate || e.endDate ? (
                        <span className="tabular-nums">
                          {formatMonthShort(e.startDate, locale)}
                          {' — '}
                          {e.endDate ? formatMonthShort(e.endDate, locale) : t('careerCurrent')}
                        </span>
                      ) : null}
                    </div>
                    {e.description ? (
                      <p className="mt-3 text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                        {e.description}
                      </p>
                    ) : null}
                    {insightGroups.length > 0 ? (
                      <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
                        <span className="font-medium">{t('careerWhyLabel')}:</span>{' '}
                        {insightGroups.map((g) => t(`groups.${g}.title`)).join(' · ')}
                      </p>
                    ) : null}
                  </article>
                );
              })}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
