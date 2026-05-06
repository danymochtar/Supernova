import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { BookOpen, MessageCircle } from 'lucide-react';
import { getSession } from '@/lib/auth/requireSession';
import { listJournal } from '@/lib/db/repositories/journal';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { JournalEntryCard } from '@/components/journal/JournalEntryCard';
import { deleteJournalAction } from './actions';

export const dynamic = 'force-dynamic';

const LONG_DAY_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const LONG_MONTH_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function formatDayId(d: Date): string {
  return `${LONG_DAY_ID[d.getUTCDay()]}, ${d.getUTCDate()} ${LONG_MONTH_ID[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export default async function JournalPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id';
  const t = await getTranslations({ locale, namespace: 'journal' });

  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const entries = await listJournal(session.user.id, 200);

  // Group entries by the chat-day they came from (rangeStart day in UTC).
  // Within a group keep journaling order — most-recently-added first.
  type Entry = (typeof entries)[number];
  const groups = new Map<string, Entry[]>();
  for (const e of entries) {
    const key = e.rangeStart.toISOString().slice(0, 10);
    const arr = groups.get(key);
    if (arr) arr.push(e);
    else groups.set(key, [e]);
  }
  const orderedGroups = Array.from(groups.entries()).sort(([a], [b]) =>
    a < b ? 1 : a > b ? -1 : 0,
  );

  return (
    <main className="container max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
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
        <div className="space-y-8">
          {orderedGroups.map(([dayKey, dayEntries]) => {
            const groupDate = formatDayId(dayEntries[0]!.rangeStart);
            return (
              <section key={dayKey} className="space-y-3">
                <p className="text-muted-foreground px-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
                  {groupDate}
                </p>
                {dayEntries.map((entry) => (
                  <JournalEntryCard
                    key={entry.id}
                    id={entry.id}
                    narrative={entry.narrative}
                    sources={entry.sources.map((s) => ({ question: s.question, answer: s.answer }))}
                    addedDate={formatDayId(entry.addedAt)}
                    deleteAction={deleteJournalAction}
                    labels={{
                      addedAt: t('addedAt'),
                      delete: t('delete'),
                      sources: t('sourcesToggle'),
                    }}
                  />
                ))}
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
