'use client';

import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import type { DeletePersonResult } from '@/app/[locale]/people/actions';

interface Props {
  personId: string;
  locale: string;
  /** Pre-localized confirm copy with the name already interpolated. */
  confirmLabel: string;
  buttonLabel: string;
  /** Pre-localized error label shown if the action returns ok:false. */
  errorLabel: string;
  action: (formData: FormData) => Promise<DeletePersonResult>;
}

export function DeletePersonButton({
  personId,
  locale,
  confirmLabel,
  buttonLabel,
  errorLabel,
  action,
}: Props) {
  const [pending, start] = useTransition();

  function onClick() {
    if (!window.confirm(confirmLabel)) return;
    const fd = new FormData();
    fd.set('id', personId);
    fd.set('locale', locale);
    start(async () => {
      const result = await action(fd);
      // On success the action throws NEXT_REDIRECT and we never get here.
      // Any other return means the server explicitly refused (auth /
      // not-found / generic) — surface as an alert so the user knows
      // it didn't silently no-op.
      if (result && !result.ok) {
        window.alert(errorLabel);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="press inline-flex items-center justify-center gap-2 rounded-full border border-red-300 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/60 dark:text-red-300 dark:hover:bg-red-950/30"
    >
      <Trash2 className="h-4 w-4" aria-hidden />
      {buttonLabel}
    </button>
  );
}
