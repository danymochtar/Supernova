import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ChatThread } from '@/components/qa/ChatThread';
import { getSession } from '@/lib/auth/requireSession';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { getTurnsBetween } from '@/lib/db/repositories/qa';
import { listSummaries } from '@/lib/db/repositories/conversationSummary';
import { rollupAll } from '@/lib/conversation/rollup';
import { contextFromInstant } from '@/lib/numerology';
import { isLocale, type Locale } from '@/lib/i18n/config';

export const dynamic = 'force-dynamic';

export default async function AskPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id';
  const t = await getTranslations({ locale, namespace: 'chat' });

  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const profile = await getProfileByUserId(session.user.id);
  if (!profile) redirect(`/${locale}/welcome`);

  const ctx = contextFromInstant(new Date(), profile.timezone);
  const todayStart = new Date(Date.UTC(ctx.year, ctx.month - 1, ctx.day));
  const todayEnd = new Date(todayStart);
  todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

  // Trigger any rollups so summaries are fresh before the user starts chatting.
  await rollupAll(session.user.id, locale, new Date());

  const [todaysTurns, dailies, weeklies, monthlies] = await Promise.all([
    getTurnsBetween(session.user.id, todayStart, todayEnd),
    listSummaries(session.user.id, 'DAILY', 7),
    listSummaries(session.user.id, 'WEEKLY', 4),
    listSummaries(session.user.id, 'MONTHLY', 6),
  ]);

  const dateFmt = (d: Date) =>
    d.toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    });

  const priorDays = [
    ...monthlies.map((m) => ({
      label: t('monthlyLabel', { range: dateFmt(m.periodStart).slice(-4) }),
      start: m.periodStart.toISOString(),
      end: m.periodEnd.toISOString(),
      summary: m.summary,
      turnCount: m.turnCount,
    })),
    ...weeklies.map((w) => ({
      label: t('weeklyLabel', { from: dateFmt(w.periodStart), to: dateFmt(w.periodEnd) }),
      start: w.periodStart.toISOString(),
      end: w.periodEnd.toISOString(),
      summary: w.summary,
      turnCount: w.turnCount,
    })),
    ...dailies.map((d) => ({
      label: t('dailyLabel', { date: dateFmt(d.periodStart) }),
      start: d.periodStart.toISOString(),
      end: d.periodEnd.toISOString(),
      summary: d.summary,
      turnCount: d.turnCount,
    })),
  ];

  return (
    <main className="container max-w-3xl px-4 py-4 sm:px-6 sm:py-6">
      <header className="mb-4 space-y-1 pt-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </header>

      <ChatThread
        initialTurns={todaysTurns.map((tn) => ({
          id: tn.id,
          question: tn.question,
          answer: tn.answer,
          createdAt: tn.createdAt.toISOString(),
        }))}
        priorDays={priorDays}
        emptyHint={t('emptyHint')}
        starterPrompts={[t('starter1'), t('starter2'), t('starter3'), t('starter4')]}
      />
    </main>
  );
}
