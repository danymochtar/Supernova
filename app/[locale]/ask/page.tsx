import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ChatThread } from '@/components/qa/ChatThread';
import { deleteTurnAction } from './actions';
import { addToJournalAction } from '@/app/[locale]/journal/actions';
import { getSession } from '@/lib/auth/requireSession';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { getRecentTurns } from '@/lib/db/repositories/qa';
import { getJournalDigest, listOpenActionItems } from '@/lib/db/repositories/journal';
import { isLocale, type Locale } from '@/lib/i18n/config';

/** Trim an action-item title to a chip-friendly length. */
function chipTrim(s: string, max = 32): string {
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length <= max ? t : `${t.slice(0, max - 1).trim()}…`;
}

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

  const [recentTurns, digest, openItems] = await Promise.all([
    getRecentTurns(session.user.id, HISTORY_WINDOW),
    getJournalDigest(session.user.id, 14),
    listOpenActionItems(session.user.id, 14, 2),
  ]);

  // Behavior-aware suggestion chips — built from what the user actually
  // journals about (top themes) + anything they said they'd do but haven't
  // (open follow-ups). Falls back to the generic starters in ChatThread
  // when the user has no history yet (suggestions stays empty).
  const suggestions: string[] = [];
  if (openItems[0]) {
    suggestions.push(t('suggestFollowUp', { item: chipTrim(openItems[0].title) }));
  }
  for (const th of (digest?.topThemes ?? []).slice(0, 2)) {
    suggestions.push(t('suggestTheme', { theme: th.name }));
  }
  // Only surface the personalized set when there's genuine signal (a
  // follow-up or at least one journaled theme). A lone vibe-check isn't
  // "behavior-aware" enough to displace the curated starters.
  if (suggestions.length > 0) suggestions.push(t('suggestVibe'));
  const personalized = suggestions.slice(0, 4);

  return (
    <main
      className="container max-w-3xl px-4 pb-4 sm:px-6 sm:pb-6"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
    >
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
        suggestions={personalized}
        deleteAction={deleteTurnAction}
        journalAction={addToJournalAction}
      />
    </main>
  );
}
