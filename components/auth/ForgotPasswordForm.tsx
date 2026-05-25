'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ShieldCheck } from 'lucide-react';
import type { Relationship } from '@prisma/client';
import type { Locale } from '@/lib/i18n/config';
import { startRecovery, submitReset } from '@/app/[locale]/forgot-password/actions';

type Phase = 'email' | 'questions' | 'unavailable' | 'done';

export function ForgotPasswordForm({ locale }: { locale: Locale }) {
  const t = useTranslations('forgot');
  const tr = useTranslations('people');

  const [phase, setPhase] = useState<Phase>('email');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [token, setToken] = useState('');
  const [slots, setSlots] = useState<Relationship[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const inputClass =
    'border-border focus:ring-primary w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2';

  async function onEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await startRecovery({ email });
      if (!res.ok) {
        setErrorMsg(res.error === 'rate' ? t('errorRate') : t('errorGeneric'));
        return;
      }
      if (!res.available) {
        setPhase('unavailable');
        return;
      }
      setToken(res.token);
      setSlots(res.slots);
      setAnswers(res.slots.map(() => ''));
      setPhase('questions');
    } catch {
      setErrorMsg(t('errorGeneric'));
    } finally {
      setSubmitting(false);
    }
  }

  async function onResetSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    if (password !== confirm) {
      setErrorMsg(t('errorMismatch'));
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitReset({ token, answers, newPassword: password });
      if (res.ok) {
        setPhase('done');
        return;
      }
      const map: Record<string, string> = {
        wrong: t('errorWrong'),
        locked: t('errorLocked'),
        expired: t('errorExpired'),
        weak: t('errorWeak'),
        generic: t('errorGeneric'),
      };
      setErrorMsg(map[res.error] ?? t('errorGeneric'));
    } catch {
      setErrorMsg(t('errorGeneric'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <Image
          src="/icons/icon.svg"
          alt="Supernova"
          width={64}
          height={64}
          className="rounded-2xl shadow-md shadow-primary/20"
          priority
        />
        <div className="space-y-1">
          <h1 className="font-serif text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground text-sm">
            {phase === 'questions' ? t('questionsSubtitle') : t('subtitle')}
          </p>
        </div>
      </div>

      {phase === 'email' ? (
        <form onSubmit={onEmailSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              {t('emailLabel')}
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="bg-primary text-primary-foreground press w-full rounded-full px-4 py-3 text-sm font-medium shadow-md shadow-primary/20 disabled:opacity-50"
          >
            {submitting ? t('submitting') : t('continue')}
          </button>
          {errorMsg ? <p className="text-sm text-red-600">{errorMsg}</p> : null}
        </form>
      ) : null}

      {phase === 'questions' ? (
        <form onSubmit={onResetSubmit} className="space-y-5">
          <div className="bg-surface-2 text-muted-foreground flex items-start gap-2 rounded-xl p-3 text-xs">
            <ShieldCheck className="text-primary mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{t('questionsHint')}</span>
          </div>

          {slots.map((slot, i) => (
            <div key={`${slot}-${i}`} className="space-y-2">
              <label htmlFor={`q-${i}`} className="text-sm font-medium">
                {t('questionLabel', { relationship: tr(`relationship.${slot}`) })}
              </label>
              <input
                id={`q-${i}`}
                type="text"
                required
                autoComplete="off"
                value={answers[i] ?? ''}
                onChange={(e) =>
                  setAnswers((prev) => {
                    const next = [...prev];
                    next[i] = e.target.value;
                    return next;
                  })
                }
                placeholder={t('answerPlaceholder')}
                className={inputClass}
              />
            </div>
          ))}

          <div className="space-y-2">
            <label htmlFor="new-password" className="text-sm font-medium">
              {t('newPasswordLabel')}
            </label>
            <input
              id="new-password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('newPasswordPlaceholder')}
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirm-password" className="text-sm font-medium">
              {t('confirmPasswordLabel')}
            </label>
            <input
              id="confirm-password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={t('newPasswordPlaceholder')}
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="bg-primary text-primary-foreground press w-full rounded-full px-4 py-3 text-sm font-medium shadow-md shadow-primary/20 disabled:opacity-50"
          >
            {submitting ? t('submitting') : t('resetSubmit')}
          </button>
          {errorMsg ? <p className="text-sm text-red-600">{errorMsg}</p> : null}
        </form>
      ) : null}

      {phase === 'unavailable' ? (
        <div className="space-y-4 text-center">
          <p className="text-muted-foreground text-sm">{t('unavailable')}</p>
          <Link
            href={`/${locale}/login`}
            className="text-primary inline-block text-sm font-medium underline-offset-4 hover:underline"
          >
            {t('backToLogin')}
          </Link>
        </div>
      ) : null}

      {phase === 'done' ? (
        <div className="space-y-4 text-center">
          <p className="text-sm">{t('done')}</p>
          <Link
            href={`/${locale}/login`}
            className="bg-primary text-primary-foreground press inline-block rounded-full px-6 py-3 text-sm font-medium shadow-md shadow-primary/20"
          >
            {t('backToLogin')}
          </Link>
        </div>
      ) : null}

      {phase === 'email' ? (
        <p className="text-muted-foreground text-center text-sm">
          <Link
            href={`/${locale}/login`}
            className="text-primary font-medium underline-offset-4 hover:underline"
          >
            {t('backToLogin')}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
