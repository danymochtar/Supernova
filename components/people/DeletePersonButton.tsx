'use client';

import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';

interface Props {
  personId: string;
  locale: string;
  /** Pre-localized confirm copy with the name already interpolated. */
  confirmLabel: string;
  buttonLabel: string;
  action: (formData: FormData) => Promise<void>;
}

export function DeletePersonButton({
  personId,
  locale,
  confirmLabel,
  buttonLabel,
  action,
}: Props) {
  const [pending, start] = useTransition();

  function onClick() {
    if (!window.confirm(confirmLabel)) return;
    const fd = new FormData();
    fd.set('id', personId);
    fd.set('locale', locale);
    start(async () => {
      await action(fd);
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
