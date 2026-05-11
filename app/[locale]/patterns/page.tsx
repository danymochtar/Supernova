import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { LineChart } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { getSession } from '@/lib/auth/requireSession';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { getRecentFeedback } from '@/lib/db/repositories/feedback';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { aggregate } from '@/lib/patterns/aggregate';

const WINDOW_DAYS = 90;
const MIN_ENTRIES = 14;

export default async function PatternsPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id';
  const t = await getTranslations({ locale, namespace: 'patterns' });

  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const profile = await getProfileByUserId(session.user.id);
  if (!profile) redirect(`/${locale}/welcome`);

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - WINDOW_DAYS);

  const rows = await getRecentFeedback(session.user.id, since);
  const summary = aggregate(
    rows.map((r) => ({ date: r.date, rating: r.rating, tags: r.tags })),
    profile.dob,
    WINDOW_DAYS,
    locale,
  );

  const enoughData = summary.totalEntries >= MIN_ENTRIES;

  return (
    <main className="container max-w-3xl px-4 sm:px-6">
      <TopBar title={t('title')} backHref={`/${locale}/me`} />
      <div className="space-y-8 pb-6 sm:pb-10">
        <p className="text-muted-foreground text-sm">
          {enoughData
            ? t('subtitle', { count: summary.totalEntries, days: WINDOW_DAYS })
            : t('subtitleEmpty', { count: summary.totalEntries, min: MIN_ENTRIES })}
        </p>

      {!enoughData ? (
        <section className="border-border flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center">
          <div className="bg-primary/10 text-primary flex h-14 w-14 items-center justify-center rounded-full">
            <LineChart className="h-6 w-6" aria-hidden />
          </div>
          <h2 className="font-medium">{t('emptyTitle')}</h2>
          <p className="text-muted-foreground mx-auto max-w-md text-sm">{t('emptyBody')}</p>
        </section>
      ) : (
        <>
          <section className="border-border rounded-2xl border bg-surface-1 p-6">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
              {t('overallTitle')}
            </p>
            <p className="mt-2 font-mono text-3xl font-semibold tabular-nums">
              {summary.avg!.toFixed(2)}
              <span className="text-muted-foreground text-base"> / 5</span>
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {t('overallSubtitle', { count: summary.totalEntries })}
            </p>
          </section>

          <BucketSection title={t('byPersonalDay')} buckets={summary.byPersonalDay} hint={t('byPersonalDayHint')} />
          <BucketSection title={t('byWeekday')} buckets={summary.byWeekday} hint={t('byWeekdayHint')} />
          <BucketSection title={t('byTag')} buckets={summary.byTag.slice(0, 12)} hint={t('byTagHint')} />
        </>
      )}
      </div>
    </main>
  );
}

function BucketSection({
  title,
  hint,
  buckets,
}: {
  title: string;
  hint: string;
  buckets: { key: string; count: number; avg: number }[];
}) {
  if (buckets.length === 0) return null;
  const max = Math.max(...buckets.map((b) => b.count));
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-muted-foreground text-sm">{hint}</p>
      </div>
      <div className="border-border space-y-2 rounded-xl border bg-surface-1 p-4">
        {buckets.map((b) => {
          const pct = (b.count / max) * 100;
          const ratingHue = Math.max(0, Math.min(120, ((b.avg - 1) / 4) * 120));
          return (
            <div key={b.key} className="flex items-center gap-3 text-sm">
              <span className="w-12 truncate font-mono font-medium tabular-nums">{b.key}</span>
              <div className="bg-muted relative h-6 flex-1 overflow-hidden rounded">
                <div
                  className="absolute inset-y-0 left-0 rounded"
                  style={{ width: `${pct}%`, backgroundColor: `hsl(${ratingHue}, 60%, 70%)` }}
                />
              </div>
              <span className="text-muted-foreground w-24 text-right text-xs tabular-nums">
                {b.avg.toFixed(2)} · n={b.count}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
