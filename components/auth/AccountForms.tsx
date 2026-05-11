'use client';

import { useState, useTransition } from 'react';
import { Check, Mail, Lock } from 'lucide-react';
import {
  changeEmailAction,
  changePasswordAction,
  type AccountActionResult,
} from '@/app/[locale]/me/account/actions';

interface CommonLabels {
  save: string;
  saving: string;
  saved: string;
  errors: {
    invalid: string;
    wrong_password: string;
    email_taken: string;
    same_email: string;
    weak_password: string;
    generic: string;
  };
}

function errorCopy(
  result: Exclude<AccountActionResult, { ok: true }>,
  labels: CommonLabels,
): string {
  switch (result.error) {
    case 'invalid':
      return labels.errors.invalid;
    case 'wrong_password':
      return labels.errors.wrong_password;
    case 'email_taken':
      return labels.errors.email_taken;
    case 'same_email':
      return labels.errors.same_email;
    case 'weak_password':
      return labels.errors.weak_password;
    default:
      return labels.errors.generic;
  }
}

export function ChangeEmailForm({
  currentEmail,
  labels,
  common,
}: {
  currentEmail: string;
  labels: { title: string; hint: string; field: string; placeholder: string };
  common: CommonLabels;
}) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setDone(false);
    const newEmail = value.trim();
    if (!newEmail || newEmail === currentEmail) {
      setError(common.errors.same_email);
      return;
    }
    start(async () => {
      const result = await changeEmailAction({ newEmail });
      if (result.ok) {
        setDone(true);
        setValue('');
      } else {
        setError(errorCopy(result, common));
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Mail className="h-4 w-4" aria-hidden />
          {labels.title}
        </p>
        <p className="text-muted-foreground text-xs leading-relaxed">{labels.hint}</p>
      </div>
      <div className="space-y-1">
        <label htmlFor="newEmail" className="text-muted-foreground text-xs uppercase tracking-wider">
          {labels.field}
        </label>
        <input
          id="newEmail"
          name="newEmail"
          type="email"
          autoComplete="email"
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={labels.placeholder ?? currentEmail}
          className="border-border focus:ring-primary w-full rounded-xl border bg-transparent px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
        />
      </div>
      {error ? <p className="text-xs text-red-700 dark:text-red-300">{error}</p> : null}
      {done ? (
        <p className="inline-flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300">
          <Check className="h-3.5 w-3.5" aria-hidden />
          {common.saved}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending || value.trim().length === 0}
        className="bg-primary text-primary-foreground press inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {pending ? common.saving : common.save}
      </button>
    </form>
  );
}

export function ChangePasswordForm({
  labels,
  common,
}: {
  labels: {
    title: string;
    hint: string;
    currentField: string;
    newField: string;
    confirmField: string;
    mismatchError: string;
  };
  common: CommonLabels;
}) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setDone(false);
    if (next !== confirm) {
      setError(labels.mismatchError);
      return;
    }
    if (next.length < 8) {
      setError(common.errors.weak_password);
      return;
    }
    start(async () => {
      const result = await changePasswordAction({ currentPassword: current, newPassword: next });
      if (result.ok) {
        setDone(true);
        setCurrent('');
        setNext('');
        setConfirm('');
      } else {
        setError(errorCopy(result, common));
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Lock className="h-4 w-4" aria-hidden />
          {labels.title}
        </p>
        <p className="text-muted-foreground text-xs leading-relaxed">{labels.hint}</p>
      </div>
      <div className="space-y-1">
        <label htmlFor="currentPassword" className="text-muted-foreground text-xs uppercase tracking-wider">
          {labels.currentField}
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          className="border-border focus:ring-primary w-full rounded-xl border bg-transparent px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="newPassword" className="text-muted-foreground text-xs uppercase tracking-wider">
          {labels.newField}
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={next}
          onChange={(e) => setNext(e.target.value)}
          className="border-border focus:ring-primary w-full rounded-xl border bg-transparent px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="confirmPassword" className="text-muted-foreground text-xs uppercase tracking-wider">
          {labels.confirmField}
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="border-border focus:ring-primary w-full rounded-xl border bg-transparent px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
        />
      </div>
      {error ? <p className="text-xs text-red-700 dark:text-red-300">{error}</p> : null}
      {done ? (
        <p className="inline-flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300">
          <Check className="h-3.5 w-3.5" aria-hidden />
          {common.saved}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={
          pending || current.length === 0 || next.length === 0 || confirm.length === 0
        }
        className="bg-primary text-primary-foreground press inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {pending ? common.saving : common.save}
      </button>
    </form>
  );
}
