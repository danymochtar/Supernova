'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

type Status = 'idle' | 'streaming' | 'done' | 'error';

interface Frame {
  type: 'text' | 'done' | 'error';
  delta?: string;
  message?: string;
}

export function AskForm() {
  const t = useTranslations('ask');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'streaming') return;

    setAnswer('');
    setErrorMsg(null);
    setStatus('streaming');

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/qa/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (data.error === 'rate_limited') {
          setErrorMsg(t('errorRateLimited'));
        } else if (data.error === 'invalid_question') {
          setErrorMsg(t('errorInvalid'));
        } else if (data.error === 'no_profile') {
          setErrorMsg(t('errorNoProfile'));
        } else {
          setErrorMsg(t('errorGeneric'));
        }
        setStatus('error');
        return;
      }

      if (!res.body) {
        setErrorMsg(t('errorGeneric'));
        setStatus('error');
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

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
            setAnswer((prev) => prev + frame.delta);
          } else if (frame.type === 'error') {
            setErrorMsg(t('errorGeneric'));
            setStatus('error');
            return;
          } else if (frame.type === 'done') {
            setStatus('done');
            return;
          }
        }
      }
      setStatus('done');
    } catch (err) {
      if ((err as { name?: string })?.name === 'AbortError') return;
      console.error('[ask] stream failed', err);
      setErrorMsg(t('errorGeneric'));
      setStatus('error');
    }
  }

  function onAbort() {
    abortRef.current?.abort();
    setStatus('idle');
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-3">
        <label htmlFor="question" className="block text-sm font-medium">
          {t('label')}
        </label>
        <textarea
          id="question"
          required
          minLength={2}
          maxLength={2000}
          rows={3}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t('placeholder')}
          disabled={status === 'streaming'}
          className="border-border focus:ring-primary w-full rounded-lg border bg-transparent px-4 py-3 text-sm focus:outline-none focus:ring-2 disabled:opacity-50"
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-muted-foreground text-xs">{t('hint')}</p>
          {status === 'streaming' ? (
            <button
              type="button"
              onClick={onAbort}
              className="border-border rounded-lg border px-4 py-2 text-sm font-medium"
            >
              {t('stop')}
            </button>
          ) : (
            <button
              type="submit"
              disabled={question.trim().length < 2}
              className="bg-primary text-primary-foreground rounded-lg px-5 py-2 text-sm font-medium disabled:opacity-50"
            >
              {t('submit')}
            </button>
          )}
        </div>
      </form>

      {errorMsg ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {errorMsg}
        </div>
      ) : null}

      {answer ? (
        <article className="border-border space-y-3 rounded-2xl border bg-gradient-to-br from-purple-50 to-amber-50 p-6 dark:from-purple-950/30 dark:to-amber-950/30">
          <header className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
            {t('answerTitle')}
          </header>
          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-neutral-800 dark:text-neutral-200">
            {answer}
            {status === 'streaming' ? (
              <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-neutral-400 align-middle" />
            ) : null}
          </div>
        </article>
      ) : null}
    </div>
  );
}
