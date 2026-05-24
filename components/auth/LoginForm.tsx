'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { signIn, signUp } from '@/lib/auth/client';
import type { Locale } from '@/lib/i18n/config';

type Mode = 'signIn' | 'signUp';

export function LoginForm({ locale }: { locale: Locale }) {
  const t = useTranslations('login');
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    const callbackURL = `/${locale}/welcome`;
    try {
      const result =
        mode === 'signIn'
          ? await signIn.email({ email, password, callbackURL })
          : await signUp.email({ email, password, name: email, callbackURL });

      if (result?.error) {
        console.error('[login] auth error', result.error);
        setErrorMsg(result.error.message ?? t('errorGeneric'));
        return;
      }
      router.push(callbackURL);
      router.refresh();
    } catch (err) {
      console.error('[login] auth threw', err);
      setErrorMsg(err instanceof Error ? err.message : t('errorGeneric'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-sm space-y-6">
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
          <h1 className="font-serif text-2xl font-semibold tracking-tight">
            {mode === 'signIn' ? t('signInTitle') : t('signUpTitle')}
          </h1>
          <p className="text-muted-foreground text-sm">
            {mode === 'signIn' ? t('signInSubtitle') : t('signUpSubtitle')}
          </p>
        </div>
      </div>

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
          className="border-border focus:ring-primary w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          {t('passwordLabel')}
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('passwordPlaceholder')}
          className="border-border focus:ring-primary w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
        />
        {mode === 'signUp' ? (
          <p className="text-muted-foreground text-xs">{t('passwordHint')}</p>
        ) : (
          <div className="text-right">
            <Link
              href={`/${locale}/forgot-password`}
              className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
            >
              {t('forgotPassword')}
            </Link>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="bg-primary text-primary-foreground press w-full rounded-full px-4 py-3 text-sm font-medium shadow-md shadow-primary/20 disabled:opacity-50"
      >
        {submitting ? t('submitting') : mode === 'signIn' ? t('signInSubmit') : t('signUpSubmit')}
      </button>

      {errorMsg ? <p className="text-sm text-red-600">{errorMsg}</p> : null}

      <p className="text-muted-foreground text-center text-sm">
        {mode === 'signIn' ? t('noAccount') : t('hasAccount')}{' '}
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'signIn' ? 'signUp' : 'signIn');
            setErrorMsg(null);
          }}
          className="text-primary font-medium underline-offset-4 hover:underline"
        >
          {mode === 'signIn' ? t('switchToSignUp') : t('switchToSignIn')}
        </button>
      </p>
    </form>
  );
}
