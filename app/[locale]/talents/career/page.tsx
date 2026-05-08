import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Briefcase, Sparkles } from 'lucide-react';
import { getSession } from '@/lib/auth/requireSession';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { TopBar } from '@/components/layout/TopBar';
import { UploadResumeForm } from '@/components/talents/UploadResumeForm';
import { CareerActionsBar } from '@/components/talents/CareerActionsBar';
import { listCareerEntries } from '@/lib/db/repositories/career';
import { deleteAllCareerAction, uploadResumeAction } from './actions';

export const dynamic = 'force-dynamic';

const VOCATION_COLOR: Record<string, string> = {
  business: '#ec4899',
  medicineEducation: '#06b6d4',
  legalPolitics: '#a855f7',
  artsDesign: '#eab308',
  salesPr: '#f97316',
  scienceEngineering: '#3b82f6',
  agriculture: '#84cc16',
};

const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function fmtMonth(d: Date | null, locale: Locale): string {
  if (!d) return '';
  const months = locale === 'id' ? MONTHS_ID : MONTHS_EN;
  return `${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

// matchScore is now an absolute 0-100 average of strength across the
// trait groups feeding the role's vocation. Pick thresholds that read
// intuitively on that scale.
function ratingBucket(score: number): 'high' | 'medium' | 'low' {
  if (score >= 70) return 'high';
  if (score >= 45) return 'medium';
  return 'low';
}

export default async function CareerPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id';
  const t = await getTranslations({ locale, namespace: 'talents' });

  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const profile = await getProfileByUserId(session.user.id);
  if (!profile) redirect(`/${locale}/welcome`);

  const entries = await listCareerEntries(session.user.id);

  // Aggregate match — average across all entries.
  const avgMatch =
    entries.length > 0
      ? Math.round(entries.reduce((s, e) => s + e.matchScore, 0) / entries.length)
      : 0;

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
            {/* Aggregate */}
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
                {avgMatch >= 70
                  ? t('careerAggHigh')
                  : avgMatch >= 45
                    ? t('careerAggMedium')
                    : t('careerAggLow')}
              </p>
            </section>

            {/* Per-role timeline */}
            <section className="space-y-3">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-lg font-semibold">{t('careerTimelineTitle')}</h2>
                <CareerActionsBar
                  deleteAction={deleteAllCareerAction}
                  labels={{
                    reupload: t('careerReuploadHint'),
                    deleteAll: t('careerDeleteAll'),
                    deleteConfirm: t('careerDeleteConfirm'),
                  }}
                />
              </div>
              {entries.map((e) => {
                const bucket = ratingBucket(e.matchScore);
                const color = VOCATION_COLOR[e.vocationId] ?? '#888';
                const ratingLabel = t(
                  bucket === 'high'
                    ? 'ratingHigh'
                    : bucket === 'medium'
                      ? 'ratingMedium'
                      : 'ratingLow',
                );
                const dot =
                  bucket === 'high'
                    ? 'bg-emerald-500'
                    : bucket === 'medium'
                      ? 'bg-amber-500'
                      : 'bg-neutral-400';
                const ratingText =
                  bucket === 'high'
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : bucket === 'medium'
                      ? 'text-amber-700 dark:text-amber-300'
                      : 'text-muted-foreground';
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
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold ${ratingText}`}
                      >
                        <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden />
                        {ratingLabel}
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
                          {fmtMonth(e.startDate, locale)}
                          {' — '}
                          {e.endDate ? fmtMonth(e.endDate, locale) : t('careerCurrent')}
                        </span>
                      ) : null}
                    </div>
                    {e.description ? (
                      <p className="mt-3 text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                        {e.description}
                      </p>
                    ) : null}
                    {(() => {
                      // Show which 11-group talent dimensions fed this
                      // role's score, so the user understands WHY a
                      // role landed where it did rather than just
                      // seeing a bare percentage.
                      let groups: string[] = [];
                      try {
                        const parsed = e.insight ? JSON.parse(e.insight) : null;
                        if (parsed && Array.isArray(parsed.groups)) {
                          groups = parsed.groups as string[];
                        }
                      } catch {
                        /* old rows or malformed JSON — skip silently */
                      }
                      if (groups.length === 0) return null;
                      return (
                        <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
                          <span className="font-medium">{t('careerWhyLabel')}:</span>{' '}
                          {groups
                            .map((g) => t(`groups.${g}.title`))
                            .join(' · ')}
                        </p>
                      );
                    })()}
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
