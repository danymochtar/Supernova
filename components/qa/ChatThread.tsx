'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

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
}

export function ChatThread({ initialTurns, priorDays, emptyHint }: Props) {
  const t = useTranslations('chat');
  const [turns, setTurns] = useState<ChatTurn[]>(initialTurns);
  const [pending, setPending] = useState<{ question: string; answer: string } | null>(null);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [showHistory, setShowHistory] = useState(false);

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
    <div className="flex h-[calc(100vh-12rem)] flex-col">
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
          <div className="text-muted-foreground py-10 text-center text-sm">{emptyHint}</div>
        ) : (
          <div className="space-y-4">
            {turns.map((tn) => (
              <Pair key={tn.id} question={tn.question} answer={tn.answer} />
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
        className="border-border bg-background flex items-end gap-2 border-t pt-4"
      >
        <textarea
          rows={2}
          maxLength={4000}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder={t('placeholder')}
          disabled={streaming}
          className="border-border focus:ring-primary flex-1 resize-none rounded-lg border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 disabled:opacity-50"
        />
        {streaming ? (
          <button
            type="button"
            onClick={abort}
            className="border-border rounded-lg border px-4 py-2 text-sm font-medium"
          >
            {t('stop')}
          </button>
        ) : (
          <button
            type="submit"
            disabled={input.trim().length < 1}
            className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {t('send')}
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
}: {
  question: string;
  answer: string;
  streaming?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <div className="bg-primary text-primary-foreground max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-tr-md px-4 py-2.5 text-sm">
          {question}
        </div>
      </div>
      <div className="flex justify-start">
        <div className="border-border max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-tl-md border bg-white/60 px-4 py-2.5 text-sm dark:bg-neutral-900/60">
          {answer}
          {streaming ? (
            <span className="ml-1 inline-block h-3 w-1.5 animate-pulse bg-neutral-400 align-middle" />
          ) : null}
        </div>
      </div>
    </div>
  );
}
