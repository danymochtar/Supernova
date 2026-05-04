'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUp, Square, Sparkles, Trash2 } from 'lucide-react';
import type { DeleteTurnResult } from '@/app/[locale]/ask/actions';
import { renderInlineMd } from './inlineMd';

export interface ChatTurn {
  id: string;
  question: string;
  answer: string;
  createdAt: string;
}

interface Frame {
  type: 'text' | 'done' | 'error';
  delta?: string;
  message?: string;
}

interface PriorPeriod {
  label: string;
  start: string;
  end: string;
  summary: string;
  turnCount: number;
}

interface Props {
  initialTurns: ChatTurn[];
  priorDays: PriorPeriod[];
  emptyHint: string;
  /** Short example prompts shown as tappable chips when the thread is empty. */
  starterPrompts?: string[];
  /** Server action to delete a persisted turn. */
  deleteAction?: (input: { id: string }) => Promise<DeleteTurnResult>;
}

export function ChatThread({
  initialTurns,
  priorDays,
  emptyHint,
  starterPrompts = [],
  deleteAction,
}: Props) {
  const t = useTranslations('chat');
  const [turns, setTurns] = useState<ChatTurn[]>(initialTurns);
  const [pending, setPending] = useState<{ question: string; answer: string } | null>(null);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [, startDelete] = useTransition();

  function onDelete(id: string) {
    // Optimistic remove. If the action fails (server-side miss) we restore
    // the turn and surface the generic error so the user knows it didn't
    // take. Local-only turns (haven't been persisted yet — happens during a
    // streaming reply or right after a fresh send) just need state removal.
    const previous = turns;
    setTurns((prev) => prev.filter((tn) => tn.id !== id));
    if (id.startsWith('local-') || !deleteAction) return;
    startDelete(async () => {
      const result = await deleteAction({ id });
      if (!result.ok) {
        setTurns(previous);
        setError(t('errorGeneric'));
      }
    });
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [turns.length, pending?.answer]);

  async function send() {
    const q = input.trim();
    if (!q || streaming) return;
    setError(null);
    setInput('');
    setPending({ question: q, answer: '' });
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/qa/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(
          data.error === 'no_profile'
            ? t('errorNoProfile')
            : data.error === 'invalid_question'
              ? t('errorInvalid')
              : t('errorGeneric'),
        );
        setPending(null);
        return;
      }

      if (!res.body) {
        setError(t('errorGeneric'));
        setPending(null);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let answerSoFar = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 1);
          if (!line) continue;
          let frame: Frame;
          try {
            frame = JSON.parse(line) as Frame;
          } catch {
            continue;
          }
          if (frame.type === 'text' && frame.delta) {
            answerSoFar += frame.delta;
            setPending({ question: q, answer: answerSoFar });
          } else if (frame.type === 'error') {
            setError(t('errorGeneric'));
            setPending(null);
            return;
          } else if (frame.type === 'done') {
            // commit pending turn into list
            setTurns((prev) => [
              ...prev,
              {
                id: `local-${Date.now()}`,
                question: q,
                answer: answerSoFar,
                createdAt: new Date().toISOString(),
              },
            ]);
            setPending(null);
            return;
          }
        }
      }
      // stream ended without 'done' — commit anyway
      setTurns((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          question: q,
          answer: answerSoFar,
          createdAt: new Date().toISOString(),
        },
      ]);
      setPending(null);
    } catch (err) {
      if ((err as { name?: string })?.name === 'AbortError') {
        if (pending?.answer) {
          setTurns((prev) => [
            ...prev,
            {
              id: `local-${Date.now()}`,
              question: pending.question,
              answer: pending.answer,
              createdAt: new Date().toISOString(),
            },
          ]);
        }
        setPending(null);
        return;
      }
      console.error('[chat] stream failed', err);
      setError(t('errorGeneric'));
      setPending(null);
    } finally {
      setStreaming(false);
    }
  }

  function abort() {
    abortRef.current?.abort();
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div
      className="flex flex-col"
      style={{ minHeight: 'calc(100dvh - 8rem - env(safe-area-inset-bottom))' }}
    >
      <div className="flex-1 overflow-y-auto pb-4">
        {priorDays.length > 0 ? (
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setShowHistory((v) => !v)}
              className="text-muted-foreground text-xs underline-offset-4 hover:underline"
            >
              {showHistory ? t('hideHistory') : t('showHistory', { count: priorDays.length })}
            </button>
            {showHistory ? (
              <div className="mt-3 space-y-3">
                {priorDays.map((d) => (
                  <div
                    key={d.start}
                    className="border-border rounded-xl border bg-white/40 p-4 dark:bg-neutral-900/40"
                  >
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                      {d.label}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed">{d.summary}</p>
                    <p className="text-muted-foreground mt-2 text-xs">
                      {t('turnCount', { count: d.turnCount })}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {turns.length === 0 && !pending ? (
          <div className="flex flex-col items-center gap-5 py-10 text-center">
            <div className="bg-primary/10 text-primary flex h-14 w-14 items-center justify-center rounded-full">
              <Sparkles className="h-6 w-6" aria-hidden />
            </div>
            <p className="text-muted-foreground max-w-sm text-sm">{emptyHint}</p>
            {starterPrompts.length > 0 ? (
              <div className="flex w-full max-w-md flex-col gap-2">
                {starterPrompts.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setInput(p)}
                    className="border-border press hover:bg-muted/40 rounded-xl border bg-white/40 px-4 py-3 text-left text-sm dark:bg-neutral-900/40"
                  >
                    {p}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            {turns.map((tn) => (
              <Pair
                key={tn.id}
                question={tn.question}
                answer={tn.answer}
                onDelete={() => onDelete(tn.id)}
                deleteLabel={t('delete')}
              />
            ))}
            {pending ? (
              <Pair
                question={pending.question}
                answer={pending.answer}
                streaming
              />
            ) : null}
          </div>
        )}

        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="border-border bg-background/95 flex items-end gap-2 border-t pt-3 supports-[backdrop-filter]:bg-background/80 supports-[backdrop-filter]:backdrop-blur"
      >
        <textarea
          rows={1}
          maxLength={4000}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder={t('placeholder')}
          disabled={streaming}
          className="border-border focus:ring-primary max-h-32 min-h-[2.5rem] flex-1 resize-none rounded-2xl border bg-transparent px-4 py-2 text-sm focus:outline-none focus:ring-2 disabled:opacity-50"
        />
        {streaming ? (
          <button
            type="button"
            onClick={abort}
            aria-label={t('stop')}
            className="press bg-muted text-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          >
            <Square className="h-4 w-4 fill-current" aria-hidden />
          </button>
        ) : (
          <button
            type="submit"
            disabled={input.trim().length < 1}
            aria-label={t('send')}
            className="bg-primary text-primary-foreground press flex h-10 w-10 shrink-0 items-center justify-center rounded-full disabled:opacity-30"
          >
            <ArrowUp className="h-5 w-5" aria-hidden />
          </button>
        )}
      </form>
    </div>
  );
}

function Pair({
  question,
  answer,
  streaming,
  onDelete,
  deleteLabel,
}: {
  question: string;
  answer: string;
  streaming?: boolean;
  onDelete?: () => void;
  deleteLabel?: string;
}) {
  return (
    <div className="group/pair relative space-y-3">
      <div className="flex justify-end">
        <div className="bg-primary text-primary-foreground max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-tr-md px-4 py-2.5 text-sm">
          {question}
        </div>
      </div>
      <div className="flex justify-start">
        <div className="border-border max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-tl-md border bg-white/60 px-4 py-2.5 text-sm dark:bg-neutral-900/60">
          {renderInlineMd(answer)}
          {streaming ? (
            <span className="ml-1 inline-block h-3 w-1.5 animate-pulse bg-neutral-400 align-middle" />
          ) : null}
        </div>
      </div>
      {onDelete && !streaming ? (
        <button
          type="button"
          onClick={onDelete}
          aria-label={deleteLabel}
          title={deleteLabel}
          className="text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 absolute -bottom-1 right-0 rounded-full p-1.5 opacity-60 transition group-hover/pair:opacity-100 sm:opacity-0"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
