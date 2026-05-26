'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUp, ArrowUpRight, MessageCircle, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Category } from '@/lib/curhat/categories';
import type { Locale } from '@/lib/i18n/config';
import { renderInlineMd } from '@/components/qa/inlineMd';

/**
 * Floating "curhat" button — one per capability page. Tapping the chat-icon
 * FAB opens a lightweight quick-ask box (topic chip + input) anchored above
 * it: the reply streams inline, and the turn is persisted + tagged so it
 * shows up in the full Curhat tab and gets journaled. "Buka full" deep-links
 * to /ask for the full thread + history.
 */
export function CurhatShortcut({
  locale,
  topic,
  personId,
  label,
  className = 'bottom-24 right-4',
}: {
  locale: Locale;
  topic: Category;
  personId?: string;
  /** Accessible label for the FAB. */
  label: string;
  className?: string;
}) {
  const t = useTranslations('chat');
  const tCat = useTranslations('categories');

  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fullParams = new URLSearchParams({ topic });
  if (topic === 'relationship' && personId) fullParams.set('personId', personId);
  const fullHref = `/${locale}/ask?${fullParams.toString()}`;

  function close() {
    abortRef.current?.abort();
    setOpen(false);
  }

  async function send() {
    const q = question.trim();
    if (!q || streaming) return;
    setStreaming(true);
    setError(null);
    setAnswer('');
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch('/api/qa/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          topic,
          aboutPersonId: topic === 'relationship' ? personId : undefined,
        }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        setError(t('errorGeneric'));
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let acc = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          let frame: { type?: string; delta?: string; message?: string };
          try {
            frame = JSON.parse(line);
          } catch {
            continue;
          }
          if (frame.type === 'text' && frame.delta) {
            acc += frame.delta;
            setAnswer(acc);
          } else if (frame.type === 'error') {
            setError(frame.message ?? t('errorGeneric'));
          }
        }
      }
      setQuestion('');
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        setError(t('errorGeneric'));
      }
    } finally {
      setStreaming(false);
    }
  }

  const paragraphs = answer
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={label}
          title={label}
          className={`from-primary to-accent text-primary-foreground press fixed z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br shadow-lg ${className}`}
        >
          <MessageCircle className="h-6 w-6" aria-hidden />
        </button>
      ) : (
        <>
          {/* Transparent tap-catcher to dismiss */}
          <button
            type="button"
            aria-label={t('quickClose')}
            onClick={close}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="border-border bg-background/95 animate-in slide-in-from-bottom-4 fade-in ios-ease fixed inset-x-3 bottom-24 z-50 mx-auto max-w-md space-y-2.5 rounded-3xl border p-3 shadow-lg duration-200 supports-[backdrop-filter]:bg-background/80 supports-[backdrop-filter]:backdrop-blur sm:px-4"
          >
            {/* Header — topic chip + open-full + close */}
            <div className="flex items-center gap-2">
              <span className="bg-primary/10 text-primary inline-flex items-center rounded-full px-3 py-1 text-xs font-medium">
                {tCat(topic)}
              </span>
              <Link
                href={fullHref}
                className="press-soft text-muted-foreground hover:text-foreground ml-auto inline-flex items-center gap-1 text-xs font-medium"
              >
                {t('quickOpenFull')}
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
              <button
                type="button"
                onClick={close}
                aria-label={t('quickClose')}
                className="press text-muted-foreground hover:text-foreground inline-flex h-7 w-7 items-center justify-center rounded-full"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {error ? <p className="px-1 text-sm text-red-600">{error}</p> : null}

            {paragraphs.length > 0 ? (
              <div className="bg-surface-1 max-h-60 space-y-2 overflow-y-auto rounded-2xl p-3 text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-200">
                {paragraphs.map((p, i) => (
                  <p key={i}>{renderInlineMd(p)}</p>
                ))}
              </div>
            ) : null}

            {/* Composer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex items-end gap-2"
            >
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                maxLength={4000}
                placeholder={t('placeholder')}
                className="border-border focus:ring-primary max-h-28 min-h-[2.75rem] flex-1 resize-none rounded-2xl border bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
              />
              <button
                type="submit"
                disabled={streaming || question.trim().length === 0}
                aria-label={t('send')}
                className="bg-primary text-primary-foreground press inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full disabled:opacity-40"
              >
                <ArrowUp className="h-5 w-5" aria-hidden />
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
}
