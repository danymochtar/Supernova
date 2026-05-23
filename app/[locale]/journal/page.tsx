import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { BookOpen, MessageCircle } from 'lucide-react';
import { getSession } from '@/lib/auth/requireSession';
import { listJournal } from '@/lib/db/repositories/journal';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getLocaleConfig } from '@/lib/i18n/locales';
import { JournalView, type JournalEntryLite } from '@/components/journal/JournalView';
import { deleteJournalAction, toggleActionItemAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function JournalPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id';
  const t = await getTranslations({ locale, namespace: 'journal' });

  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const entries = await listJournal(session.user.id, 200);

  // Pre-format the locale-aware date strings server-side so the client
  // component can stay focused on layout + interactions and doesn't have
  // to ship the Intl bundles itself.
  const intlTag = getLocaleConfig(locale).intlTag;
  const groupFmt = new Intl.DateTimeFormat(intlTag, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const lite: JournalEntryLite[] = entries.map((e) => {
    const range = e.rangeStart;
    const added = e.addedAt;
    return {
      id: e.id,
      narrative: e.narrative,
      reframe: e.reframe,
      emotion: e.emotion,
      theme: e.theme,
      actionItems: e.actionItems.map((it) => ({
        id: it.id,
        title: it.title,
        completed: it.completed,
      })),
      sources: e.sources.map((s) => ({ question: s.question, answer: s.answer })),
      dayKey: range.toISOString().slice(0, 10),
      year: range.getUTCFullYear(),
      month: range.getUTCMonth() + 1,
      day: range.getUTCDate(),
      addedLabel: groupFmt.format(added),
      groupLabel: groupFmt.format(range),
    };
  });

  return (
    <main
      className="container max-w-3xl space-y-6 px-4 pb-6 sm:px-6 sm:pb-10"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1.5rem)' }}
    >
      <header className="space-y-1 pt-2">
        <h1 className="font-serif text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </header>

      {entries.length === 0 ? (
        <section className="border-border border-dashed flex flex-col items-center gap-3 rounded-2xl border-2 px-6 py-10 text-center">
          <div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-full">
            <BookOpen className="h-5 w-5" aria-hidden />
          </div>
          <p className="text-muted-foreground max-w-sm text-sm">{t('emptyHint')}</p>
          <Link
            href={`/${locale}/ask`}
            className="bg-primary text-primary-foreground press inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            {t('emptyCta')}
          </Link>
        </section>
      ) : (
        <JournalView
          locale={locale}
          entries={lite}
          deleteAction={deleteJournalAction}
          toggleAction={toggleActionItemAction}
        />
      )}
    </main>
  );
}
