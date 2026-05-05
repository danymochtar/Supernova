import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ChatThread } from '@/components/qa/ChatThread';
import { deleteTurnAction } from './actions';
import { getSession } from '@/lib/auth/requireSession';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { getRecentTurns } from '@/lib/db/repositories/qa';
import { isLocale, type Locale } from '@/lib/i18n/config';

export const dynamic = 'force-dynamic';

/**
 * How many of the most recent turns to hydrate into the chat. Mirrors the
 * server-side history window the streaming route sends to the model, so what
 * the user sees on screen and what the assistant remembers stay aligned.
 */
const HISTORY_WINDOW = 50;

export default async function AskPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id';
  const t = await getTranslations({ locale, namespace: 'chat' });

  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const profile = await getProfileByUserId(session.user.id);
  if (!profile) redirect(`/${locale}/welcome`);

  const recentTurns = await getRecentTurns(session.user.id, HISTORY_WINDOW);

  return (
    <main className="container max-w-3xl px-4 py-4 sm:px-6 sm:py-6">
      <header className="mb-4 space-y-1 pt-2">
        <h1 className="font-serif text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </header>

      <ChatThread
        initialTurns={recentTurns.map((tn) => ({
          id: tn.id,
          question: tn.question,
          answer: tn.answer,
          createdAt: tn.createdAt.toISOString(),
        }))}
        emptyHint={t('emptyHint')}
        starterPrompts={[t('starter1'), t('starter2'), t('starter3'), t('starter4')]}
        deleteAction={deleteTurnAction}
      />
    </main>
  );
}
