'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { signIn } from '@/lib/auth/client';
import type { Locale } from '@/lib/i18n/config';

export function LoginForm({ locale }: { locale: Locale }) {
  const t = useTranslations('login');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg(null);
    try {
      const callbackURL = `/${locale}/welcome`;
      const result = await signIn.magicLink({ email, callbackURL });
      if (result?.error) {
        console.error('[login] signIn.magicLink error', result.error);
        setStatus('error');
        setErrorMsg(result.error.message ?? t('errorGeneric'));
        return;
      }
      setStatus('sent');
    } catch (err) {
      console.error('[login] signIn.magicLink threw', err);
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : t('errorGeneric'));
    }
  }

  if (status === 'sent') {
    return (
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t('checkEmailTitle')}</h1>
        <p className="text-muted-foreground mt-3 text-sm">
          {t('checkEmailBody', { email })}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </div>
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          {t('emailLabel')}
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('emailPlaceholder')}
          className="border-border w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <button
        type="submit"
        disabled={status === 'submitting'}
        className="bg-primary text-primary-foreground w-full rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
      >
        {status === 'submitting' ? t('submitting') : t('submit')}
      </button>
      {errorMsg ? <p className="text-sm text-red-600">{errorMsg}</p> : null}
    </form>
  );
}
