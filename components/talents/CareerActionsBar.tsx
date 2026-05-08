'use client';

import { useTransition } from 'react';
import { Trash2, RefreshCw } from 'lucide-react';

interface Props {
  deleteAction: () => Promise<{ ok: boolean }>;
  labels: { reupload: string; deleteAll: string; deleteConfirm: string };
}

export function CareerActionsBar({ deleteAction, labels }: Props) {
  const [pending, start] = useTransition();

  function onDelete() {
    if (!window.confirm(labels.deleteConfirm)) return;
    start(async () => {
      await deleteAction();
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        className="border-border press inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/30"
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden />
        {labels.deleteAll}
      </button>
      <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
        <RefreshCw className="h-3 w-3" aria-hidden />
        {labels.reupload}
      </span>
    </div>
  );
}
