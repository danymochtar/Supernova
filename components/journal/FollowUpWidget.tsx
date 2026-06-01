'use client';

import { useOptimistic, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowUp, CalendarPlus, Check, ChevronDown, ListTodo, MessageCircle, X } from 'lucide-react';
import type { Locale } from '@/lib/i18n/config';
import type { RespondActionItemResult } from '@/app/[locale]/journal/actions';
import { Modal } from '@/components/layout/Modal';

export interface OpenActionItemLite {
  id: string;
  title: string;
  /** ISO timestamp of when the parent entry was created. */
  entryAddedAt: string;
  entryId: string;
  entryEmotion: string | null;
  entryTheme: string | null;
  /** A reply the user left without closing the item, if any. */
  note: string | null;
  /** Pre-computed integer days since the parent entry was added. */
  daysAgo: number;
}

interface Props {
  locale: Locale;
  items: OpenActionItemLite[];
  respondAction: (input: {
    entryId: string;
    itemId: string;
    status?: 'done' | 'skip' | 'open';
    note?: string | null;
  }) => Promise<RespondActionItemResult>;
}

type Optim =
  | { kind: 'remove'; id: string }
  | { kind: 'note'; id: string; note: string };

/**
 * Dashboard widget surfacing open action items from recent journal entries.
 * Tap a row to expand it: mark Done / Skip (removes it) or leave a short
 * text reply (keeps it, saves the note). Collapsed by default so the list
 * stays calm.
 */
export function FollowUpWidget({ locale, items, respondAction }: Props) {
  const t = useTranslations('followUp');
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  // After the user sends a reply, surface a popup offering the natural
  // next move: close the loop ("Selesai") or carry it into chat
  // ("Curhatin dulu") on the same topic as the parent journal entry.
  const [replyPopup, setReplyPopup] = useState<{ item: OpenActionItemLite; note: string } | null>(
    null,
  );

  const [optimisticItems, applyOptim] = useOptimistic(
    items,
    (state: OpenActionItemLite[], action: Optim) =>
      action.kind === 'remove'
        ? state.filter((it) => it.id !== action.id)
        : state.map((it) => (it.id === action.id ? { ...it, note: action.note } : it)),
  );

  function close(item: OpenActionItemLite, status: 'done' | 'skip') {
    setOpenId(null);
    startTransition(async () => {
      applyOptim({ kind: 'remove', id: item.id });
      await respondAction({ entryId: item.entryId, itemId: item.id, status });
    });
  }

  function sendReply(item: OpenActionItemLite) {
    const note = draft.trim();
    if (!note) return;
    setDraft('');
    setOpenId(null);
    // Save the note immediately so it survives the popup outcome, then
    // open the popup to let the user choose what's next.
    startTransition(async () => {
      applyOptim({ kind: 'note', id: item.id, note });
      await respondAction({ entryId: item.entryId, itemId: item.id, note });
    });
    setReplyPopup({ item, note });
  }

  function finishFromPopup() {
    if (!replyPopup) return;
    const { item } = replyPopup;
    setReplyPopup(null);
    startTransition(async () => {
      applyOptim({ kind: 'remove', id: item.id });
      await respondAction({ entryId: item.entryId, itemId: item.id, status: 'done' });
    });
  }

  function chatFromPopup() {
    if (!replyPopup) return;
    const { item } = replyPopup;
    // The follow-up's parent entry carries a theme/category; pass it as
    // the chat topic so the new thread opens already focused. Fall back
    // to a neutral topic if the entry has none.
    const topic = (item.entryTheme ?? 'pribadi').toLowerCase();
    setReplyPopup(null);
    router.push(`/${locale}/ask?topic=${encodeURIComponent(topic)}`);
  }

  if (optimisticItems.length === 0) return null;

  return (
    <section className="border-border space-y-3 rounded-2xl border bg-surface-1 p-5">
      <div className="flex items-center gap-2">
        <div className="bg-accent/15 text-accent-foreground/80 flex h-8 w-8 items-center justify-center rounded-full">
          <ListTodo className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold">{t('title')}</h2>
          <p className="text-muted-foreground text-xs">{t('subtitle')}</p>
        </div>
      </div>

      <Modal
        open={replyPopup !== null}
        onClose={() => setReplyPopup(null)}
        title={<h3 className="text-base font-semibold">{t('popupTitle')}</h3>}
      >
        {replyPopup ? (
          <div className="space-y-4">
            <p className="text-sm leading-snug text-neutral-800 dark:text-neutral-200">
              {replyPopup.item.title}
            </p>
            <p className="text-muted-foreground border-border/60 border-l-2 pl-3 text-sm italic">
              {replyPopup.note}
            </p>
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={finishFromPopup}
                disabled={pending}
                className="press-soft inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500/15 px-4 py-3 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-500/25 disabled:opacity-50 dark:text-emerald-300"
              >
                <Check className="h-4 w-4" aria-hidden />
                {t('done')}
              </button>
              <button
                type="button"
                onClick={chatFromPopup}
                disabled={pending}
                className="bg-primary text-primary-foreground press inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium disabled:opacity-50"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                {t('chatItOut')}
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <ul className="space-y-1.5">
        {optimisticItems.map((item) => {
          const open = openId === item.id;
          return (
            <li
              key={item.id}
              className="border-border/60 overflow-hidden rounded-xl border bg-surface-2/40"
            >
              <div className="flex items-start gap-2 px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setOpenId(open ? null : item.id);
                    setDraft('');
                  }}
                  aria-expanded={open}
                  aria-label={t('respond')}
                  className="press-soft flex min-w-0 flex-1 items-start gap-2 text-left"
                >
                  <ChevronDown
                    className={`text-muted-foreground mt-0.5 h-4 w-4 shrink-0 transition-transform ios-ease ${open ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-sm leading-snug text-neutral-800 dark:text-neutral-200">
                      {item.title}
                    </p>
                    <p className="text-muted-foreground flex items-center gap-1.5 text-[10px] uppercase tracking-wider">
                      <span className="tabular-nums">
                        {item.daysAgo === 0
                          ? t('today')
                          : item.daysAgo === 1
                            ? t('yesterday')
                            : t('daysAgo', { count: item.daysAgo })}
                      </span>
                      {item.entryTheme ? (
                        <>
                          <span aria-hidden>·</span>
                          <span>{item.entryTheme}</span>
                        </>
                      ) : null}
                    </p>
                    {item.note ? (
                      <p className="text-muted-foreground border-border/60 mt-1 border-l-2 pl-2 text-xs italic">
                        {item.note}
                      </p>
                    ) : null}
                  </div>
                </button>
                <a
                  href={`/api/journal/ics?entryId=${item.entryId}&itemId=${item.id}`}
                  download
                  aria-label={t('addToCalendar')}
                  title={t('addToCalendar')}
                  className="press-soft text-muted-foreground hover:text-primary hover:bg-muted/40 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors"
                >
                  <CalendarPlus className="h-3.5 w-3.5" aria-hidden />
                </a>
              </div>

              {open ? (
                <div className="border-border/60 space-y-2.5 border-t px-3 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => close(item, 'done')}
                      disabled={pending}
                      className="press-soft inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-2 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-500/25 disabled:opacity-50 dark:text-emerald-300"
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden />
                      {t('done')}
                    </button>
                    <button
                      type="button"
                      onClick={() => close(item, 'skip')}
                      disabled={pending}
                      className="press-soft text-muted-foreground hover:bg-muted/60 inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-fill-1 px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden />
                      {t('skip')}
                    </button>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendReply(item);
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      maxLength={280}
                      placeholder={t('replyPlaceholder')}
                      className="border-border focus:ring-primary min-w-0 flex-1 rounded-lg border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2"
                    />
                    <button
                      type="submit"
                      disabled={pending || draft.trim().length === 0}
                      aria-label={t('replySend')}
                      className="bg-primary text-primary-foreground press inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg disabled:opacity-40"
                    >
                      <ArrowUp className="h-4 w-4" aria-hidden />
                    </button>
                  </form>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
