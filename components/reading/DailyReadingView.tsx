'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { parseReading } from '@/lib/ai/prompts/daily';
import type { GenerateResult } from '@/app/[locale]/dashboard/actions';

interface Props {
  initialBody: string | null;
  generate: () => Promise<GenerateResult>;
}

export function DailyReadingView({ initialBody, generate }: Props) {
  const t = useTranslations('reading');
  const [body, setBody] = useState<string | null>(initialBody);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generate();
      if (result.ok) {
        setBody(result.body);
      } else {
        setError(t(result.error === 'ai_failed' ? 'errorAi' : 'errorGeneric'));
      }
    });
  }

  if (!body) {
    return (
      <section className="border-border space-y-3 rounded-2xl border bg-gradient-to-br from-purple-50 to-amber-50 p-6 dark:from-purple-950/30 dark:to-amber-950/30">
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
        <button
          type="button"
          onClick={onGenerate}
          disabled={pending}
          className="bg-primary text-primary-foreground press rounded-lg px-5 py-2.5 text-sm font-medium disabled:opacity-50"
        >
          {pending ? t('generating') : t('generateCta')}
        </button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </section>
    );
  }

  const parsed = parseReading(body);
  const hasStructured = parsed.theme || parsed.energy || parsed.watch || parsed.affirmation;

  return (
    <section className="border-border space-y-5 rounded-2xl border bg-gradient-to-br from-purple-50 to-amber-50 p-6 dark:from-purple-950/30 dark:to-amber-950/30">
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <span className="text-muted-foreground text-xs">{t('oncePerDay')}</span>
      </header>

      {hasStructured ? (
        <div className="space-y-5">
          <Block label={t('theme')} text={parsed.theme} />
          <Block label={t('energy')} text={parsed.energy} />
          <Block label={t('watch')} text={parsed.watch} />
          {parsed.affirmation ? (
            <blockquote className="border-primary border-l-4 pl-4 italic text-neutral-700 dark:text-neutral-300">
              {parsed.affirmation}
            </blockquote>
          ) : null}
        </div>
      ) : (
        <div className="prose prose-sm max-w-none whitespace-pre-wrap text-neutral-800 dark:text-neutral-200">
          {body}
        </div>
      )}
    </section>
  );
}

function Block({ label, text }: { label: string; text: string }) {
  if (!text) return null;
  return (
    <div className="space-y-1">
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{label}</p>
      <p className="text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">{text}</p>
    </div>
  );
}
